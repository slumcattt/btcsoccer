#!/usr/bin/python


import os
import datetime
import logging
import btcs

def purge():

    # 1 => move old bets/new to bets/cancelled
    # 2 => move old bets/received to bets/archived (summing to bets/totals)
    # 3 => move old tx/new to tx/archived (summing to tx/totals)

    slips = os.listdir(btcs.path('bets/new', ''))

    maxage = datetime.datetime.utcnow() - datetime.timedelta(minutes = btcs.BETSLIP_RETENTION_MINUTES)
    def ftime(f): 
        return datetime.datetime.fromtimestamp(os.path.getmtime(btcs.path('bets/new',f)))
    slips = [f for f in slips if ftime(f) < maxage]

    for slip in slips:
        logging.info('Cancelled betslip: ' + slip)
        os.rename(btcs.path('bets/new', slip), btcs.path('bets/cancelled', slip))


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    purge()

