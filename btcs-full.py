#!/bin/python

from xml.etree import ElementTree

from datetime import date, datetime, timedelta
from os import listdir
import time

import authproxy
import pprint
import urllib2, re
import simplejson as json
import pystache
import dateutil.parser
import os.path
import shutil
from decimal import *

BITCOIND   = "http://bitcoinrpc:Am8eCsFJpvYqqbRaMVMJxMPP2tPczsFwD131iiKh68iM@127.0.0.1:8332"
SOCCER_URL = "http://www.xmlsoccer.com/FootballData.asmx"
SOCCER_KEY = "PHVDAYLCCFJMPDZSUODPDARGUNEWQFEJEZBAXLKFEJQMBTUNVH"

LEAGUES    = ('Serie A', 'La Liga', 'Eredivisie')

MATCHES_FILE = "./matches.xml"

OUTPUT = '/var/www/btcsoccer/'

ACCOUNT_PREFIX = "r"
MAX_SCORE  = 5
MAX_DAYS_BEFORE   = 20
MAX_DAYS_AFTER    = 25
DEADLINE_MINS = 30

MIN_BET  = Decimal('0.002')
MAX_BET  = Decimal('10')

RETURN_FEE = Decimal('0.0001')
WIN_FEE_PER_KB = Decimal('0.0001')
ROUND_WINS = Decimal('0.000001')

BTCS_FEE = Decimal('0.03')
BTCS_FEE_ADDRESS = '1FH21q37yFpzvd5mdWckeyvqwTY96day8E'

IMGS = ['flags.png']

bitcoind = authproxy.AuthServiceProxy(BITCOIND)

