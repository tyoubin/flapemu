const CACHE_NAME = 'flapemu-v1';
const ASSETS = [
	'/',
	'/index.html',
	'/board.html',
	'/style.css',
	'/home.css',
	'/main.js',
	'/js/pwa.js',
	'/js/FlapUnit.js',
	'/js/TrainGroup.js',
	'/js/config.js',
	'/js/data-logic.js',
	'/js/utils.js',
	'/icon.png',
	'/manifest.json',
	'/timetable/JA_red.svg',
	'/timetable/JT_orange.svg',
	'/timetable/JU_orange.svg',
	'/timetable/Shinkansen_jrc.svg',
	'/timetable/logo.svg'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS);
		})
	);
});

self.addEventListener('fetch', (event) => {
	// For timetable data (JSON), we MUST fetch from network only.
	// This ensures that if the connection is lost, the main app can correctly
	// trigger the "System Adjustment" (error) overlay for realism.
	if (event.request.url.includes('/timetable/') && event.request.url.endsWith('.json')) {
		event.respondWith(fetch(event.request));
		return;
	}

	// For other assets (including SVG logos in /timetable/), use stale-while-revalidate
	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			const fetchPromise = fetch(event.request).then((networkResponse) => {
				caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, networkResponse.clone());
				});
				return networkResponse;
			});
			return cachedResponse || fetchPromise;
		})
	);
});
