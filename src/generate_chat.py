#!/usr/bin/python

import os

import btcs

import pystache
import redis

import logging

def render(template, data):
    "Renders a mustache template"
    renderer = pystache.Renderer()
    html = renderer.render_path('../templates/' + template, data)
    with open(btcs.path('var', template), "w") as f:
        f.write(html.encode('utf8'))

    logging.info('Written: ' + template)

def generate_chat():

    r = redis.Redis(host='127.0.0.1', port=6379, db=0)

    msgs = r.lrange('chat', 0,100)[::-1]
    ar = []
    for msg in msgs:
        try:
            msg = msg.decode('utf8')
            msg = msg.split('/')
            ar.append({"t": msg[0], "u": msg[1], "m": '/'.join(msg[2:])})
        except:
            logging.exception('Error during chat processing (msg=%s)' % repr(msg))

    render('chat.html', {"msgs": ar })



    #print(alldata)



if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    generate_chat()



