const CACHE_NAME = 'filmxem-cache-v2.4';
const ASSETS_TO_CACHE = [
  './',
  'detail.html',
  'watch.html',
  'search.html',
  'Terms-of-use',
  'Privacy-policy',
  'css/main.css',
  'css/home.css',
  'css/watch.css',
  'css/detail.css',
  'css/Terms-of-use.css',
  'css/Privacy-policy.css',
  'js/database.js',
  'js/core.js',
  'js/home.js',
  'js/watch.js',
  'js/detail.js',
  'js/search.js',
  'js/Terms-of-use.js',
  'js/Privacy-policy.js',
  'manifest.json'
];

// Cài đặt service worker và lưu các tài nguyên cốt lõi vào bộ nhớ đệm
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Kích hoạt và dọn dẹp các cache cũ
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Xử lý các yêu cầu mạng với chiến lược Stale-While-Revalidate
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Sử dụng chiến lược Network-First cho database.js để luôn cập nhật phim mới khi có mạng (bẻ gãy HTTP Cache bằng timestamp)
  if (url.pathname.includes('database.js')) {
    e.respondWith(
      fetch(e.request.url + '?t=' + Date.now()).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Không lưu trữ video, iframe hoặc tài nguyên luồng lớn để tránh tràn bộ nhớ đệm
  if (
    e.request.method !== 'GET' ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    url.search.includes('videoUrl') ||
    e.request.url.includes('drive.google.com') ||
    e.request.url.includes('fcloud.live') ||
    e.request.url.includes('huggingface.co')
  ) {
    return; // Để trình duyệt tự xử lý mạng bình thường (Network Only)
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Phản hồi ngay từ bộ nhớ đệm, đồng thời cập nhật bản mới dưới nền
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => { /* Bỏ qua lỗi mạng khi chạy ngầm */ });
        return cachedResponse;
      }

      // Nếu không có trong cache, tải từ mạng
      return fetch(e.request).then((networkResponse) => {
        // Chỉ lưu cache các tài nguyên GET thành công thuộc cùng domain hoặc CDN lớn
        if (
          networkResponse.status === 200 &&
          (url.origin === self.location.origin ||
           url.hostname.includes('googleapis.com') ||
           url.hostname.includes('gstatic.com') ||
           url.hostname.includes('cloudflare.com') ||
           url.hostname.includes('unsplash.com'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
