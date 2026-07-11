import { prepareBoardData } from './js/board-pipeline.js';
import { mountBoard } from './js/flapemu.js';

const DEFAULT_REFRESH_MS = 30000;
const MIN_REFRESH_MS = 5000;
const MAX_REFRESH_MS = 300000;

let boardInstance = null;
let isFetchRunning = false;
let refreshTimerId = null;
let storedStatus = null;
let refreshIntervalMs = DEFAULT_REFRESH_MS;

function clampRefreshMs(value) {
	const n = Number(value);
	if (!Number.isFinite(n)) return DEFAULT_REFRESH_MS;
	return Math.min(Math.max(n, MIN_REFRESH_MS), MAX_REFRESH_MS);
}

function getDataSource() {
	const t = new URLSearchParams(window.location.search).get('t');
	const name = !t ? 'demo' : /^[a-zA-Z0-9_-]+$/.test(t) ? t : null;
	return { dataSource: `./timetable/${name || 'demo'}.json`, invalidQuery: name === null };
}

async function fetchData() {
	try {
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.remove('board-error');
		if (statusEl) statusEl.innerHTML = '';

		const urlParams = getDataSource();
		if (urlParams.invalidQuery) {
			throw new Error("Invalid timetable query parameter 't'.");
		}
		console.log(`[System] Fetching ${urlParams.dataSource}...`);
		const response = await fetch(urlParams.dataSource, { cache: "no-store" });
		if (!response.ok) throw new Error("API Network response was not ok");
		const json = await response.json();

		const config = prepareBoardData(json);
		storedStatus = (config.ui && config.ui.errorMessage) || null;
		refreshIntervalMs = clampRefreshMs(config.ui && config.ui.refreshMs);

		if (!boardInstance) {
			console.log("[System] Initializing Board...");
			boardInstance = mountBoard(board, config);
		} else {
			if (config.rows && config.rows.length > 0) {
				boardInstance.updateBoard(config.presets, config.rows);
			}
		}
	} catch (e) {
		console.error("Error fetching data:", e);
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.add('board-error');
		const st = storedStatus;
		if (statusEl) {
			statusEl.innerHTML = `
				<div class="status-text status-error">
					<div class="status-main">${st && st.main ? st.main : 'ただいま調整中 / System Adjustment'}</div>
					${st && st.description ? `<div class="status-description">${st.description}</div>` : '<div class="status-description">表示の更新を停止しています。アナウンスにご注意ください。<br>Display update paused. Please refer to announcements.</div>'}
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

	console.log(`[Auto-Update] Interval ${refreshIntervalMs}ms`);
	refreshTimerId = setInterval(() => {
		console.log('[Auto-Update] Fetching...');
		requestFetch('interval');
	}, refreshIntervalMs);
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
