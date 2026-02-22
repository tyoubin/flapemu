import { DEFAULT_DISPLAY_MODE, DISPLAY_MODE_PROFILES } from './board-schema.js';

export const BLANK_DATA = { local: " ", en: " ", color: "#202020", textColor: "#f5f5f5" };

const urlParams = new URLSearchParams(window.location.search);
const RUNTIME_PROFILES = {
	default: {
		refresh: 30000,
		cascade: 1000,
		fallback: 1000,
		layoutMul: 32,
		layoutPad: 20,
		capPad: 15,
		capMin: 40,
		capMax: 80
	},
	kiosk: {
		refresh: 20000,
		cascade: 800,
		fallback: 1000,
		layoutMul: 32,
		layoutPad: 20,
		capPad: 18,
		capMin: 45,
		capMax: 100
	},
	mobile: {
		refresh: 30000,
		cascade: 1200,
		fallback: 1200,
		layoutMul: 30,
		layoutPad: 18,
		capPad: 12,
		capMin: 30,
		capMax: 60
	},
	debug: {
		refresh: 10000,
		cascade: 200,
		fallback: 600,
		layoutMul: 32,
		layoutPad: 20,
		capPad: 10,
		capMin: 20,
		capMax: 80
	}
};

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
	if (!/^[a-zA-Z0-9_-]+$/.test(value)) return '__invalid_query__';
	return value;
}

// --- Data Source ---
const timetableName = parseTimetableName();
export const DATA_SOURCE = `./timetable/${timetableName}.json`;
export const INVALID_TIMETABLE_QUERY = timetableName === '__invalid_query__';
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

// --- Runtime Profile ---
const profileParam = urlParams.get('profile');
export const RUNTIME_PROFILE = RUNTIME_PROFILES[profileParam] ? profileParam : 'default';
const runtimeProfile = RUNTIME_PROFILES[RUNTIME_PROFILE];

// --- Row Count ---
const configuredRows = parseIntParam('rows', modeProfile.defaultRows, 1, 30);
export const ROW_COUNT = configuredRows;

// --- Runtime Tuning ---
export const REFRESH_INTERVAL_MS = parseIntParam('refresh', runtimeProfile.refresh, 5000, 300000);
export const CASCADE_DELAY_MS = parseIntParam('cascade', runtimeProfile.cascade, 0, 5000);
export const FLAP_ANIMATION_FALLBACK_MS = parseIntParam('fallback', runtimeProfile.fallback, 200, 5000);
export const LAYOUT_WIDTH_MULTIPLIER = parseIntParam('layoutMul', runtimeProfile.layoutMul, 16, 64);
export const LAYOUT_WIDTH_PADDING = parseIntParam('layoutPad', runtimeProfile.layoutPad, 0, 120);

const capMin = parseIntParam('capMin', runtimeProfile.capMin, 10, 240);
const capMax = parseIntParam('capMax', runtimeProfile.capMax, 10, 240);

export const WORD_CAPACITY_CONFIG = {
	blankCards: parseIntParam('capPad', runtimeProfile.capPad, 0, 80),
	min: Math.min(capMin, capMax),
	max: Math.max(capMin, capMax)
};
