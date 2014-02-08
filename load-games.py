#!/usr/bin/python

import config

import os

from xml.etree import ElementTree
from datetime import date, datetime, timedelta
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
                'league':  xml.find('League').text
        }
        if match['league'] in config.LEAGUES:
            # generate
            matchid = int(match['id'])

            with open('data/games/new/%d.json' % matchid, 'w') as f:
                f.write(json.dumps(match, sort_keys=True, indent=4, separators=(',', ': ')))

            new += 0

            #self.away_id  = xml.find('AwayTeam_Id').text
            #self.home     = xml.find('HomeTeam').text
            #self.away     = xml.find('AwayTeam').text
            #self.location = xml.find('Location').text
            #self.league   = xml.find('League').text
            #self.id       = xml.find('Id').text
            #self.localtime = xml.find('Date').text

            #    self.is_done  = xml.find('Time') is not None and xml.find('Time').text == 'Finished'

            #home = int(xml.find('HomeGoals').text)
            #away = int(xml.find('AwayGoals').text)
            #self.score = "%d-%d" % (home,away)

    print('matches processed %d new, %d updated, %d finished' % (new, updated, finished))


if __name__ == '__main__':
    get_matches()

