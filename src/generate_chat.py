#!/usr/bin/python

import os

import btcs

import redis

import logging

def generate_chat():

    r = redis.Redis(host='127.0.0.1', port=6379, db=0)

    with open(btcs.path('var', 'chat.html'), 'w') as f:
        for msg in r.lrange('chat', 0,100):
            f.write(msg)



    #print(alldata)



if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    generate_chat()



