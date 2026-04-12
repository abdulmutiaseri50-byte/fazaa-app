importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// ══════════════════════════════════════════════════════
// عند وصول أي Push — أيقظ التطبيق وأعد الاتصال
// ══════════════════════════════════════════════════════
self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch(e) { return; }

  const payload  = data.custom?.a || data.data || {};
  const type     = payload.type || 'general';
  const isWake   = type === 'keepalive';

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    if (clients.length > 0) {
      // التطبيق مفتوح في الخلفية — أيقظه وأعد الاتصال
      clients.forEach(c => {
        c.postMessage({ type: 'WAKE_AND_RECONNECT', msgType: type });
      });
    } else if (!isWake) {
      // التطبيق مغلق كلياً — افتحه (فقط للرسائل الحقيقية)
      await self.clients.openWindow('/');
    }
  })());
}, true);

// ══════════════════════════════════════════════════════
// عند الضغط على الإشعار — افتح التطبيق
// ══════════════════════════════════════════════════════
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length) { clients[0].focus(); return; }
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()));

// ── معالج KEEPALIVE من التطبيق ──
self.addEventListener('message', function(event){
  if(!event.data) return;
  if(event.data.type === 'KEEPALIVE'){
    // ردّ على التطبيق لإبقائه حياً
    if(event.source) event.source.postMessage({type:'KEEPALIVE_ACK', ts: Date.now()});
  }
});
