#!/usr/bin/python

import logging
import time

import load_games
import process_btc_incoming
#import process_btc_outgoing
import generate_var

import ctypes, signal

logging.basicConfig(filename='../log/btcs.log',format='%(asctime)s:%(levelname)s:%(module)s:%(lineno)d:%(message)s', level=logging.DEBUG)

libc = ctypes.cdll.LoadLibrary("libc.so.6")

while True:

    libc.sighold(signal.SIGKILL)
    libc.sighold(signal.SIGTERM)
    libc.sighold(signal.SIGINT)
    libc.sighold(signal.SIGHUP)

    load_games.get_matches()
    process_btc_incoming.process_incoming_all()
    # process_btc_outgoing.process_outgoing_all()  
    generate_var.generate_pub()

    libc.sigrelse(signal.SIGKILL)
    libc.sigrelse(signal.SIGTERM)
    libc.sigrelse(signal.SIGINT)
    libc.sigrelse(signal.SIGHUP)

    time.sleep(15)






