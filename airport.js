import { sleep, calculateVisualLength, setFavicon } from './js/utils.js';
import { RowGroup } from './js/RowGroup.js';
import {
	getDisplayModeProfile,
	getDynamicWidthColumns,
	getVisibleColumns,
	DEFAULT_DISPLAY_MODE
} from './js/airport-schema.js';
import { selectDisplayFlights, prepareAirportBoardData } from './js/airport-pipeline.js';

const ROW_COUNT = 8;
const CASCADE_DELAY_MS = 800;
const REFRESH_INTERVAL_MS = 30000;
const LAYOUT_WIDTH_MULTIPLIER = 32;
const LAYOUT_WIDTH_PADDING = 20;
const DISPLAY_MODE = DEFAULT_DISPLAY_MODE;
const visibleColumns = getVisibleColumns(DISPLAY_MODE);
const PRESETS_SOURCE = './timetable/narita.json';

let groups = [];
let isInitialized = false;
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
		img.alt = 'Airport Logo';
		elLogo.replaceChildren(img);
	}
	const nextHref = new URL(logoUrl, window.location.href).href;
	if (img.src !== nextHref) img.setAttribute('src', logoUrl);
	elLogo.style.display = 'flex';
}

async function fetchData() {
	try {
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.remove('board-error');
		if (statusEl) statusEl.innerHTML = '';

		const response = await fetch(PRESETS_SOURCE, { cache: 'no-store' });
		if (!response.ok) throw new Error('Network response was not ok');
		const json = await response.json();

		const { scheduleData, presetsData, metaData } = prepareAirportBoardData(json);

		// Auto-layout
		getDynamicWidthColumns().forEach((column) => {
			const fullList = [...(presetsData[column.presetKey] || [])];
			let maxLen = 0;
			fullList.forEach(item => {
				const visualLength = calculateVisualLength(item.local);
				if (visualLength > maxLen) maxLen = visualLength;
			});
			if (maxLen < column.minChars) maxLen = column.minChars;
			const pixelWidth = Math.ceil((maxLen * LAYOUT_WIDTH_MULTIPLIER) + LAYOUT_WIDTH_PADDING);
			document.documentElement.style.setProperty(column.widthVar, `${pixelWidth}px`);
		});

		// Tab title / icon
		const headerData = metaData.header;
		if (headerData) {
			if (headerData.line_name && headerData.for) {
				document.title = `${headerData.line_name.local} ${headerData.for.local}`;
			}
			if (headerData.logo_url) setFavicon(headerData.logo_url);

			const elLineLocal = document.getElementById('header-line-local');
			const elLineEn = document.getElementById('header-line-en');
			if (elLineLocal) elLineLocal.textContent = headerData.line_name?.local || '';
			if (elLineEn) elLineEn.textContent = headerData.line_name?.en || '';

			const elDestLocal = document.getElementById('header-dest-local');
			const elDestEn = document.getElementById('header-dest-en');
			if (elDestLocal) elDestLocal.textContent = headerData.for?.local || '';
			if (elDestEn) elDestEn.textContent = headerData.for?.en || '';

			setHeaderLogo(document.getElementById('header-logo'), headerData.logo_url);
		}

		if (!isInitialized) {
			const rowsContainer = document.getElementById('board-rows');
			if (rowsContainer) {
				rowsContainer.innerHTML = '';
				for (let i = 0; i < ROW_COUNT; i++) {
					groups.push(new RowGroup(rowsContainer, presetsData, scheduleData, visibleColumns));
				}
				isInitialized = true;
			}
		} else {
			groups.forEach(g => g.updatePhysicalLists(presetsData, scheduleData));
		}

		if (!scheduleData || scheduleData.length === 0) return;

		const displayRows = selectDisplayFlights(scheduleData, ROW_COUNT, new Date());
		for (let i = 0; i < ROW_COUNT; i++) {
			if (groups[i]) {
				groups[i].update(displayRows[i]);
				if (i < ROW_COUNT - 1) await new Promise(r => setTimeout(r, CASCADE_DELAY_MS));
			}
		}
	} catch (e) {
		console.error('Error fetching data:', e);
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
	document.body.classList.add(`mode-${DISPLAY_MODE}`);
	renderHeaderRow(visibleColumns);

	const modeProfile = getDisplayModeProfile(DISPLAY_MODE);
	const topBar = document.querySelector('.top-bar');
	if (topBar && modeProfile.showTopBar === false) {
		topBar.style.display = 'none';
	}

	fetchData();
	refreshTimerId = setInterval(fetchData, REFRESH_INTERVAL_MS);
});