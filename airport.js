import { sleep, calculateVisualLength, setFavicon } from './js/utils.js';
import { RowGroup } from './js/RowGroup.js';
import { prepareBoardData, selectDisplayRows } from './js/board-pipeline.js';

const DATA_SOURCE = './timetable/narita.json';

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

		const response = await fetch(DATA_SOURCE, { cache: 'no-store' });
		if (!response.ok) throw new Error('Network response was not ok');
		const json = await response.json();

		const config = prepareBoardData(json);
		const { meta, presets, rows, columns, ui } = config;

		const hiddenColumns = new Set(ui.hiddenColumns || []);
		const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));
		const rowCount = ui.rows || 8;
		const timeField = (ui.window && ui.window.timeField) || 'depart_time';

		if (!isInitialized) {
			document.body.classList.add(`mode-${ui.mode || 'departures'}`);
			renderHeaderRow(visibleColumns);
			const topBar = document.querySelector('.top-bar');
			if (topBar && !ui.showTopBar) {
				topBar.style.display = 'none';
			}
		}

		// Auto-layout for dynamic width columns
		const dynamicWidthColumns = columns.filter(col => col.kind === 'word' && col.widthVar);
		dynamicWidthColumns.forEach((column) => {
			const fullList = [...(presets[column.presetKey || column.preset] || [])];
			let maxLen = 0;
			fullList.forEach(item => {
				const visualLength = calculateVisualLength(item.local);
				if (visualLength > maxLen) maxLen = visualLength;
			});
			if (maxLen < column.minChars) maxLen = column.minChars;
			const pixelWidth = Math.ceil((maxLen * 32) + 20);
			document.documentElement.style.setProperty(column.widthVar, `${pixelWidth}px`);
		});

		// Tab title / icon
		const headerData = meta.header;
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
				for (let i = 0; i < rowCount; i++) {
					groups.push(new RowGroup(rowsContainer, presets, rows, visibleColumns));
				}
				isInitialized = true;
			}
		} else {
			groups.forEach(g => g.updatePhysicalLists(presets, rows));
		}

		if (!rows || rows.length === 0) return;

		const displayRows = selectDisplayRows(rows, rowCount, timeField, new Date());
		for (let i = 0; i < rowCount; i++) {
			if (groups[i]) {
				groups[i].update(displayRows[i]);
				if (i < rowCount - 1) await new Promise(r => setTimeout(r, ui.cascadeMs || 800));
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
	fetchData();
	refreshTimerId = setInterval(fetchData, 30000);
});