#!/usr/bin/python


import sys
import os
from decimal import Decimal
import simplejson as json

import btcs
import logging

import wallet

def process_outgoing(gameid):

    logging.info('Processing game ' + gameid)

    # read betslip
    with open(btcs.path('games/finished', gameid),'r') as f:
        game = json.loads(f.read())
    

    # collect all bets for this game
    for betid in os.listdir(btcs.path('bets/received', '')):
        with open(btcs.path('bets/received', betid),'r') as f:
            betslip = json.loads(f.read())

        for bet in betslip['bets']:
            if bet['game'] == gameid:
                logging.info('processing bets: %s', repr(bet))


        
    # move to process for atomicity
    #os.rename(btcs.path('games/finished', gameid),
    #        btcs.path('games/process', gameid))






    #os.rename(btcs.path('games/process', gameid),
    #        btcs.path('games/archive', gameid))



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


