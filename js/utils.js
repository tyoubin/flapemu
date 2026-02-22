import { WORD_CAPACITY_CONFIG } from './config.js';

/**
 * Helper function: Sleep
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dynamic Capacity Helper
 */
export const getCap = (presets, actuals, capacityConfig = WORD_CAPACITY_CONFIG) => {
	// Deduplication
	const uniqueItems = new Set();
	if (presets) presets.forEach(p => uniqueItems.add(p.local));
	if (actuals) actuals.forEach(a => uniqueItems.add(a.local));
	const uniqueCount = uniqueItems.size;

	// Add buffer cards so the spool keeps the mechanical travel feel.
	let cap = uniqueCount + capacityConfig.blankCards;

	// Hard limits avoid excessive flip duration and GPU load.
	return Math.min(Math.max(cap, capacityConfig.min), capacityConfig.max);
};

/**
 * Visual Length Calculation
 */
export const calculateVisualLength = (text) => {
	let visualLength = 0;
	for (let char of (text || "")) {
		const code = char.charCodeAt(0);
		// ASCII=0.6, Latin-1 Letters/Ext=0.6, Half-width Katakana=0.6, Others=1.0
		if (code < 128 || (code >= 0xC0 && code <= 0x024F) || (code >= 0xFF61 && code <= 0xFF9F)) {
			visualLength += 0.6;
		} else {
			visualLength += 1;
		}
	}
	return visualLength;
};

/* favicon setter
 */
export function setFavicon(url) {
	// 1. Find existing
	let link = document.querySelector("link[rel~='icon']");

	// 2. Only create if it doesn't exist
	if (!link) {
		link = document.createElement('link');
		link.rel = 'icon';
		document.head.appendChild(link);
	}

	// 3. Only update if URL changed
	if (link.href !== url && link.href !== window.location.origin + '/' + url) {
		link.href = url;
	}
}
