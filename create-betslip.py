#!/usr/bin/python

import sys
import web
import re
import os

import simplejson as json
from decimal import *

import config
import wallet
        
web.config.debug = False
urls = (
    '/create-betslip', 'betslip'
)

app = web.application(urls, globals())

class betslip:        
    def GET(self):
        return 'Hello World'
    def POST(self):
        return save_betslip(json.loads(web.data()))


def save_betslip(betslip):
    "Verify the betslip, create an address for it and return it"
    if not 'accountid' in betslip:
        raise web.internalerror('No accountid')
    if not re.match('^[a-zA-Z0-9]{6,20}$', betslip['accountid']):
        raise web.internalerror('Invalid accountid')

    if not 'bets' in betslip:
        raise web.internalerror('No bets')

    # verify individual bets
    for game in betslip['bets']:
        if not os.path.exists('data/games/new/%d' % int(game['game'])):
            raise web.internalerror('Game not found')

        if not re.match('^[0-5]-[0-5]$', game['result']):
            raise web.internalerror('Invalid result')

        if not (config.MIN_BET <= Decimal(game['amount']) <= config.MAX_BET):
            raise web.internalerror('Invalid amount')


    adr = wallet.getaddress(betslip['accountid'])

    with open('data/bets/new/%s' % adr, 'w') as f:
        f.write(json.dumps(betslip, sort_keys=True, indent=4, separators=(',', ': ')))


    return adr




if __name__ == "__main__":
    if sys.argv[-1] == 'test':
        res = app.request('/create-betslip', 'POST', '{"accountid":"1234567","bets":[{"game":"326459","result":"1-0","amount":"0.002"}]}')
        print res
    else:
        print(argv[-1])
        app.run()

