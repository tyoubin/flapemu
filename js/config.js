export const CHARS_NUM = " 0123456789";
export const CHARS_ALPHANUM = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const BLANK_DATA = { local: " ", en: " ", color: "#202020", textColor: "#f5f5f5" };

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);
// Default to reading timetable/demo.json for testing
export const DATA_SOURCE = urlParams.get('t') ? `./timetable/${urlParams.get('t')}.json` : './timetable/demo.json';
export const PREVIEW_MODE = urlParams.has('preview');

export const ROW_COUNT = 3;
