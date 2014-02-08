#!/usr/bin/python3

import os

folders = [
    'data',
    'data/games',
    'data/games/new',
    'data/games/finished',
    'data/games/process',
    'data/games/archive',
    'data/bets',
    'data/bets/new',
    'data/bets/received',
    'data/bets/archive',
    'data/cache',
    'data/pub']

for folder in folders:
    if not os.path.exists(folder):
        os.mkdir(folder)

