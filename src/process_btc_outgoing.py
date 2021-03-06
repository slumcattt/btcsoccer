#!/usr/bin/python


import sys
import os
from decimal import Decimal
import simplejson as json
import datetime

import dateutil.parser
import btcs
import logging

import notify_email

import wallet

DRYRUN = False

def within_deadline(game, bet):
    bettime  = datetime.datetime.fromtimestamp(bet['latesttx']['time'], dateutil.tz.tzutc())
    gametime = dateutil.parser.parse(game['date'])

    if bettime >= gametime:
        logging.warning('Bet overdue: %s (game=%s)' % (repr(bet), repr(game)))

    return bettime < gametime

def sum_bets(bets):
    return sum(Decimal(bet['amount']) for bet in bets)


def payout(bets, total, game, txtype):
    " payout the amount of total divided over bets "

    divider = sum_bets(bets)
    outputs = {}

    for bet in bets:
        amount = Decimal(bet['amount']) / divider * total
        bet['payout'] = "%.2f" % amount
        bet['txtype'] = txtype

        # could be betted twice thus add
        if bet['return_address'] in outputs:
            amount = amount + outputs[bet['return_address']] 

        outputs[bet['return_address']] = amount

    # from mbtc to btcs
    for o in outputs:
        outputs[o] = outputs[o] / Decimal(1000)

    

    logging.info('Paying: %s', repr(outputs))
    if not DRYRUN:
        txid = wallet.payout(outputs)

        btcs.writejson(btcs.path('tx/new', txid), {
            "type": txtype,
            "game": game,
            "outputs": outputs })

        return txid
    else:
        return 'dryrun'


def winner(result):
    h,a = result.split('-')
    if int(h) > int(a):
        return 'HOME'
    elif int(a) > int(h):
        return 'AWAY'
    else:
        return 'DRAW'


def process_outgoing(gameid):

    # read betslip
    with open(btcs.path('games/finished', gameid),'r') as f:
        game = json.loads(f.read())
    
    if game['time'] in ['Abandonded', 'Postponed']:
        result = game['time'] # this will result in everyone is wrong
    elif game['time'] == ['Finished AP']:
        # penalties, only count winner
        result = winner(game['result'])
        logging.info('Finished with penalties; winner=%s' % result)

    elif game['time'] in ['Finished', 'Finished AET']:
        result = game['result']
    else:
        raise Exception('Unknown result type: %s' % game['time'])

    logging.info('Processing game %s; Result is %s', gameid, result)

    # collect all bets for this game
    correctbet = []
    wrongbet   = []
    invalidbet = []

    for betslipid in os.listdir(btcs.path('bets/received', '')):
        with open(btcs.path('bets/received', betslipid),'r') as f:
            betslip = json.loads(f.read())

        gamebets = [bet for bet in betslip['bets'] if bet['game'] == gameid]

        if not gamebets:
            continue

        # find the latest transaction for this slip
        tx = wallet.getlatesttx(betslipid)
        logging.info('TX = %s' % repr(tx))

        # add latest transaction and return_address and email_address to bets 
        for bet in gamebets:
            bet['latesttx'] = tx
            if 'return_address' in betslip:
                bet['return_address'] = betslip['return_address']
            else:
                bet['return_address'] = wallet.findreturnaddress(tx)

            if 'email_address' in betslip:
                bet['email_address'] = betslip['email_address']

            if within_deadline(game, bet):
                if bet['result'] == result or winner(bet['result']) == result:
                    correctbet.append(bet)
                else:
                    wrongbet.append(bet)
            else:
                invalidbet.append(bet)

            wallet.movetodispatch(betslipid, Decimal(bet['amount']) / Decimal('1000'))

    # move to process for atomicity
    if not DRYRUN:
        os.rename(btcs.path('games/finished', gameid),
            btcs.path('games/process', gameid))


    # process payouts
    if invalidbet:
        logging.info('Invalid: ' + repr(invalidbet))

        payout_tx = payout(invalidbet, sum_bets(invalidbet), game, 'invalid')

    if len(correctbet) >0:
        logging.info('Correct: ' + repr(correctbet))
        logging.info('Wrong  : ' + repr(wrongbet))

        total = sum_bets(wrongbet) * (Decimal('1') - btcs.BTCS_FEE) + sum_bets(correctbet)
        logging.info('Total wrong %s, total correct %s payout %s' % (
            repr(sum_bets(wrongbet)), repr(sum_bets(correctbet)), repr(total)))
        payout_tx = payout(correctbet, total, game, 'winnings' )

    elif len(wrongbet) > 0:
        logging.info('Only wrong bets: ' + repr(wrongbet))

        payout_tx = payout(wrongbet, sum_bets(wrongbet), game, 'allwrong' )


    # grab all email_addresses (ignore invalids)
    allbets = wrongbet + correctbet
    allemails = set([ bet['email_address'] for bet in allbets if 'email_address' in bet])

    for email in allemails:
        data = { 
            "email": email,
            "game": game, 
            "txid": payout_tx,
            "bets": [ bet for bet in allbets if 'email_address' in bet and bet['email_address'] == email]
        }

        for bet in data['bets']:
            if not 'txtype' in bet:
                bet['txtype'] = 'lost'
            elif bet['txtype'] == 'allwrong':
                bet['txtype'] = 'refund'
            else:
                bet['txtype'] = 'won'

        subj = 'Result: %s - %s  %s' % (game['home'], game['away'], game['result'])
        notify_email.sendmail('email_result.html', data, email, subj)


    if not DRYRUN:
        os.rename(btcs.path('games/process', gameid),
            btcs.path('games/archive', gameid))



def process_outgoing_all():
    for game in os.listdir(btcs.path('games/finished','')):
        process_outgoing(game)



if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    if len(sys.argv) != 2:
        print('Pass --all or game as parameter')
    elif sys.argv[-1] == '--all':
        process_outgoing_all()
    else:
        process_outgoing(sys.argv[-1])


