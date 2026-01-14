export const CHARS_NUM = " 0123456789";
export const CHARS_ALPHANUM = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const BLANK_DATA = { local: " ", en: " ", color: "#202020", textColor: "#f5f5f5" };

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);

// --- 1. Data Source ---
// ?t=demo -> ./timetable/demo.json
export const DATA_SOURCE = urlParams.get('t') ? `./timetable/${urlParams.get('t')}.json` : './timetable/demo.json';
export const PREVIEW_MODE = urlParams.has('preview');

// --- 2. Display Mode ---
// ?mode=concourse (default), ?mode=gate, ?mode=platform
export const DISPLAY_MODE = urlParams.get('mode') || 'concourse';

// --- 3. Track Filtering ---
// ?track=23,24 -> ['23', '24']
// missing track param -> null (all tracks, no filter)
const trackParam = urlParams.get('track');
export const FILTER_TRACKS = trackParam ? trackParam.split(',').map(t => t.trim()) : null;

// --- 4. Row Count ---
// read ?rows=N
// if missing, varies by display mode
const rowsParam = parseInt(urlParams.get('rows'), 10);
let defaultRows = 12; // concourse mode default

if (DISPLAY_MODE === 'platform') {
	defaultRows = 3;
} else if (DISPLAY_MODE === 'gate') {
	defaultRows = 4;
}

export const ROW_COUNT = (rowsParam > 0) ? rowsParam : defaultRows;
