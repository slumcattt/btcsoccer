
# Config module 

from decimal import *
import simplejson as json

SOCCER_URL   = "http://www.xmlsoccer.com/FootballData.asmx"
SOCCER_KEY   = "PHVDAYLCCFJMPDZSUODPDARGUNEWQFEJEZBAXLKFEJQMBTUNVH"

LEAGUES      = ('Bundesliga', 'Europe League', 'Serie A', 'La Liga', 
                'Eredivisie', 'Champions League', 'English Premier League')



BITCOIND       = "http://bitcoinrpc:Am8eCsFJpvYqqbRaMVMJxMPP2tPczsFwD131iiKh68iM@127.0.0.1:8332"

MAX_DAYS_BEFORE   = 3
MAX_DAYS_AFTER    = 6
DEADLINE_MINS = 0

MIN_BET  = Decimal('0.002')
MAX_BET  = Decimal('10')


BTCS_FEE = Decimal('0.02')

BETSLIP_RETENTION_MINUTES = 240

def path(sub, id):
    return '../data/%s/%s' % (sub, str(id))

def writejson(path, data):
    with open(path, 'w') as f:
        f.write(json.dumps(data, sort_keys=True, indent=4, separators=(',', ': ')))

