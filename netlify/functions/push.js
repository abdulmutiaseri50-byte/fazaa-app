exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } };
  }
  const { player_ids, title, body } = JSON.parse(event.body || '{}');
  if (!player_ids?.length) return { statusCode: 400, body: 'no players' };
  
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic os_v2_app_gdlakd5xufdhdapvkwquuvua2wifyjchhrheeo5lpbojz5vvipkszxanfdf2jbq2f2xbuecheo6af64aiozvwqcn7jiwovwohghyz6i'
    },
    body: JSON.stringify({
      app_id: '30d6050f-b7a1-4671-81f5-55a14a5680d5',
      include_player_ids: player_ids,
      headings: { ar: title, en: title },
      contents: { ar: body, en: body },
      priority: 10, ttl: 300
    })
  });
  const result = await res.json();
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  };
};
