const fs = require('fs');
const path = require('path');

const SEARCH_QUERY = 'Martin Armstrong interview';
const API_KEY = process.env.YOUTUBE_API_KEY;

const jsonPath = path.join(__dirname, '../../videos.json');
const xmlPath = path.join(__dirname, '../../feed.xml');

async function fetchLatestVideos() {
  if (!API_KEY) {
    console.error("Missing YOUTUBE_API_KEY environment variable.");
    process.exit(1);
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(SEARCH_QUERY)}&type=video&order=date&maxResults=15&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Read existing videos.json cache
    let existingVideos = [];
    if (fs.existsSync(jsonPath)) {
      existingVideos = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }

    if (data.items && data.items.length > 0) {
      const existingIds = new Set(existingVideos.map(v => v.id));
      const newEntries = [];

      data.items.forEach(item => {
        const videoId = item.id.videoId;
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
        console.log(`Added ${newEntries.length} new videos to videos.json!`);
      }
    }

    // ALWAYS generate feed.xml regardless of whether new entries were added
    generateRSSFeed(existingVideos);

  } catch (err) {
    console.error("Error executing YouTube fetch script:", err);
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
