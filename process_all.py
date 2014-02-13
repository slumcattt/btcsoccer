#!/usr/bin/python

import logging

import process_btc_incoming

logging.basicConfig(filename='log/btcs.log',format='%(asctime)s:%(levelname)s:%(module)s:%(lineno)d:%(message)s', level=logging.DEBUG)

process_btc_incoming.process_incoming_all()

