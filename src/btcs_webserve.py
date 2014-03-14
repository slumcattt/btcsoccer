#!/usr/bin/python

import sys
import web
import re
import os

import redis
import datetime

import simplejson as json
from decimal import *

import btcs
import wallet
        
web.config.debug = False
urls = (
    '/create-betslip', 'Betslip',
    '/add-chat', 'Chat'
)

app = web.application(urls, globals())

class Betslip:        
    def GET(self):
        return 'OK' # monitoring

    def POST(self):
        return save_betslip(json.loads(web.data()))

class Chat:
    def GET(self):
        return 'OK' # monitoring

    def POST(self):
        return chat(json.loads(web.data()))


def chat(msg):
    if not 'u' in msg:
        raise web.internalerror('No user')
    if not 'i' in msg:
        raise web.interneterror('No accountid')
    if not 'm' in msg:
        raise web.interneterror('No msg')

    if not re.match('^[a-zA-Z0-9]{6,20}$', msg['i']):
        raise web.internalerror('Invalid accountid')
    if not re.match('^[a-zA-Z0-9]{3,20}$', msg['u']):
        raise web.internalerrror('Invalid user')

    dt = datetime.datetime.utcnow().isoformat()
    dat = '%s/%s/%s' % (dt, msg['u'], msg['m']) 

    r = redis.Redis(host='127.0.0.1', port=6379, db=0)
    r.lpush('chat', dat)

    return "OK"




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
        if not os.path.exists(btcs.path('games/new', int(game['game']))):
            raise web.internalerror('Game not found')

        if not re.match('^[0-5]-[0-5]$', game['result']):
            raise web.internalerror('Invalid result')

        if not (btcs.MIN_BET <= Decimal(game['amount']) <= btcs.MAX_BET):
            raise web.internalerror('Invalid amount')


    adr = wallet.getaddress(betslip['accountid'])

    btcs.writejson(btcs.path('bets/new', adr), betslip)

    return adr




if __name__ == "__main__":
    if sys.argv[-1] == 'test':
        res = app.request('/create-betslip', 'POST', '{"accountid":"1234567","bets":[{"game":"326459","result":"1-0","amount":"0.002"}]}')
        print res
    else:
        app.run()

