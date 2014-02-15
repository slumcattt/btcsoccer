#!/usr/bin/python

import os
import pystache

from datetime import date, datetime, timedelta
import dateutil.parser
import btcs
from decimal import Decimal

import simplejson as json

import logging


# generate variadic files , key=lambda game: game['date'])/var

def render(template, data):
    "Renders a mustache template"
    renderer = pystache.Renderer()
    html = renderer.render_path('templates/' + template, data)
    with open(btcs.path('var', template), "w") as f:
        f.write(html.encode('utf8'))

    logging.info('Written: ' + template)

def generate_pub():

    # load all active games in memory
    games = { game: json.loads(open(btcs.path('games/new',game),'r').read()) 
            for game 
            in  os.listdir(btcs.path('games/new', ''))}


    files = os.listdir(btcs.path('bets/received', '')) 
    slips = [ json.loads(open(btcs.path('bets/received',slip),'r').read()) 
            for slip 
            in files]


    for gameid, game in games.iteritems():

        game['results'] = [ { "away": a, "cols": [ {
                "score": "0" 
            } for h in range(6) ] } for a in range(6) ]

        # sum all results found in bets
        for slip in slips:
            for bet in slip['bets']:
                if bet['game'] == gameid:
                    h,a = bet['result'].split('-')
                    h = int(h)
                    a = int(a)
                    game['results'][a]['cols'][h]['score'] = (
                        Decimal(game['results'][a]['cols'][h]['score']) +
                        Decimal(bet['amount']))
                    


    # walk again through slips to generate account info
    accounts = {}
    for slip in slips:
        if not slip['accountid'] in accounts:
            accounts[slip['accountid']] = {}
        for bet in slip['bets']:
            if not bet['game'] in accounts[slip['accountid']]:
                accounts[slip['accountid']][bet['game']] = []

            accounts[slip['accountid']][bet['game']].append(bet)


    for (accountid, account) in accounts.iteritems():
        with open(btcs.path('var', accountid), 'w') as f:
            f.write(json.dumps(account, sort_keys=True, indent=4, separators=(',', ': ')))

    games = sorted(games.values(), key=lambda game: game['date'])


    # split in live/today/later
    now = datetime.utcnow()
    maxtime_live = (now + timedelta(minutes = btcs.DEADLINE_MINS)).isoformat()
    maxtime_today = datetime(now.year, now.month, now.day, 23,59,59,0, None).isoformat()
    live  = [ game for game in games if game['date'] < maxtime_live]
    today = [ game for game in games if game['date'] >= maxtime_live and game['date'] < maxtime_today]
    later = [ game for game in games if game['date'] >= maxtime_today]
    alldata = { 'games': { 'live': live, 'today': today, 'later': later } }
    
    render('games.html', alldata)

    #print(alldata)



if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    generate_pub()



