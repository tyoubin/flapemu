import { LAYOUT_WIDTH_MULTIPLIER, LAYOUT_WIDTH_PADDING } from './js/config.js';
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

function renderTopBar(meta) {
	let topBar = document.querySelector('.top-bar');
	if (!topBar) {
		topBar = document.createElement('div');
		topBar.className = 'top-bar';
		const container = document.querySelector('.main-container') || document.body;
		container.insertBefore(topBar, container.firstChild);
	}
	topBar.innerHTML = `
		<div class="header-logo-section" id="header-logo"></div>
		<div class="header-info-section">
			<div class="header-line-name">
				<span class="header-text-local" id="header-line-local"></span>
				<span class="header-text-en" id="header-line-en"></span>
			</div>
			<div class="header-direction">
				<span class="header-text-local" id="header-dest-local"></span>
				<span class="header-text-en" id="header-dest-en"></span>
			</div>
		</div>
	`;

	const elLineLocal = document.getElementById('header-line-local');
	const elLineEn = document.getElementById('header-line-en');
	if (elLineLocal) elLineLocal.textContent = meta.line_name?.local || '';
	if (elLineEn) elLineEn.textContent = meta.line_name?.en || '';

	const elDestLocal = document.getElementById('header-dest-local');
	const elDestEn = document.getElementById('header-dest-en');
	if (elDestLocal) elDestLocal.textContent = meta.for?.local || '';
	if (elDestEn) elDestEn.textContent = meta.for?.en || '';

	const elLogo = document.getElementById('header-logo');
	setHeaderLogo(elLogo, meta.logo_url);
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

function parseUrlParams() {
	const params = new URLSearchParams(window.location.search);
	const t = params.get('t');
	const timetableName = !t ? 'demo' : /^[a-zA-Z0-9_-]+$/.test(t) ? t : '__invalid__';
	return {
		dataSource: `./timetable/${timetableName}.json`,
		invalidQuery: timetableName === '__invalid__',
		previewMode: params.has('preview')
	};
}

async function fetchData() {
	try {
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.remove('board-error');
		if (statusEl) statusEl.innerHTML = '';

		const urlParams = parseUrlParams();
		let json;

		if (urlParams.previewMode) {
			const previewData = sessionStorage.getItem('flapemu_preview');
			if (previewData) {
				console.log('[System] Loading preview data from editor...');
				json = JSON.parse(previewData);
			} else {
				console.warn('[System] Preview mode but no data found in sessionStorage');
				return;
			}
		} else {
			if (urlParams.invalidQuery) {
				throw new Error("Invalid timetable query parameter 't'.");
			}
			console.log(`[System] Fetching ${urlParams.dataSource}...`);
			const response = await fetch(urlParams.dataSource, { cache: "no-store" });
			if (!response.ok) throw new Error("API Network response was not ok");
			json = await response.json();
		}

		const config = prepareTrainBoardData(json, null);
		const { presets, rows, columns, ui } = config;

		const displayMode = ui.mode || 'concourse';
		const hiddenColumns = new Set(ui.hiddenColumns || []);
		const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));
		const rowCount = ui.rows || 12;

		if (!isInitialized) {
			document.body.classList.add(`mode-${displayMode}`);
			renderHeaderRow(visibleColumns);

			const meta = json.meta;
			if (meta && meta.header) {
				renderTopBar(meta.header);
			}
		}

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

		const headerData = json.meta ? json.meta.header : null;
		if (headerData && headerData.line_name && headerData.for) {
			document.title = `${headerData.line_name.local} ${headerData.for.local}`;
		} else if (headerData && headerData.line_name) {
			document.title = headerData.line_name.local || "FlapEmu";
		} else {
			document.title = "FlapEmu";
		}

		if (headerData && headerData.logo_url) {
			setFavicon(headerData.logo_url);
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
		const cascadeMs = ui.cascadeMs || 1000;

		for (let i = 0; i < rowCount; i++) {
			if (groups[i]) {
				groups[i].update(displayTrains[i]);
				if (i < rowCount - 1) {
					await sleep(cascadeMs);
				}
			}
		}

	} catch (e) {
		console.error("Error fetching data:", e);
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
	}, 30000);
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