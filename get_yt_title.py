import urllib.request
import re

urls = [
    'https://www.youtube.com/watch?v=4Z2Zow6cuHY',
    'https://www.youtube.com/watch?v=qege2Z64VeA',
    'https://www.youtube.com/watch?v=7IC-bSdjUcc'
]

for url in urls:
    try:
        html = urllib.request.urlopen(url).read().decode('utf-8')
        match = re.search(r'<meta property="og:title" content="(.*?)">', html)
        if match:
            print(f"{url} -> {match.group(1)}")
        else:
            match = re.search(r'<title>(.*?)</title>', html)
            print(f"{url} -> {match.group(1) if match else 'No title'}")
    except Exception as e:
        print(f"Error for {url}: {e}")
