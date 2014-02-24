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



import os

from xml.etree import ElementTree
from datetime import date, datetime, timedelta
import dateutil.parser
import time
import simplejson as json
import urllib2, re
import logging

import btcs

INTERVAL_ALL_GAMES  = 60 * 6
INTERVAL_LIVE_GAMES = 30

def get_matches():
    """Grabs match data from server, processes the results and returns match objects"""

    start = (date.today() - timedelta(days=btcs.MAX_DAYS_BEFORE)).isoformat()
    end   = (date.today() + timedelta(days=btcs.MAX_DAYS_AFTER)).isoformat()
    url   = "%s/GetFixturesByDateInterval?apikey=%s&startDateString=%s&endDateString=%s" \
            % (btcs.SOCCER_URL, btcs.SOCCER_KEY, start, end)
    
    match_file = btcs.path('cache', 'matches.xml')

    if (not os.path.exists(match_file)) or (time.time() - os.path.getmtime(match_file) > INTERVAL_ALL_GAMES):
        logging.info('Reading full game data from %s ' % url)

        matches_data = urllib2.urlopen(url).read()
        process_xml(matches_data, match_file)


    url   = "%s/GetLiveScore?apikey=%s" % (btcs.SOCCER_URL, btcs.SOCCER_KEY)
    match_file = btcs.path('cache', 'matches_live.xml')
    if (not os.path.exists(match_file)) or (time.time() - os.path.getmtime(match_file) > INTERVAL_LIVE_GAMES):
        logging.info('Reading live game data from %s ' % url)
        matches_data = urllib2.urlopen(url).read()

        process_xml(matches_data, match_file)

def process_xml(matches_data, match_file):
    
    matches_xml  = ElementTree.fromstring(matches_data)

    # cache results
    with open(match_file, 'w') as f:
        f.write(matches_data)

    new, updated, finished = 0, 0, 0

    matches = []
    for xml in matches_xml.findall('Match'):
        try:
            match = { 
                    'id':      xml.find('Id').text,
                    'home_id': xml.find('HomeTeam_Id').text ,
                    'away_id': xml.find('AwayTeam_Id').text ,
                    'league':  xml.find('League').text,
                    'time':    '' if xml.find('Time') is None else xml.find('Time').text
            }

            if xml.find('HomeTeam') is None:
                match['home'] = xml.find('Hometeam').text
            else:
                match['home'] = xml.find('HomeTeam').text

            if xml.find('AwayTeam') is None:
                match['away'] = xml.find('Awayteam').text
            else:
                match['away'] = xml.find('AwayTeam').text

            if not xml.find('HomeGoalDetails') is None:
                match['home_goal_details'] = xml.find('HomeGoalDetails').text
            if not xml.find('AwayGoalDetails') is None:
                match['away_goal_details'] = xml.find('AwayGoalDetails').text

            if not xml.find('HomeGoals') is None:
                match['result'] = xml.find('HomeGoals').text + '-' + xml.find('AwayGoals').text

            localtime = xml.find('Date').text
            match['date'] = dateutil.parser.parse(localtime).astimezone(dateutil.tz.tzutc()).isoformat()

        except:
            logging.error('Error processing game # %s in file %s' % (xml.find('Id').text, match_file))
            raise
        matchid = int(match['id'])

        if not match['league'] in btcs.LEAGUES:
            continue

        paths = {state: btcs.path('games/'+state,matchid) for state in ['new', 'finished', 'process', 'archive']}

            
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

    logging.info('matches processed %d new, %d updated, %d finished' % (new, updated, finished))


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    get_matches()

