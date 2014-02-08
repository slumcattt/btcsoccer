#!/usr/bin/python

import config
import authproxy
from decimal import *


bitcoind = authproxy.AuthServiceProxy(config.BITCOIND)


def getaddress(accountid):
    return bitcoind.getnewaddress(accountid)

if __name__ == '__main__':
    print(bitcoind.getinfo())
