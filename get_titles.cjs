const https = require('https');

const urls = [
  'https://www.youtube.com/watch?v=4Z2Zow6cuHY',
  'https://www.youtube.com/watch?v=qege2Z64VeA',
  'https://www.youtube.com/watch?v=7IC-bSdjUcc'
];

urls.forEach(url => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      const titleMatch = data.match(/<title>(.*?)<\/title>/);
      console.log(`${url} -> ${titleMatch ? titleMatch[1] : 'No title found'}`);
    });
  }).on('error', (err) => {
    console.log(`Error fetching ${url}: ${err.message}`);
  });
});
