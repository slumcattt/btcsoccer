#!/usr/bin/python

import btcs
import authproxy
from decimal import *


bitcoind = authproxy.AuthServiceProxy(btcs.BITCOIND)


def getaddress(accountid):
    return bitcoind.getnewaddress(accountid)

def getreceivedby(address, minconf):
    return bitcoind.getreceivedbyaddress(address, minconf)

if __name__ == '__main__':
    print(bitcoind.getinfo())
