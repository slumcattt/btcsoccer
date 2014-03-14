#!/usr/bin/python

import logging
import logging.handlers
import time

import load_games
import process_btc_incoming
import process_btc_outgoing
import generate_var
import generate_chat
import purge

import ctypes, signal


#setup logging
logger = logging.getLogger('')
logger.setLevel(logging.DEBUG)
handler = logging.handlers.TimedRotatingFileHandler(
        '../log/btcs.log', when="midnight")
handler.setFormatter(logging.Formatter('%(asctime)s %(name)-12s %(levelname)-8s %(message)s'))
logger.addHandler(handler)
logger.addHandler(logging.StreamHandler())

libc = ctypes.cdll.LoadLibrary("libc.so.6")

while True:

    # turn off signals during processing
    libc.sighold(signal.SIGKILL)
    libc.sighold(signal.SIGTERM)
    libc.sighold(signal.SIGINT)
    libc.sighold(signal.SIGHUP)

    try:
        load_games.get_matches()
        process_btc_incoming.process_incoming_all()
        process_btc_outgoing.process_outgoing_all()  
        generate_var.generate_pub()
        generate_chat.generate_chat()
        purge.purge()
    except Exception, e:
        logging.exception('Error during btcs processing')
        raise e

    libc.sigrelse(signal.SIGKILL)
    libc.sigrelse(signal.SIGTERM)
    libc.sigrelse(signal.SIGINT)
    libc.sigrelse(signal.SIGHUP)

    time.sleep(5)






