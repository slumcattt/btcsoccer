
# Config module 

from decimal import *

SOCCER_URL   = "http://www.xmlsoccer.com/FootballData.asmx"
SOCCER_KEY   = "PHVDAYLCCFJMPDZSUODPDARGUNEWQFEJEZBAXLKFEJQMBTUNVH"

LEAGUES      = ('Serie A', 'La Liga', 'Eredivisie')

MATCHES_FILE = "data/cache/matches.xml"

MAX_DAYS_BEFORE   = 20
MAX_DAYS_AFTER    = 25

BITCOIND       = "http://bitcoinrpc:Am8eCsFJpvYqqbRaMVMJxMPP2tPczsFwD131iiKh68iM@127.0.0.1:8332"


ACCOUNT_PREFIX = "r"
MAX_SCORE      = 5
MAX_DAYS_BEFORE   = 20
MAX_DAYS_AFTER    = 25
DEADLINE_MINS = 10

MIN_BET  = Decimal('0.002')
MAX_BET  = Decimal('10')

RETURN_FEE = Decimal('0.0001')
WIN_FEE_PER_KB = Decimal('0.0001')
ROUND_WINS = Decimal('0.000001')

BTCS_FEE = Decimal('0.03')
BTCS_FEE_ADDRESS = '1FH21q37yFpzvd5mdWckeyvqwTY96day8E'

