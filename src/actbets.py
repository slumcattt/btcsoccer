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


def status():

    # load all active games in memory
    games = { game: json.loads(open(btcs.path('games/new',game),'r').read()) 
            for game 
            in  os.listdir(btcs.path('games/new', ''))}


    # load all active betslips
    slipids = os.listdir(btcs.path('bets/received', '')) 
    slips = { slipid: json.loads(open(btcs.path('bets/received',slipid),'r').read()) 
            for slipid 
            in slipids}

    for gameid, game in games.iteritems():

        logging.info('Game: ' + str(game))
        logging.info('------')

        # sum all results found in bets
        for slip in slips.values():
            for bet in slip['bets']:
                if bet['game'] == gameid:
                    logging.info('Bet ' + str(slip['email_address']))

        # calculate multply

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    status()



