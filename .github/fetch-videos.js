const fs = require('fs');
const path = require('path');

const API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_QUERY = 'Martin Armstrong interview';
const MAX_RESULTS = 50; // Increased to ensure plenty of results after filtering

function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchLatestVideos() {
  if (!API_KEY) {
    console.error('❌ Error: YOUTUBE_API_KEY environment variable is missing in GitHub Secrets.');
    process.exit(1);
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    SEARCH_QUERY
  )}&type=video&order=date&maxResults=${MAX_RESULTS}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.items) {
      console.error('❌ YouTube API Response Error:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    const newVideos = data.items
      // Filter out non-target search noise (must mention Armstrong in the title)
      .filter((item) => item.snippet.title.toLowerCase().includes('armstrong'))
      .map((item) => ({
        id: item.id.videoId,
        title: decodeHtmlEntities(item.snippet.title),
        host: decodeHtmlEntities(item.snippet.channelTitle),
        date: item.snippet.publishedAt.split('T')[0],
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }))
      // Sort chronologically (newest first)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Save to root directory
    const filePath = path.join(process.cwd(), 'videos.json');
    fs.writeFileSync(filePath, JSON.stringify(newVideos, null, 2));

    console.log(`✅ Successfully updated ${filePath} with ${newVideos.length} cleaned videos.`);
  } catch (error) {
    console.error('❌ Script execution error:', error);
    process.exit(1);
  }
}

fetchLatestVideos();
