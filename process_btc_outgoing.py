#!/usr/bin/python


import sys
import os
from decimal import Decimal
import simplejson as json

import btcs

import wallet

def process_outgoing(game):

    pass
    



def process_outgoing_all():
    for game in os.listdir(config.path('games/finished','')):
        process_outgoing(game)



if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Pass --all or game as parameter')
    elif sys.argv[-1] == '--all':
        process_outgoing_all()
    else:
        process_outgoing(sys.argv[-1])


