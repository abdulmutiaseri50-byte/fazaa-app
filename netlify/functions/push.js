exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }

  const { player_ids, title, body, type } = JSON.parse(event.body || '{}');
  if (!player_ids?.length) return { statusCode: 400, body: 'no players' };

  // keepalive = إيقاظ الجوال بدون صوت أو اهتزاز
  if(type === 'keepalive'){
    const wakePayload = {
      app_id:             '30d6050f-b7a1-4671-81f5-55a14a5680d5',
      include_player_ids: player_ids,
      headings:           { ar: title, en: title },
      contents:           { ar: body,  en: body  },
      priority:           10,
      ttl:                30,
      content_available:  true,   // يوقظ الجوال بصمت
      android_channel_id: 'keepalive_channel',
      android_sound:      'none',
      android_vibration:  0,
      data: { type: 'keepalive' },
    };
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic os_v2_app_gdlakd5xufdhdapvkwquuvua2wifyjchhrheeo5lpbojz5vvipkszxanfdf2jbq2f2xbuecheo6af64aiozvwqcn7jiwovwohghyz6i'
      },
      body: JSON.stringify(wakePayload)
    });
    const result = await res.json();
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  }

  const soundMap = {
    sos:  'sos_alert', ptt: 'walkie_beep',
    chat: 'message_beep', default: 'walkie_beep',
  };
  const sound = soundMap[type] || soundMap.default;

  const payload = {
    app_id:             '30d6050f-b7a1-4671-81f5-55a14a5680d5',
    include_player_ids: player_ids,
    headings:           { ar: title, en: title },
    contents:           { ar: body,  en: body  },

    // ── أولوية قصوى ──
    priority: 10,
    ttl: 60,

    // ── Android: يوقظ الجوال حتى من السكون العميق ──
    android_channel_id:     type === 'sos' ? 'sos_channel' : 'alerts_channel',
    android_sound:          sound,
    android_visibility:     1,
    android_accent_color:   'FF39FF14',
    android_vibration:      1,
    android_group:          'rhr_alerts',

    // ── iOS ──
    ios_sound:              sound + '.wav',
    ios_interruption_level: type === 'sos' ? 'timeSensitive' : 'active',
    ios_badgeType:          'Increase',
    ios_badgeCount:         1,

    // ── data payload لتمرير النوع للـ SW ──
    data: { type: type || 'general' },

    // ── لا تهدئ الإشعار ──
    mutable_content:    true,
    content_available:  true,
  };

  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': 'Basic os_v2_app_gdlakd5xufdhdapvkwquuvua2wifyjchhrheeo5lpbojz5vvipkszxanfdf2jbq2f2xbuecheo6af64aiozvwqcn7jiwovwohghyz6i'
    },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  console.log('OneSignal response:', JSON.stringify(result));

  return {
    statusCode: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
