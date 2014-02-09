#!/usr/bin/python

import os
import pystache

from datetime import date, datetime, timedelta
import dateutil.parser
import config

import simplejson as json

# generate variadic files in pub/var

def render(template, data):
    "Renders a mustache template"
    renderer = pystache.Renderer()
    html = renderer.render_path('templates/' + template, data)
    with open('data/var/' + template, "w") as f:
        f.write(html.encode('utf8'))

    print('Written: ' + template)
def generate_pub():

    # load all active games in memory

    
    game_files = os.listdir('data/games/new')

    games = [ json.loads(open('data/games/new/'+game,'r').read()) for game in game_files ]

    accounts = []

    for game in games:
        game['results'] = [ { "away": a, "cols": [ {
                "account": "x",
                "score": "1" 
            } for h in range(6) ] } for a in range(6) ]

    # split in live/today/later
    now = datetime.utcnow()
    maxtime_live = (now + timedelta(minutes = config.DEADLINE_MINS)).isoformat()
    maxtime_today = datetime(now.year, now.month, now.day, 23,59,59,0, None).isoformat()
    live  = [ game for game in games if game['date'] < maxtime_live]
    today = [ game for game in games if game['date'] >= maxtime_live and game['date'] < maxtime_today]
    later = [ game for game in games if game['date'] >= maxtime_today]
    alldata = { 'games': { 'live': live, 'today': today, 'later': later } }
    
    render('games.html', alldata)

    #print(alldata)



if __name__ == '__main__':
    generate_pub()



