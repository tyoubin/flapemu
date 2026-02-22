import { DEFAULT_DISPLAY_MODE, DISPLAY_MODE_PROFILES } from './board-schema.js';

export const BLANK_DATA = { local: " ", en: " ", color: "#202020", textColor: "#f5f5f5" };

const urlParams = new URLSearchParams(window.location.search);

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function parseIntParam(name, fallback, min, max) {
	const raw = urlParams.get(name);
	if (raw === null || raw === '') return fallback;

	const parsed = parseInt(raw, 10);
	if (!Number.isFinite(parsed)) return fallback;
	return clamp(parsed, min, max);
}

function parseTimetableName() {
	const value = urlParams.get('t');
	if (!value) return 'demo';
	if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'demo';
	return value;
}

// --- Data Source ---
const timetableName = parseTimetableName();
export const DATA_SOURCE = `./timetable/${timetableName}.json`;
export const PREVIEW_MODE = urlParams.has('preview');

// --- Display Mode ---
const requestedMode = urlParams.get('mode');
export const DISPLAY_MODE = DISPLAY_MODE_PROFILES[requestedMode] ? requestedMode : DEFAULT_DISPLAY_MODE;
const modeProfile = DISPLAY_MODE_PROFILES[DISPLAY_MODE];

// --- Track Filtering ---
const trackParam = urlParams.get('track');
export const FILTER_TRACKS = trackParam
	? trackParam.split(',').map(t => t.trim()).filter(Boolean)
	: null;

// --- Row Count ---
const configuredRows = parseIntParam('rows', modeProfile.defaultRows, 1, 30);
export const ROW_COUNT = configuredRows;

// --- Runtime Tuning ---
export const REFRESH_INTERVAL_MS = parseIntParam('refresh', 30000, 5000, 300000);
export const CASCADE_DELAY_MS = parseIntParam('cascade', 1000, 0, 5000);
export const FLAP_ANIMATION_FALLBACK_MS = parseIntParam('fallback', 1000, 200, 5000);
export const LAYOUT_WIDTH_MULTIPLIER = parseIntParam('layoutMul', 32, 16, 64);
export const LAYOUT_WIDTH_PADDING = parseIntParam('layoutPad', 20, 0, 120);

const capMin = parseIntParam('capMin', 40, 10, 240);
const capMax = parseIntParam('capMax', 80, 10, 240);

export const WORD_CAPACITY_CONFIG = {
	blankCards: parseIntParam('capPad', 15, 0, 80),
	min: Math.min(capMin, capMax),
	max: Math.max(capMin, capMax)
};
