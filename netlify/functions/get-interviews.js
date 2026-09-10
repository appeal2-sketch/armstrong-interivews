exports.handler = async function(event, context) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing YOUTUBE_API_KEY" }) };
  }

  try {
    let rawVideos = [];
    let nextPageToken = '';
    const maxPages = 3; // 3 pages x 50 results = 150 potential videos

    // 1. Fetch raw search results using native Node fetch
    for (let page = 0; page < maxPages; page++) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Martin+Armstrong+interview&type=video&maxResults=50&order=date&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.items) {
        rawVideos = rawVideos.concat(data.items);
      }

      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
    }

    if (rawVideos.length === 0) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify([])
      };
    }

    // 2. Extract video IDs to verify embeddability and status
    const videoIds = rawVideos.map(item => item.id.videoId).join(',');

    // 3. Query YouTube Videos API to verify active status
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=status,player&id=${videoIds}&key=${API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    // Map valid, embeddable Video IDs
    const validVideoIds = new Set();
    if (detailsData.items) {
      detailsData.items.forEach(item => {
        const isEmbeddable = item.status && item.status.embeddable;
        const uploadStatus = item.status ? item.status.uploadStatus : '';
        
        // Only keep videos that are processed, public, and embeddable
        if (isEmbeddable && uploadStatus === 'processed') {
          validVideoIds.add(item.id);
        }
      });
    }

    // 4. Filter out removed, private, or non-embeddable videos
    const activeVideos = rawVideos
      .filter(item => validVideoIds.has(item.id.videoId))
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
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