class Account:
    """ An account represents a single score for a single match """

    def __init__(self, account):
        assert(re.match(r'^'+ACCOUNT_PREFIX+r'-\d+-\d+-\d+$', account) != None)

        self.account = account

        self._make_wallet()

    def _make_wallet(self):
        """ Insantiate self.address with new or existing wallet address """

        # First find existing address
        addresses = bitcoind.getaddressesbyaccount(self.account)
        if len(addresses) == 1:
            self.address = addresses[0]
            #print("    Reusing address for %s: %s " % (self.account, self.address))

        elif len(addresses) == 0:
            # create new
            self.address = bitcoind.getaccountaddress(self.account)
            print("    Creating address for %s: %s " % (self.account, self.address))

        else:
            print("    Addresses: ", str(addresses))
            raise Exception("More then one address for account:" + self.account)

        return self.address

    def _isvalid_tx(self, tx, deadline):
        """Determine if a transaction is invalid, either because its amount is out of bounds
        or because it is submitted after the deadline"""

        time   = datetime.fromtimestamp(tx['time'], dateutil.tz.tzutc())
        print('tx date= %s, deadline= %s' % (time, deadline))
        amount = tx['amount']
        return time < deadline and amount >= MIN_BET and amount <= MAX_BET;
        

    def _get_sender(self, unspent):
        """ Finds the sender-address of the given unspent output """
        print(repr(unspent))

        raw_tx = bitcoind.decoderawtransaction(
                bitcoind.getrawtransaction(unspent['txid']))

        # grab first input
        previous_raw_tx  = bitcoind.decoderawtransaction(
                bitcoind.getrawtransaction(raw_tx['vin'][0]['txid']))
        
        return_address = previous_raw_tx['vout'] \
            [raw_tx['vin'][0]['vout']] \
            ['scriptPubKey']['addresses'][0]

        print('            Find sender:raw: %s\n\n            Previous: %s\n\n             Return to {%s}' %
                ( raw_tx, previous_raw_tx, return_address))

        return return_address

    def _return_to_sender(self, unspent):
        """Returns the money from unspent transaction to the sender"""

        return_address = self._get_sender(unspent)

        # substract tx-fee if possible
        return_amount = unspent['amount'] - RETURN_FEE
        if return_amount <= 0:
             print("            Return amount to small to include fee")
             return_amount = unspent['amount']

        # Create new transaction
        new_tx_hex = bitcoind.createrawtransaction(
            [{ 'txid': unspent['txid'], 'vout': unspent['vout']}],
            { return_address: (return_amount) })

        new_tx = bitcoind.signrawtransaction(new_tx_hex)
        print('            TX=' + str(new_tx))
        print('            raw=' + str(bitcoind.decoderawtransaction(new_tx['hex'])))

        new_tx_id = bitcoind.sendrawtransaction(new_tx['hex'])
        print('        Returned: ' + new_tx_id)

    def return_all(self, deadline):
        """ Returns all valid unspent outputs to the sender for this account """

        for unspent in self.gather_unspent_bets(deadline, True):

            print ("    Returning TX %s vout %d" % (unspent['txid'], unspent['vout'] ) )
            self._return_to_sender(unspent)


    def return_invalids(self, deadline):
        """ Return the invalid unspent outputs to the sender for this account """

        for unspent in self.gather_unspent_bets(deadline, False):

            print ("    Returning TX %s vout %d" % (unspent['txid'], unspent['vout'] ) )
            self._return_to_sender(unspent)


    def gather_unspent_bets(self, deadline, valid):
        """ Gathers the unspent outputs, either valid or invalid """

        return [
                unspent for unspent in bitcoind.listunspent(0,999999, [self.address])
                if self._isvalid_tx(bitcoind.gettransaction(unspent['txid']), deadline) == valid]

    def distribute_profits(self, deadline, all_valid_unspent):
        """ Create and send a transaction with the given array of unspents as inputs
        and the senders to this account as outputs"""

        sum_all = sum(unspent['amount'] for unspent in all_valid_unspent)
        print('        Gathered %g btc from %d unspents' % (sum_all, len(all_valid_unspent)))

        inputs = [ { 'txid': unspent['txid'], 'vout': unspent['vout'] } for unspent in all_valid_unspent ]

        # initiate outputs with there bet-amount as amount just to determine TX-size
        outputs = { self._get_sender(unspent): unspent['amount']   
                for unspent in self.gather_unspent_bets(deadline, True) }

        # Create new transaction and determine size
        new_tx_hex = bitcoind.createrawtransaction(inputs, outputs)
        new_tx = bitcoind.signrawtransaction(new_tx_hex)
        txlen = (len(new_tx['hex']) / 2048) + 1  # len in kb (hex is two bytes/byte)
        txfee = WIN_FEE_PER_KB * Decimal(txlen)

        output_divisor = sum(outputs.itervalues())
        outputs[BTCS_FEE_ADDRESS] = BTCS_FEE * output_divisor
        output_divisor = sum(outputs.itervalues())

        profits = sum_all - txfee
        for addr in outputs:
            outputs[addr] = (profits * outputs[addr] / output_divisor).quantize(ROUND_WINS, rounding=ROUND_DOWN)

        print('        Outputs ='+str(outputs))

        new_tx_hex = bitcoind.createrawtransaction(inputs, outputs)
        new_tx = bitcoind.signrawtransaction(new_tx_hex)
        new_tx_id = bitcoind.sendrawtransaction(new_tx['hex'])
        print('        Returned: ' + new_tx_id)


    def sum_bets(self, deadline):
        return sum(
            [ tx['amount'] 
            for tx in bitcoind.listtransactions(self.account)
            if  tx['category'] == 'receive' 
            and self._isvalid_tx(tx, deadline) ])



