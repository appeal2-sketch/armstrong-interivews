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
    const baseUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Martin+Armstrong&type=video&order=date&maxResults=50&key=${API_KEY}`;
    
    // 1. Fetch Page 1 (First 50 Results)
    const res1 = await fetch(baseUrl);
    const data1 = await res1.json();

    if (data1.error) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: `YouTube API Error: ${data1.error.message}` })
      };
    }

    let rawItems = data1.items || [];

    // 2. Fetch Page 2 using nextPageToken (Next 50 Results)
    if (data1.nextPageToken) {
      const res2 = await fetch(`${baseUrl}&pageToken=${data1.nextPageToken}`);
      const data2 = await res2.json();
      if (data2.items) {
        rawItems = rawItems.concat(data2.items);
      }
    }

    // 3. Format & Map 100 Total Results
    const videos = rawItems
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
