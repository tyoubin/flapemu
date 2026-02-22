const CACHE_NAME = 'flapemu-v3';
const APP_SHELL_ASSETS = [
	'./',
	'index.html',
	'board.html',
	'style.css',
	'home.css',
	'main.js',
	'js/pwa.js',
	'js/FlapUnit.js',
	'js/TrainGroup.js',
	'js/board-schema.js',
	'js/board-pipeline.js',
	'js/config.js',
	'js/data-logic.js',
	'js/data-normalize.js',
	'js/record-transform.js',
	'js/utils.js',
	'icon.png',
	'manifest.json',
	'timetable/JA_red.svg',
	'timetable/JT_orange.svg',
	'timetable/JU_orange.svg',
	'timetable/Shinkansen_jrc.svg',
	'timetable/logo.svg'
];

function toScopedUrl(path) {
	return new URL(path, self.registration.scope).toString();
}

self.addEventListener('install', (event) => {
	const scopedAssets = APP_SHELL_ASSETS.map(toScopedUrl);
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(scopedAssets)).then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			const stale = keys.filter((key) => key.startsWith('flapemu-') && key !== CACHE_NAME);
			return Promise.all(stale.map((key) => caches.delete(key)));
		}).then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const requestUrl = new URL(event.request.url);
	if (requestUrl.origin !== self.location.origin) return;

	// Timetable JSON must remain network-only so data freshness and error-state behavior are preserved.
	if (requestUrl.pathname.includes('/timetable/') && requestUrl.pathname.endsWith('.json')) {
		event.respondWith(fetch(event.request));
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			const fetchPromise = fetch(event.request).then((networkResponse) => {
				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, networkResponse.clone());
				});
				return networkResponse;
			}).catch((err) => {
				if (cachedResponse) return cachedResponse;
				throw err;
			});

			return cachedResponse || fetchPromise;
		})
	);
});
