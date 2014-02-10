#!/usr/bin/python

# script will load games from xmlsoccer feed
# and store/update the files in data/games accordingly
#
# games in data/games/finished or data/games/process or data/games/archive
# are not touched even fi they are changed
# 
# games in data/games/new are overwritten with new data
#
# games are moved to data/games/finished when done


import config

import os

from xml.etree import ElementTree
from datetime import date, datetime, timedelta
import dateutil.parser
import time
import simplejson as json
import urllib2, re

def get_matches():
    """Grabs match data from server, processes the results and returns match objects"""

    start = (date.today() - timedelta(days=config.MAX_DAYS_BEFORE)).isoformat()
    end   = (date.today() + timedelta(days=config.MAX_DAYS_AFTER)).isoformat()
    url   = "%s/GetFixturesByDateInterval?apikey=%s&startDateString=%s&endDateString=%s" \
            % (config.SOCCER_URL, config.SOCCER_KEY, start, end)
    

    if os.path.exists(config.MATCHES_FILE) and (time.time() - os.path.getmtime(config.MATCHES_FILE) < 60 * 10):
        print('Reading matchcache from %s' % config.MATCHES_FILE)
        matches_data = open(config.MATCHES_FILE).read()
    else:
        print('Reading from %s ' % url)
        matches_data = urllib2.urlopen(url).read()
        print('Read data (%d bytes)' % len(matches_data))

    
    matches_xml  = ElementTree.fromstring(matches_data)

    if matches_xml.find('Match') is None:
        raise Exception('No matches returned; data read: %s' % matches_data)

    # cache results
    with open(config.MATCHES_FILE, 'w') as f:
        f.write(matches_data)

    new, updated, finished = 0, 0, 0

    matches = []
    for xml in matches_xml.findall('Match'):
        match = { 
                'id':      xml.find('Id').text,
                'home_id': xml.find('HomeTeam_Id').text ,
                'away_id': xml.find('AwayTeam_Id').text ,
                'home':    xml.find('HomeTeam').text ,
                'away':    xml.find('AwayTeam').text ,
                'league':  xml.find('League').text,
                'time':    '' if xml.find('Time') is None else xml.find('Time').text
        }

        localtime = xml.find('Date').text
        match['date'] = dateutil.parser.parse(localtime).astimezone(dateutil.tz.tzutc()).isoformat()

        matchid = int(match['id'])

        if not match['league'] in config.LEAGUES:
            continue

        paths = {state: 'data/games/%s/%d' % (state,matchid) for state in ['new', 'finished', 'process', 'archive']}

            
        # if game is alread done or processed, ignore it
        if os.path.exists(paths['finished']) or \
                os.path.exists(paths['process']) or \
                os.path.exists(paths['archive']):
            continue
        
        # if game is done now, we need to remove it from new
        if match['time'] == 'Finished':
            path = paths['finished']
            finished += 1
            if os.path.exists(paths['new']):
                os.remove(paths['new'])
        else:
            path = paths['new']
            if os.path.exists(path):
                updated += 1
            else:
                new += 1

        with open(path, 'w') as f:
            f.write(json.dumps(match, sort_keys=True, indent=4, separators=(',', ': ')))

        #home = int(xml.find('HomeGoals').text)
        #away = int(xml.find('AwayGoals').text)
        #self.score = "%d-%d" % (home,away)

    print('matches processed %d new, %d updated, %d finished' % (new, updated, finished))


if __name__ == '__main__':
    get_matches()

