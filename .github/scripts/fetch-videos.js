const fs = require('fs');
const path = require('path');
const https = require('https');

const SEARCH_QUERY = 'Martin Armstrong interview';
const API_KEY = process.env.YOUTUBE_API_KEY;

const jsonPath = path.join(__dirname, '../../videos.json');
const xmlPath = path.join(__dirname, '../../feed.xml');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function fetchLatestVideos() {
  if (!API_KEY) {
    console.error("FATAL: YOUTUBE_API_KEY is not defined in GitHub Repository Secrets.");
    process.exit(1);
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(SEARCH_QUERY)}&type=video&order=date&maxResults=15&key=${API_KEY}`;

  try {
    const data = await makeRequest(url);

    if (data.error) {
      console.error("YouTube API Error Details:", JSON.stringify(data.error, null, 2));
      process.exit(1);
    }

    let existingVideos = [];
    if (fs.existsSync(jsonPath)) {
      try {
        existingVideos = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {
        console.warn("Existing videos.json was invalid, initializing empty list.");
      }
    }

    if (data.items && data.items.length > 0) {
      const existingIds = new Set(existingVideos.map(v => v.id));
      const newEntries = [];

      data.items.forEach(item => {
        const videoId = item.id && item.id.videoId;
        if (videoId && !existingIds.has(videoId)) {
          newEntries.push({
            id: videoId,
            title: item.snippet.title,
            host: item.snippet.channelTitle,
            date: new Date(item.snippet.publishedAt).toISOString().split('T')[0],
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      });

      if (newEntries.length > 0) {
        existingVideos = [...newEntries, ...existingVideos];
        fs.writeFileSync(jsonPath, JSON.stringify(existingVideos, null, 2));
        console.log(`Successfully added ${newEntries.length} new videos.`);
      } else {
        console.log("No new videos found. Cache is up to date.");
      }
    } else {
      console.log("No items returned from query.");
    }

    generateRSSFeed(existingVideos);

  } catch (err) {
    console.error("Execution error:", err);
    process.exit(1);
  }
}

function generateRSSFeed(videos) {
  const latestTen = videos.slice(0, 10);

  const rssItems = latestTen.map(v => `
    <item>
      <title><![CDATA[${v.title}]]></title>
      <link>${v.url}</link>
      <guid>${v.id}</guid>
      <pubDate>${new Date(v.date).toUTCString()}</pubDate>
      <description><![CDATA[Watch the latest interview featuring Martin Armstrong on ${v.host}.]]></description>
    </item>
  `).join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Armstrong Interviews Archive</title>
    <link>https://armstronginterviews.com</link>
    <description>Latest Martin Armstrong video interviews and Economic Confidence Model cycle updates.</description>
    ${rssItems}
  </channel>
</rss>`;

  fs.writeFileSync(xmlPath, rssXml);
  console.log("Successfully generated feed.xml!");
}

fetchLatestVideos();
