
# Config module 

from decimal import *
import simplejson as json

SOCCER_URL   = "http://www.xmlsoccer.com/FootballData.asmx"
SOCCER_KEY   = "PHVDAYLCCFJMPDZSUODPDARGUNEWQFEJEZBAXLKFEJQMBTUNVH"

LEAGUES      = ('Serie A', 'La Liga', 'Eredivisie')


MAX_DAYS_BEFORE   = 2
MAX_DAYS_AFTER    = 8

BITCOIND       = "http://bitcoinrpc:Am8eCsFJpvYqqbRaMVMJxMPP2tPczsFwD131iiKh68iM@127.0.0.1:8332"

ACCOUNT_PREFIX = "r"
MAX_SCORE      = 5
MAX_DAYS_BEFORE   = 3
MAX_DAYS_AFTER    = 6
DEADLINE_MINS = 10

MIN_BET  = Decimal('0.002')
MAX_BET  = Decimal('10')

RETURN_FEE = Decimal('0.0001')

BTCS_FEE = Decimal('0.03')

BETSLIP_RETENTION_MINUTES = 240

def path(sub, id):
    return '../data/%s/%s' % (sub, str(id))

def writejson(path, data):
    with open(path, 'w') as f:
        f.write(json.dumps(data, sort_keys=True, indent=4, separators=(',', ': ')))

