#!/usr/bin/python


import sys
import os

import config

def process_incoming(betslip):
    print('processing ' + betslip)

def process_incoming_all():
    for betslip in os.listdir(config.path('bets/new','')):
        process_incoming(betslip)



if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Pass --all or betslip-address as parameter')
    elif sys.argv[-1] == '--all':
        process_incoming_all()
    else:
        process_incoming(sys.argv[-1])


