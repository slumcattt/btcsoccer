#!/usr/bin/python

import os
import pystache

from datetime import date, datetime, timedelta
import dateutil.parser
import wallet
import btcs
import math
from decimal import Decimal

import simplejson as json

import logging
def modification_date(filename):
    t = os.path.getmtime(filename)
    return datetime.fromtimestamp(t)

# generate variadic files , key=lambda game: game['date'])/var

def render(template, data):
    "Renders a mustache template"
    renderer = pystache.Renderer()
    html = renderer.render_path('../templates/' + template, data)
    with open(btcs.path('var', template), "w") as f:
        f.write(html.encode('utf8'))

    logging.info('Written: ' + template)

def generate_pub():

    # load all active games in memory
    games = { game: json.loads(open(btcs.path('games/new',game),'r').read()) 
            for game 
            in  os.listdir(btcs.path('games/new', ''))}


    # load all active betslips
    slipids = os.listdir(btcs.path('bets/received', '')) 
    slips = { slipid: json.loads(open(btcs.path('bets/received',slipid),'r').read()) 
            for slipid 
            in slipids}

    # setup stats
    stats = { 
        'balance':              wallet.getbalance() * 1000,
        'balance_dispatch':     wallet.getbalancedispatch() * 1000,
        'total_bets_open':      0,
        'total_bets_open_mbtc': 0,
        'total_bets':           0,
        'total_bets_mbtc':      0
    }

    for gameid, game in games.iteritems():

        # game result in a format suitable for template rendering
        game['results'] = [ { "away": a, "cols": [ {
                "score": 0 
            } for h in range(6) ] } for a in range(6) ]

        game['total'] = 0

        # sum all results found in bets
        for slip in slips.values():
            for bet in slip['bets']:
                if bet['game'] == gameid:
                    h,a = bet['result'].split('-')
                    h,a = int(h), int(a)
                    am = int(bet['amount'])
                    game['results'][a]['cols'][h]['score'] = (
                        game['results'][a]['cols'][h]['score'] + am)
                    game['total'] = game['total'] + am
                    stats['total_bets_open']+=1
                    stats['total_bets_open_mbtc'] += am

        # calculate multply
        for a in range(6):
            for h in range(6):
                s = game['results'][a]['cols'][h]['score']

                # calculate estimated multiplier
                # the multiplier is total+bet / betted_here+bet
                minbet = btcs.MIN_BET * 1000
                mult = (game['total'] + minbet) / (minbet + s)
                # round depends on size
                if mult<2: 
                    mult = 'x' + str(math.floor(mult*10)/10)
                else:
                    mult = 'x' + str(math.floor(mult))
                if mult[-2:] == '.0':
                    mult = mult[:-2]
                game['results'][a]['cols'][h]['multiply'] = mult



    # walk again through slips to generate account info
    # and get totals
    accounts = {}
    for slipid in slips:
        slip = slips[slipid]
        if not slip['accountid'] in accounts:
            accounts[slip['accountid']] = { 'slips': [] }
        for bet in slip['bets']:
            if not bet['game'] in accounts[slip['accountid']]:
                accounts[slip['accountid']][bet['game']] = []

            accounts[slip['accountid']][bet['game']].append(bet)

            stats['total_bets']+=1
            stats['total_bets_mbtc'] += int(bet['amount'])

        accounts[slip['accountid']]['slips'].append(slipid)


    # write account-details
    for (accountid, account) in accounts.iteritems():
        btcs.writejson(btcs.path('var', accountid), account)

    # sort by game date
    games = sorted(games.values(), key=lambda game: game['date'])

    # walk through games to generate data for templates
    for game in games:
        game['status'] = game['time']

        if 'result' in game:
            (game['home_score'], game['away_score']) = game['result'].split('-')

        for f in ['home_goal_details', 'away_goal_details']:
            if f in game:
                if game[f]:
                    game[f] = game[f].replace(';',"\n")
                else:
                    game[f] = ' '




    # split in live/today/later
    now = datetime.utcnow()
    #if os.path.exists(btcs.path('input', 'matches_live.xml')):
    #    now = modification_date(btcs.path('input', 'matches_live.xml'))

    maxtime_live = (now + timedelta(minutes = btcs.DEADLINE_MINS)).isoformat()
    maxtime_today = datetime(now.year, now.month, now.day, 23,59,59,0, None).isoformat()


    live  = [ game for game in games if game['date'] < maxtime_live]
    today = [ game for game in games if game['date'] >= maxtime_live and game['date'] < maxtime_today]
    later = [ game for game in games if game['date'] >= maxtime_today]


    alldata = { 'games': { 'live': live, 'today': today, 'later': later } }
    
    render('games.html', alldata)

    # now we're gonne generate stats

    # find latest txids from disk
    txids = os.listdir(btcs.path('tx/new', '')) 

    # load their data
    txs = [ { "txid": txid, "info": json.loads(open(btcs.path('tx/new',txid),'r').read()) }
            for txid 
            in txids]

    txs.sort(key= lambda x: x['info']['game']['date'])
    txs.reverse()
    txs = txs[:btcs.TX_HIST_COUNT]

    def sumtx(txtype, txs):
        total = 0
        for tx in txs:
            if tx['info']['type'] == txtype:
                total += sum(tx['info']['outputs'].values()) 
        return total * 1000

    stats['total_tx_winnings'] = sumtx('winnings', txs)
    stats['total_tx_allwrong'] = sumtx('allwrong', txs)
    stats['total_tx_invalid'] = sumtx('invalid', txs)

    # we should transform tx output dict to array for mustache rendering
    for tx in txs:
        tx['outputs'] = [ {"address": k, "amount":v*1000} for k,v in tx['info']['outputs'].items()]
        tx['game'] = tx['info']['game']
        tx['game']['date'] = tx['game']['date'][:10]
        tx['type'] = tx['info']['type'].replace('allwrong', 'refund')
    stats['txs'] = txs


    render('stats.html', stats)



if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    generate_pub()



