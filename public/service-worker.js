const APP_PREFIX = 'Budget_Tracker - ';
const VERSION = 'v_01 - ';
const CACHE_NAME = APP_PREFIX + VERSION + 'File_Cache'
const DATA_CACHE_NAME = APP_PREFIX + 'Transaction_Cache'

const FILES_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/idb.js',
  './js/index.js',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// install service worker, add files to cache
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('service worker installed: app files pre-cached successfully');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// activate service worker, clear old cache data
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('old cache data cleared', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercept fetch requests with '/api/', clone response, and save to cache
self.addEventListener('fetch', function (e) {
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then(async (cache) => {
          try {
            const response = await fetch(e.request);
            // if response good, clone, and store in cache
            if (response.status === 200) {
              cache.put(e.request.url, response.clone());
            }
            return response;
          } catch (err) {
            return await cache.match(e.request);
          }
        })
        .catch((err) => console.log(err))
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(async function () {
      const response = await caches.match(e.request);
      if (response) {
        return response;
      } else if (e.request.headers.get('accept').includes('text/html')) {
        // return cached html file on all requests for html pages
        return caches.match('/');
      }
    })
  );
});