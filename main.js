import {
	CASCADE_DELAY_MS,
	DATA_SOURCE,
	DISPLAY_MODE,
	FILTER_TRACKS,
	LAYOUT_WIDTH_MULTIPLIER,
	LAYOUT_WIDTH_PADDING,
	PREVIEW_MODE,
	REFRESH_INTERVAL_MS,
	ROW_COUNT
} from './js/config.js';
import { getDisplayModeProfile, getDynamicWidthColumns, getVisibleColumns } from './js/board-schema.js';
import { normalizeTimetable } from './js/data-normalize.js';
import { sleep, calculateVisualLength, setFavicon } from './js/utils.js';
import { TrainGroup } from './js/TrainGroup.js';

let groups = [];
let isInitialized = false;
const visibleColumns = getVisibleColumns(DISPLAY_MODE);

function renderHeaderRow(columns) {
	const headerRow = document.getElementById('header-row');
	if (!headerRow) return;

	headerRow.innerHTML = '';
	columns.forEach((column) => {
		const item = document.createElement('div');
		item.className = `${column.cssClass} header-item`;

		const local = document.createElement('span');
		local.textContent = column.header.local;
		const en = document.createElement('span');
		en.textContent = column.header.en;

		item.appendChild(local);
		item.appendChild(en);
		headerRow.appendChild(item);
	});
}