class Match:
    def __init__(self, xml):

        # load xml data as members
        self.home_id  = xml.find('HomeTeam_Id').text
        self.away_id  = xml.find('AwayTeam_Id').text
        self.home     = xml.find('HomeTeam').text
        self.away     = xml.find('AwayTeam').text
        self.location = xml.find('Location').text
        self.league   = xml.find('League').text
        self.id       = xml.find('Id').text
        self.localtime = xml.find('Date').text

        self.is_done  = xml.find('Time') is not None and xml.find('Time').text == 'Finished'


        # create results as array of arrays;
        # this format is required for proper rendering in pystache
        self.results = [ { "row": [ {
                "account": "%s-%s-%d-%d" % (ACCOUNT_PREFIX, self.id, h,a),
                "score": "%d-%d" % (h,a) 
            } for a in range(6) ] } for h in range(6) ]

        if self.is_done:
            home = int(xml.find('HomeGoals').text)
            away = int(xml.find('AwayGoals').text)
            self.score = "%d-%d" % (home,away)


    def __str__(self):
        return "[<Match %s-%s @%s]" % (self.home, self.away, self.location)

    def time(self):
        return dateutil.parser.parse(self.localtime).astimezone(dateutil.tz.tzutc())

    def deadline(self):
        return self.time() - timedelta(minutes = DEADLINE_MINS)

    def _gather_unspent_bets(self):
        """ Gather all valid unspent bets and return them in an array """
        all_valid_unspent = []
        for row in self.results:
            for result in row["row"]:
                a = Account(result['account'])
                for u in a.gather_unspent_bets(self.deadline(), True):
                    all_valid_unspent.append(u)
        return all_valid_unspent

    def process(self):
        """Process the match wallet and all its transactions """ 

        winner = None

        print 'Game %s' % self
        print '    Creating wallets and returning invalid bets' 

        for row in self.results:
            for result in row["row"]:
                a = Account(result['account'])
                result['bets']  = a.sum_bets(self.deadline())
                result['address']  = a.address

                a.return_invalids(self.deadline())

                if getattr(self, 'score', '') == result['score'] and result['bets'] > 0:
                    winner = a

        if not self.is_done:
            print '    Match not yet finished'

        elif winner:

            unspent_bets = self._gather_unspent_bets()

            if (len(unspent_bets) == 0):
                print '    Match profits already distributed'
            else:
                print '    Creating winners TX'
                winner.distribute_profits(self.deadline(), unspent_bets)
                print '    winner transaction created'

        else:
            # no winner. return all bets from all accounts
            for row in self.results:
                for result in row["row"]:
                    a = Account(result['account'])
                    a.return_all(self.deadline())

            print '    no winner, returned all bets'


        print '\n'





def get_matches():
    """Grabs match data from server, processes the results and returns match objects"""

    start = (date.today() - timedelta(days=MAX_DAYS_BEFORE)).isoformat()
    end   = (date.today() + timedelta(days=MAX_DAYS_AFTER)).isoformat()
    url   = "%s/GetFixturesByDateInterval?apikey=%s&startDateString=%s&endDateString=%s" \
            % (SOCCER_URL, SOCCER_KEY, start, end)
    

    if os.path.exists(MATCHES_FILE) and (time.time() - os.path.getmtime(MATCHES_FILE) < 60 * 10):
        print('Reading matchcache from %s' % MATCHES_FILE)
        matches_data = open("matches.xml").read()
    else:
        print('Reading from %s ' % url)
        matches_data = urllib2.urlopen(url).read()
        print('Read data (%d bytes)' % len(matches_data))

    
    matches_xml  = ElementTree.fromstring(matches_data)

    if matches_xml.find('Match') is None:
        raise Exception('No matches returned; data read: %s' % matches_data)

    # cache results
    with open(MATCHES_FILE, 'w') as f:
        f.write(matches_data)

    matches = []
    for match_xml in matches_xml.findall('Match'):
        match = Match(match_xml)
        if match.league in LEAGUES:
            match.process()
            matches.append(match)

    print('%d matches processed' % len(matches))

    return matches


def render(template, data):
    renderer = pystache.Renderer()
    html = renderer.render_path('templates/' + template, data)
    with open(OUTPUT + template, "w") as f:
        f.write(html.encode('utf8'))

    print('Written: ' + template)

now = time.time() 

# copy css and js with hashes
target = {}
for ext in ['css', 'js']:
    with open('templates/btcs.'+ext, 'r') as f:
        buf = f.read()
    target[ext] = 'btcs-%X.%s' % (sum(bytearray(buf)), ext)
    shutil.copyfile('templates/btcs.' + ext, OUTPUT + target[ext])

# copy imgs
for img in IMGS:
    shutil.copyfile('templates/'+ img, OUTPUT + img)




matches = get_matches()

with open(OUTPUT + 'matches.json', 'w') as f:
    f.write(json.dumps([m.__dict__ for m in matches], sort_keys=True, indent=4, separators=(',', ': ')))

info = { 
    'version': '1.0',
    'balance': bitcoind.getbalance(),
    'css': target['css'],
    'js':  target['js'],
    'duration': int(time.time() - now),
    'time': datetime.now().isoformat()
}

with open(OUTPUT + 'info.json', 'w') as f:
    f.write(json.dumps(info, sort_keys=True, indent=4, separators=(',', ': ')))

render('matches.html', { 'info': info, 'matches': [m.__dict__ for m in reversed(matches) if not m.is_done ]})
render('results.html', { 'info': info, 'matches': [m.__dict__ for m in matches if m.is_done ]})
render('about.html', { 'info': info })

