/**
 * PWA Helper for FlapEmu
 * Handles Service Worker registration and dynamic manifest generation
 * to allow users to add specific boards (with params) to their home screen.
 */

// Register service worker
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('./sw.js').catch(err => {
			console.warn('SW registration failed:', err);
		});
	});
}

// Generate dynamic manifest to preserve URL parameters (station, mode, rows, etc.)
// This ensures that "Add to Home Screen" bookmarks the specific board setup.
(function () {
	const link = document.querySelector('link[rel="manifest"]');
	if (!link) return;

	// Base manifest data
	const baseManifest = {
		"name": "FlapEmu - Split-Flap Display Emulator",
		"short_name": "FlapEmu",
		"description": "A photorealistic mechanical split-flap display simulator.",
		"display": "standalone",
		"background_color": "#000000",
		"theme_color": "#000000",
		"icons": [
			{ "src": "icon.png", "sizes": "640x640", "type": "image/png" },
			{ "src": "icon.png", "sizes": "192x192", "type": "image/png" },
			{ "src": "icon.png", "sizes": "512x512", "type": "image/png" }
		]
	};

	// Use current URL as start_url to preserve query parameters
	baseManifest.start_url = window.location.href;

	// Enhance name if on a specific board
	const params = new URLSearchParams(window.location.search);
	const station = params.get('t');
	if (station) {
		const capitalizedStation = station.charAt(0).toUpperCase() + station.slice(1);
		baseManifest.name = `FlapEmu: ${capitalizedStation}`;
		baseManifest.short_name = capitalizedStation;
	}

	// Convert to Blob and set as manifest href
	try {
		const blob = new Blob([JSON.stringify(baseManifest)], { type: 'application/json' });
		const manifestURL = URL.createObjectURL(blob);
		link.setAttribute('href', manifestURL);
	} catch (e) {
		console.error('Failed to generate dynamic manifest:', e);
	}
})();
