// =============================================================================
// Service Worker for Rachgia Dashboard
// Agent W05: PWA (Progressive Web App) Engineer
// Version: 19.0.0
// =============================================================================

const CACHE_VERSION = 'rachgia-v19.13.0';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const DATA_CACHE_NAME = `${CACHE_VERSION}-data`;

// 로컬 JS 파일은 캐시하지 않음 (항상 최신 버전 사용)
// CDN 자원만 캐시 (안정적)
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon.svg',
  // CDN 자원만 캐시
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js'
];

// =============================================================================
// Install Event - 서비스 워커 설치
// =============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// =============================================================================
// Activate Event - 이전 캐시 정리
// =============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 현재 버전이 아닌 캐시 삭제
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// =============================================================================
// Fetch Event - 네트워크 요청 가로채기 (안전한 전략)
// =============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 데이터 파일은 절대 캐시하지 않음 (항상 최신 데이터 보장)
  if (url.pathname.includes('/data/') || url.pathname.endsWith('.json')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // CDN 자원만 캐시 (안정적이고 변경되지 않는 리소스)
  if (url.hostname.includes('cdn.') || url.hostname.includes('jsdelivr') || url.hostname.includes('gstatic')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 로컬 파일 (HTML, JS, CSS 등): 항상 네트워크에서 가져옴
  // 캐시 문제 방지 - 항상 최신 버전 보장
  event.respondWith(networkOnly(request));
});

// =============================================================================
// Caching Strategies
// =============================================================================

/**
 * Network Only: 항상 네트워크에서 가져옴
 * - 로컬 JS/HTML/CSS 파일에 사용
 * - 캐시 문제 완전 방지
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Network only failed:', error);
    return new Response(
      '<h1>오프라인 상태입니다</h1><p>인터넷 연결을 확인해주세요.</p>',
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

/**
 * Network First: 네트워크 우선, 실패 시 캐시
 * - 항상 최신 데이터 제공
 * - 오프라인 시 캐시된 데이터 사용
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // 성공적인 응답이면 캐시에 저장
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 캐시도 없으면 오프라인 페이지 반환 (선택사항)
    return new Response(
      '<h1>오프라인 상태입니다</h1><p>인터넷 연결을 확인해주세요.</p>',
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

/**
 * Cache First: 캐시 우선, 없으면 네트워크
 * - 정적 자산에 적합
 * - 빠른 로딩 속도
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }

  console.log('[SW] Cache miss, fetching:', request.url);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);

    // 이미지 등의 경우 플레이스홀더 반환 가능
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ccc" width="200" height="200"/></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }

    throw error;
  }
}

// =============================================================================
// Background Sync - 백그라운드 동기화 (선택사항)
// =============================================================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Syncing data in background');

  try {
    // 데이터 동기화 로직 (예: 서버에서 최신 데이터 가져오기)
    const response = await fetch('/api/data/latest');
    const data = await response.json();

    // IndexedDB에 저장 (선택사항)
    console.log('[SW] Data synced successfully', data);

    // 클라이언트에 알림
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'DATA_SYNCED',
        payload: data
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// =============================================================================
// Push Notifications - 푸시 알림 (선택사항)
// =============================================================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push event:', event);

  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: '열기',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/action-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Rachgia Dashboard', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/rachgia_dashboard_v19.html')
    );
  }
});

// =============================================================================
// Message Event - 클라이언트와 통신
// =============================================================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  // 응답 보내기
  event.ports[0].postMessage({
    type: 'ACK',
    payload: 'Message received'
  });
});

// =============================================================================
// Periodic Background Sync - 주기적 동기화 (Chrome 80+)
// =============================================================================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);

  if (event.tag === 'update-data') {
    event.waitUntil(updateDataPeriodically());
  }
});

async function updateDataPeriodically() {
  console.log('[SW] Updating data periodically');

  try {
    const response = await fetch('/api/data/check-updates');
    const { hasUpdates } = await response.json();

    if (hasUpdates) {
      // 업데이트가 있으면 사용자에게 알림
      await self.registration.showNotification('새로운 데이터', {
        body: '업데이트된 생산 데이터가 있습니다.',
        icon: '/icons/icon-192x192.png',
        tag: 'data-update'
      });
    }
  } catch (error) {
    console.error('[SW] Periodic update failed:', error);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * 캐시 크기 확인 및 관리
 */
async function manageCacheSize(cacheName, maxItems = 50) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // 오래된 항목부터 삭제
    await cache.delete(keys[0]);
    await manageCacheSize(cacheName, maxItems);
  }
}

/**
 * 캐시 상태 확인
 */
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    info[cacheName] = keys.length;
  }

  return info;
}

console.log('[SW] Service Worker loaded successfully');
