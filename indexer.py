import sys
import json
import urllib.request as urllib2
from bs4 import BeautifulSoup

BASE_URL = 'https://downloads.khinsider.com'

jsonResponse = {
    "status": "",
    "state": 0,
    "track_names": "",
    "track_urls": ""
}

def fetch_from_url(url):
    if not url.startswith(f'{BASE_URL}/game-soundtracks/album/'):
        jsonResponse['status'] = f'[ERROR] Invalid url: {url}'
        print(json.dumps(jsonResponse))
        return
    
    jsonResponse['status'] = 'Url found, crawling for links...'
    jsonResponse['state'] = 1
    jsonResponse['track_names'] = ''
    jsonResponse['track_urls'] = ''
    print(json.dumps(jsonResponse))
    sys.stdout.flush()

    soup = BeautifulSoup(urllib2.urlopen(url), features="html.parser")

    song_list = soup.find(id="songlist")
    anchors = song_list.find_all('a')

    # href (string) -> song name (string)
    song_map = dict()

    # Acquire links
    for anchor in anchors:
        href = anchor.get('href')
        if href and 'mp3' in href:
            href = BASE_URL + href
            if href not in song_map:
                song_map[href] = anchor.string
    if not song_map:
        jsonResponse['state'] = 0
        jsonResponse['status'] = 'No links found for the url. Double check that the url is correct and try again.'
        print(json.dumps(jsonResponse))
        return
    
    items = song_map.items()
    urls = []
    names = []

    for item in items:
        urls.append(item[0]), names.append(item[1])
    
    jsonResponse['status'] = f'{len(song_map)} links acquired. Select which tracks to download with checkboxes.'
    jsonResponse['track_names'] = names
    jsonResponse['track_urls'] = urls
    jsonResponse['state'] = 2

    print(json.dumps(jsonResponse))

while True:
    url = input()
    urlParsed = json.loads(url)
    fetch_from_url(urlParsed['input'])
    sys.stdout.flush()