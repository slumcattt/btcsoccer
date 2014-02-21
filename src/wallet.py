#!/usr/bin/python

import btcs
import authproxy
from decimal import *


bitcoind = authproxy.AuthServiceProxy(btcs.BITCOIND)


def getaddress(accountid):
    return bitcoind.getnewaddress(accountid)

def getreceivedby(address, minconf):
    return bitcoind.getreceivedbyaddress(address, minconf)

def getlatesttx(address):
    account = bitcoind.getaccount(address)
    for n in range(0, 1000, 10):
        txs = bitcoind.listtransactions(account, 10, n)
        tx = [t for t in txs if t.get('address') == address]
        if tx:
            return tx[0]

def findreturnaddress(tx):

    raw_tx = bitcoind.decoderawtransaction(
            bitcoind.getrawtransaction(tx['txid']))

    # grab first input
    previous_raw_tx  = bitcoind.decoderawtransaction(
            bitcoind.getrawtransaction(raw_tx['vin'][0]['txid']))

    
    vout  = previous_raw_tx['vout'] \
        [raw_tx['vin'][0]['vout']] 

    return_address = vout['scriptPubKey']['addresses'][0]

    return return_address

def payout(outputs):
    bitcoind.sendmany('dispatch', outputs)

def movetodispatch(address, amount):
    account = bitcoind.getaccount(address)
    bitcoind.move(account, 'dispatch', amount)


if __name__ == '__main__':
    print(bitcoind.getinfo())
