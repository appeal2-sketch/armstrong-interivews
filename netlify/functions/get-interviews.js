exports.handler = async function(event, context) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Missing YOUTUBE_API_KEY environment variable" }) 
    };
  }

  try {
    // 1. Query YouTube API for Martin Armstrong interviews
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Martin+Armstrong&type=video&maxResults=25&order=date&key=${API_KEY}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.error) {
      console.error("YouTube API Error:", data.error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: data.error.message })
      };
    }

    if (!data.items || data.items.length === 0) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify([])
      };
    }

    // 2. Extract Video IDs
    const videoIds = data.items.map(item => item.id.videoId).filter(Boolean).join(',');

    // 3. Verify status & embeddability
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoIds}&key=${API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    const validVideoIds = new Set();
    if (detailsData.items) {
      detailsData.items.forEach(item => {
        if (item.status && item.status.embeddable) {
          validVideoIds.add(item.id);
        }
      });
    }

    // 4. Map active interviews
    const activeVideos = data.items
      .filter(item => item.id && item.id.videoId && validVideoIds.has(item.id.videoId))
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
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify(activeVideos)
    };

  } catch (err) {
    return { 
      statusCode: 500, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }) 
    };
  }
};      body: JSON.stringify(activeVideos)
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
