exports.handler = async function(event, context) {
  // Sample initial payload for testing UI rendering
  const sampleData = [
    {
      id: "1",
      title: "Martin Armstrong on Economic Confidence Model & Capital Flows",
      date: "2026-09-01",
      host: "Financial Survival Network",
      url: "https://www.youtube.com/watch?v=LAoQyya0HzE",
      summary: [
        "Capital shifting from public sector assets to private hard assets.",
        "Key Economic Confidence Model turning points projected ahead.",
        "Global sovereign debt liquidity pressures intensifying."
      ]
    }
  ];

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(sampleData)
  };
};
