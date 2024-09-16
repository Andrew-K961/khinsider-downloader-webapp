import os
import sys
import json
import time
import urllib.request as urllib2
from bs4 import BeautifulSoup

jsonOutput = {
    "status": "Beginning download...",
    "state": 3,
    "track_names": "",
    "track_urls": ""
}

def printOutput(text):
    jsonOutput['status'] = text
    print(json.dumps(jsonOutput))
    sys.stdout.flush()

def fetch_from_url(args):
    jsonInput = json.loads(args)

    dir_name = jsonInput['download_directory']

    jsonOutput['state'] = 3

    # href (string) -> song name (string)
    song_map = {jsonInput['track_urls'][i]: jsonInput['track_names'][i] for i in range(len(jsonInput['track_urls']))}

    for track in list(song_map.keys()):
        if track == '':
            del song_map[track]

    #print(json.dumps(jsonInput))
    #print(json.dumps(song_map))
    #sys.stdout.flush()
    #return

    printOutput("Beginning download...")

    # Map so we don't download duplicate links on the page
    downloaded_mp3s = {}

    time.sleep(0.5)

    if (not os.path.exists(dir_name)):
        try:
            os.makedirs(dir_name)
        except:
            jsonOutput['state'] = 2
            printOutput('Error creating directory. Download aborted.')
            return

    # http://stackoverflow.com/questions/22676/how-do-i-download-a-file-over-http-using-python
    # Iterate through links, grab the mp3s, and download them
    for href, song_name in song_map.items():
        link_soup = BeautifulSoup(urllib2.urlopen(href), features="html.parser")
        audio = link_soup.find('audio')
        mp3_url = audio.get('src')
        if mp3_url not in downloaded_mp3s:
            downloaded_mp3s[mp3_url] = True
            file_name = song_name + '.mp3'

            mp3file = urllib2.urlopen(mp3_url)

            # get file size
            meta = mp3file.info()
            file_size = float(meta.get("Content-Length")) / 1000000

            file_on_disk_path = dir_name + '/' + file_name
            # check if file already exists
            file_already_downloaded = False
            #time.sleep(2)
            if os.path.exists(file_on_disk_path):
                stat = os.stat(file_on_disk_path)
                file_already_downloaded = round(float(stat.st_size) / 1000000, 2) == round(file_size, 2)

            # It exists but isn't already the same size
            if not file_already_downloaded:
                printOutput(f'[downloading] {file_name} [{file_size:.2f} MB]')

                with open(file_on_disk_path, 'wb') as output:
                    output.write(mp3file.read())
                    printOutput(f'[done] "{file_name}"')
            else:
                printOutput(f'[skipping] "{file_name}" (already downloaded).')

    jsonOutput['state'] = 0
    printOutput("Finished Downloading.")

while True:
    line = input()
    fetch_from_url(line)