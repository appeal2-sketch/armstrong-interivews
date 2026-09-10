exports.handler = async function(event, context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: "YOUTUBE_API_KEY environment variable is not configured in Netlify." })
    };
  }

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Martin+Armstrong+interview&type=video&maxResults=20&order=date&key=${API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: `YouTube API Error: ${data.error.message}` })
      };
    }

    if (!data.items || data.items.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
      };
    }

    const videos = data.items
      .filter(item => item.id && item.id.videoId)
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        date: item.snippet.publishedAt.split('T')[0],
        host: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        summary: [
          "Analysis of global capital flows and public vs. private asset shifts.",
          "Key Economic Confidence Model turning points projected ahead.",
          "Monetary sovereign debt pressures and geopolitical commentary."
        ]
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(videos)
    };

  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: `Serverless Function Error: ${err.message}` })
    };
  }
};
