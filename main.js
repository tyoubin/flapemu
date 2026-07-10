import {
	CASCADE_DELAY_MS,
	DATA_SOURCE,
	DISPLAY_MODE as URL_DISPLAY_MODE,
	FILTER_TRACKS,
	INVALID_TIMETABLE_QUERY,
	LAYOUT_WIDTH_MULTIPLIER,
	LAYOUT_WIDTH_PADDING,
	PREVIEW_MODE,
	REFRESH_INTERVAL_MS
} from './js/config.js';
import { extractScheduleWords, selectDisplayTrains, prepareTrainBoardData } from './js/train-pipeline.js';
import { sleep, calculateVisualLength, setFavicon } from './js/utils.js';
import { RowGroup } from './js/RowGroup.js';

let groups = [];
let isInitialized = false;
let isFetchRunning = false;
let refreshTimerId = null;

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

function setHeaderLogo(elLogo, logoUrl) {
	if (!elLogo) return;

	if (!logoUrl) {
		const existing = elLogo.querySelector('img');
		if (existing) elLogo.removeChild(existing);
		elLogo.style.display = 'flex';
		return;
	}

	let img = elLogo.querySelector('img');
	if (!img) {
		img = document.createElement('img');
		img.alt = 'Line Logo';
		elLogo.replaceChildren(img);
	}

	const currentSrc = img.getAttribute('src') || '';
	const nextHref = new URL(logoUrl, window.location.href).href;
	if (currentSrc !== logoUrl && img.src !== nextHref) {
		img.setAttribute('src', logoUrl);
	}
	elLogo.style.display = 'flex';
}

function parseUrlRows() {
	const raw = new URLSearchParams(window.location.search).get('rows');
	if (raw === null || raw === '') return null;
	const parsed = parseInt(raw, 10);
	if (!Number.isFinite(parsed)) return null;
	return Math.min(Math.max(parsed, 1), 30);
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
			if (INVALID_TIMETABLE_QUERY) {
				throw new Error("Invalid timetable query parameter 't'.");
			}
			console.log(`[System] Fetching ${DATA_SOURCE}...`);
			const response = await fetch(DATA_SOURCE, { cache: "no-store" });
			if (!response.ok) throw new Error("API Network response was not ok");
			json = await response.json();
		}

		const config = prepareTrainBoardData(json, FILTER_TRACKS);
		const { meta, presets, rows, columns, ui } = config;

		// Determine display mode: URL param overrides config
		const displayMode = URL_DISPLAY_MODE || ui.mode || 'concourse';
		const hiddenColumns = new Set(ui.hiddenColumns || []);
		const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));
		const rowCount = parseUrlRows() || ui.rows || 12;

		// Render header and apply mode on first fetch
		if (!isInitialized) {
			document.body.classList.add(`mode-${displayMode}`);
			renderHeaderRow(visibleColumns);
			const topBar = document.querySelector('.top-bar');
			if (topBar && !ui.showTopBar) {
				topBar.style.display = 'none';
			}
		}

		// Auto-Layout
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

		const dynamicWidthColumns = columns.filter(col => col.kind === 'word' && col.widthVar);
		dynamicWidthColumns.forEach((column) => {
			adjustColumnWidth(
				column.widthVar,
				presets[column.presetKey],
				extractScheduleWords(rows, column.sourceField),
				column.minChars
			);
		});


		// --- Browser Tab Title ---
		const headerData = meta.header;
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
			setHeaderLogo(elLogo, headerData.logo_url);
		} else {
			console.warn("[System] 'header' metadata missing in JSON.");
		}


		if (!isInitialized) {
			console.log("[System] Initializing Board...");
			const rowsContainer = document.getElementById('board-rows');
			if (rowsContainer) {
				rowsContainer.innerHTML = "";
				for (let i = 0; i < rowCount; i++) {
					groups.push(new RowGroup(rowsContainer, presets, rows, visibleColumns));
				}
				isInitialized = true;
			}
		} else {
			groups.forEach(g => g.updatePhysicalLists(presets, rows));
		}

		if (!rows || rows.length === 0) return;

		const displayTrains = selectDisplayTrains(rows, rowCount, new Date());

		for (let i = 0; i < rowCount; i++) {
			if (groups[i]) {
				groups[i].update(displayTrains[i]);
				if (i < rowCount - 1) {
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

async function requestFetch(trigger = 'manual') {
	if (isFetchRunning) {
		console.log(`[Auto-Update] Skip (${trigger}) - previous fetch cycle is still running.`);
		return;
	}

	isFetchRunning = true;
	try {
		await fetchData();
	} finally {
		isFetchRunning = false;
	}
}

function stopAutoRefresh() {
	if (refreshTimerId !== null) {
		clearInterval(refreshTimerId);
		refreshTimerId = null;
	}
}

function startAutoRefresh() {
	stopAutoRefresh();

	if (document.visibilityState === 'hidden') {
		console.log('[Auto-Update] Polling paused (tab hidden).');
		return;
	}

	refreshTimerId = setInterval(() => {
		console.log('[Auto-Update] Fetching...');
		requestFetch('interval');
	}, REFRESH_INTERVAL_MS);
}

function handleVisibilityChange() {
	if (document.visibilityState === 'hidden') {
		stopAutoRefresh();
		return;
	}

	requestFetch('visibility-resume');
	startAutoRefresh();
}

window.addEventListener('load', () => {
	requestFetch('initial').then(() => {
		startAutoRefresh();
	});

	document.addEventListener('visibilitychange', handleVisibilityChange);
});