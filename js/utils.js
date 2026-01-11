/**
 * Helper function: Sleep
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dynamic Capacity Helper
 */
export const getCap = (presets, actuals) => {
	// Deduplication
	const uniqueItems = new Set();
	if (presets) presets.forEach(p => uniqueItems.add(p.local));
	if (actuals) actuals.forEach(a => uniqueItems.add(a.local));
	const uniqueCount = uniqueItems.size;

	// add 15 blank cards
	let cap = uniqueCount + 15;

	// hard limit, ensure visual effect and not too long duration
	return Math.min(Math.max(cap, 40), 80);
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

export const setFavicon = (url) => {
	const link = document.createElement('link');
	link.rel = 'icon';
	link.type = 'image/svg+xml';
	link.href = url;
	document.head.appendChild(link);
};