async function fetchData() {
	try {
		// Clear Previous Error State
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.remove('board-error');
		if (statusEl) statusEl.innerHTML = '';

		let json;

		if (PREVIEW_MODE) {
			const previewData = sessionStorage.getItem('flapemu_preview');
			if (previewData) {
				console.log('[System] Loading preview data from editor...');
				json = JSON.parse(previewData);
			} else {
				console.warn('[System] Preview mode but no data found in sessionStorage');
				return;
			}
		} else {
			console.log(`[System] Fetching ${DATA_SOURCE}...`);
			const response = await fetch(DATA_SOURCE, { cache: "no-store" });
			if (!response.ok) throw new Error("API Network response was not ok");
			json = await response.json();
		}

		const normalized = normalizeTimetable(json);
		let scheduleData = normalized.schedule;
		const presetsData = normalized.presets;
		const metaData = normalized.meta || {};

		// --- Apply Track Filtering (if FILTER_TRACKS is defined) ---
		if (FILTER_TRACKS) {
			scheduleData = scheduleData.filter(train => {
				return FILTER_TRACKS.includes(String(train.track_no));
			});
		}

		// Auto-Layout
		const extractFromSchedule = (schedule, key) => {
			if (!schedule) return [];
			return schedule.map(item => {
				if (item[key] && item[key].local) return item[key];
				return { local: "" };
			});
		};

		const adjustColumnWidth = (cssVar, presetList, scheduleList, minChars = 4) => {
			const fullList = [...(presetList || []), ...(scheduleList || [])];
			if (fullList.length === 0) return;

			let maxLen = 0;
			fullList.forEach(item => {
				const visualLength = calculateVisualLength(item.local);
				if (visualLength > maxLen) maxLen = visualLength;
			});

			if (maxLen < minChars) maxLen = minChars;
			const pixelWidth = Math.ceil((maxLen * LAYOUT_WIDTH_MULTIPLIER) + LAYOUT_WIDTH_PADDING);
			document.documentElement.style.setProperty(cssVar, `${pixelWidth}px`);
		};

		getDynamicWidthColumns().forEach((column) => {
			adjustColumnWidth(
				column.widthVar,
				presetsData[column.presetKey],
				extractFromSchedule(scheduleData, column.sourceField),
				column.minChars
			);
		});


		// --- Browser Tab Title ---
		const headerData = metaData.header;
		if (headerData && headerData.line_name && headerData.for) {
			document.title = `${headerData.line_name.local} ${headerData.for.local}`;
		} else if (headerData && headerData.line_name) {
			document.title = headerData.line_name.local || "FlapEmu";
		} else {
			document.title = "FlapEmu";
		}

		// --- Browser Tab Icon ---
		if (headerData && headerData.logo_url) {
			setFavicon(headerData.logo_url);
		}

		// --- Header Update Logic ---
		if (headerData) {
			const elLineLocal = document.getElementById('header-line-local');
			const elLineEn = document.getElementById('header-line-en');

			if (elLineLocal) elLineLocal.textContent = headerData.line_name.local;
			if (elLineEn) elLineEn.textContent = headerData.line_name.en;

			const elDestLocal = document.getElementById('header-dest-local');
			const elDestEn = document.getElementById('header-dest-en');

			if (elDestLocal) elDestLocal.textContent = headerData.for.local;
			if (elDestEn) elDestEn.textContent = headerData.for.en;

			// 3. Logo (SVG)
			const elLogo = document.getElementById('header-logo');
			if (elLogo && headerData.logo_url) {
				// Only update if URL changed (similar to favicon logic)
				const existingImg = elLogo.querySelector('img');
				const currentSrc = existingImg ? existingImg.src : null;
				const newUrl = headerData.logo_url;

				// Check if URL has changed (handle both relative and absolute URLs)
				if (!existingImg || (currentSrc !== newUrl && currentSrc !== window.location.origin + '/' + newUrl)) {
					elLogo.innerHTML = `<img src="${newUrl}" alt="Line Logo">`;
				}
				elLogo.style.display = 'flex';
			} else if (elLogo) {
				// User requested to preserve the square space
				elLogo.innerHTML = '';
				elLogo.style.display = 'flex';
			}
		} else {
			// If no header data, we might want to hide the whole top bar or show error?
			// But existing code for station_name title logic (browser tab) remains above.
			// We will leave the DOM empty if no data.
			console.warn("[System] 'header' metadata missing in JSON.");
		}


		if (!isInitialized) {
			console.log("[System] Initializing Board...");
			const rowsContainer = document.getElementById('board-rows');
			if (rowsContainer) {
				rowsContainer.innerHTML = "";
				for (let i = 0; i < ROW_COUNT; i++) {
					groups.push(new TrainGroup(rowsContainer, presetsData, scheduleData, visibleColumns));
				}
				isInitialized = true;
			}
		} else {
			groups.forEach(g => g.updatePhysicalLists(presetsData, scheduleData));
		}

		if (!scheduleData || scheduleData.length === 0) return;

		scheduleData.sort((a, b) => a.depart_time.localeCompare(b.depart_time));

		const now = new Date();
		const currentHM = now.getHours() * 60 + now.getMinutes();

		let startIndex = scheduleData.findIndex(train => {
			const [h, m] = train.depart_time.split(':').map(Number);
			return (h * 60 + m) >= currentHM;
		});

		if (startIndex === -1) startIndex = 0;

		const displayTrains = [];
		for (let i = 0; i < ROW_COUNT; i++) {
			let dataIndex = (startIndex + i) % scheduleData.length;
			displayTrains.push(scheduleData[dataIndex]);
		}

		for (let i = 0; i < ROW_COUNT; i++) {
			if (groups[i]) {
				groups[i].update(displayTrains[i]);
				if (i < ROW_COUNT - 1) {
					await sleep(CASCADE_DELAY_MS);
				}
			}
		}

	} catch (e) {
		console.error("Error fetching data:", e);
		// Visual Error Handling
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.add('board-error');
		if (statusEl) {
			statusEl.innerHTML = `
				<div class="status-text status-error">
					<div class="status-main">ただいま調整中 / System Adjustment</div>
					<div class="status-description">表示の更新を停止しています。アナウンスにご注意ください。<br>Display update paused. Please refer to announcements.</div>
				</div>
			`;
		}
	}
}

window.addEventListener('load', () => {
	// Add display mode class to body for CSS targeting
	document.body.classList.add(`mode-${DISPLAY_MODE}`);
	renderHeaderRow(visibleColumns);

	const modeProfile = getDisplayModeProfile(DISPLAY_MODE);
	const topBar = document.querySelector('.top-bar');
	if (topBar && modeProfile.showTopBar === false) {
		topBar.style.display = 'none';
	}

	fetchData();
	setInterval(() => {
		console.log(`[Auto-Update] Fetching...`);
		fetchData();
	}, REFRESH_INTERVAL_MS);
});
