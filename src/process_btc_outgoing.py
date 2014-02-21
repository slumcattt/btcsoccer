#!/usr/bin/python


import sys
import os
from decimal import Decimal
import simplejson as json
import datetime

import dateutil.parser
import btcs
import logging

import wallet

DRYRUN = True

def within_deadline(game, bet):
    bettime  = datetime.datetime.fromtimestamp(bet['latesttx']['time'], dateutil.tz.tzutc())
    gametime = dateutil.parser.parse(game['date'])

    logging.info('bet=%s, game=%s', repr(bettime), repr(gametime))

    return bettime < gametime

def sum_bets(bets):
    return sum(Decimal(bet['amount']) for bet in bets)


def payout(bets, total):
    " payout the amount of total divided over bets "

    divider = sum_bets(bets)
    outputs = {}

    for bet in bets:
        amount = Decimal(bet['amount']) / divider * total

        # could be double, then add
        if bet['return_address'] in outputs:
            amount = amount + outputs[bet['return_address']] 

        outputs[bet['return_address']] = amount

    logging.info('Paying: %s', repr(outputs))
    if not DRYRUN:
        wallet.payout(outputs)

def process_outgoing(gameid):

    # read betslip
    with open(btcs.path('games/finished', gameid),'r') as f:
        game = json.loads(f.read())
    
    if game['time'] in ['Abandonded', 'Postponed']:
        result = game['time'] # this will result in everyone is wrong
    else:
        result = game['result']

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

        # add latest transaction and return_address to bets
        for bet in gamebets:
            bet['latesttx'] = tx
            if 'return_address' in betslip:
                bet['return_address'] = betslip['return_address']
            else:
                bet['return_address'] = wallet.findreturnaddress(tx)


        if within_deadline(game, bet):
            if bet['result'] == result:
                correctbet.append(bet)
            else:
                wrongbet.append(bet)
        else:
            invalidbet.append(bet)

    # move to process for atomicity
    if not DRYRUN:
        os.rename(btcs.path('games/finished', gameid),
            btcs.path('games/process', gameid))

    # process payouts
    if invalidbet:
        logging.info('Invalid: ' + repr(invalidbet))

        payout(invalidbet, sum_bets(invalidbet))

    if len(correctbet) >0:
        logging.info('Correct: ' + repr(correctbet))
        logging.info('Wrong  : ' + repr(wrongbet))

        total = sum_bets(wrongbets) * (Decimal('1') - btcs.BTCS_FEE) + sum_bets(correctbet)
        payout(correctbet, total )

    elif len(wrongbet) > 0:
        logging.info('Only wrong bets: ' + repr(correctbet))

        payout(wrongbet, sum_bets(wrongbet))


    

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


