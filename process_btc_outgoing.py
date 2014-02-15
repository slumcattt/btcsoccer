#!/usr/bin/python


import sys
import os
from decimal import Decimal
import simplejson as json

import btcs
import logging

import wallet

def process_outgoing(game):

    logging.info('Processing game ' + game)

    # read betslip
    with open(btcs.path('games/finished', game),'r') as f:
        game_data = json.loads(f.read())
    
    # We will found the
    os.rename(btcs.path('games/finished', game),
            btcs.path('games/process', game))



    os.rename(btcs.path('games/process', game),
            btcs.path('games/archive', game))



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


