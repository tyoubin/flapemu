/**
 * FlapEmu Timetable Editor
 * Core logic for creating and editing JSON timetable files
 */
import { createEmptyTimetable, normalizeTimetable } from './js/data-normalize.js';

// ================= DATA MODEL =================

const STORAGE_KEY = 'flapemu_editor_draft';

// Current timetable data
let timetable = createEmptyTimetable();

// ================= DOM REFERENCES =================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const elements = {
	// Meta
	headerLineLocal: $('#header-line-local'),
	headerLineEn: $('#header-line-en'),
	headerForLocal: $('#header-for-local'),
	headerForEn: $('#header-for-en'),
	headerLogoUrl: $('#header-logo-url'),
	// Preset lists
	listTypes: $('#list-types'),
	listDests: $('#list-dests'),
	listRemarks: $('#list-remarks'),
	listStops: $('#list-stops'),
	// Schedule
	scheduleBody: $('#schedule-body'),
	scheduleCount: $('#schedule-count'),
	// Buttons
	btnNew: $('#btn-new'),
	btnImport: $('#btn-import'),
	btnExport: $('#btn-export'),
	btnPreview: $('#btn-preview'),
	btnAddType: $('#btn-add-type'),
	btnAddDest: $('#btn-add-dest'),
	btnAddRemark: $('#btn-add-remark'),
	btnAddStop: $('#btn-add-stop'),
	btnAddSchedule: $('#btn-add-schedule'),
	// Modal
	modalOverlay: $('#modal-overlay'),
	modalTitle: $('#modal-title'),
	modalBody: $('#modal-body'),
	modalSave: $('#modal-save'),
	modalCancel: $('#modal-cancel'),
	modalClose: $('#modal-close'),
	// File input
	fileInput: $('#file-input')
};

// ================= INITIALIZATION =================

// Handle dynamically loaded scripts - check if DOM is already ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

function init() {
	setupEventListeners();
	setupPresetTabs();
	checkForDraft();
}

function setupEventListeners() {
	// Meta inputs - live update
	elements.headerLineLocal.addEventListener('input', (e) => {
		timetable.meta.header.line_name.local = e.target.value;
		saveDraft();
	});
	elements.headerLineEn.addEventListener('input', (e) => {
		timetable.meta.header.line_name.en = e.target.value;
		saveDraft();
	});
	elements.headerForLocal.addEventListener('input', (e) => {
		timetable.meta.header.for.local = e.target.value;
		saveDraft();
	});
	elements.headerForEn.addEventListener('input', (e) => {
		timetable.meta.header.for.en = e.target.value;
		saveDraft();
	});
	elements.headerLogoUrl.addEventListener('input', (e) => {
		timetable.meta.header.logo_url = e.target.value;
		saveDraft();
	});

	// Top actions
	elements.btnNew.addEventListener('click', handleNew);
	elements.btnImport.addEventListener('click', () => elements.fileInput.click());
	elements.fileInput.addEventListener('change', handleImport);
	elements.btnExport.addEventListener('click', handleExport);
	elements.btnPreview.addEventListener('click', handlePreview);

	// Add preset buttons
	elements.btnAddType.addEventListener('click', () => openPresetModal('types'));
	elements.btnAddDest.addEventListener('click', () => openPresetModal('dests'));
	elements.btnAddRemark.addEventListener('click', () => openPresetModal('remarks'));
	elements.btnAddStop.addEventListener('click', () => openPresetModal('stops'));

	// Add schedule
	elements.btnAddSchedule.addEventListener('click', addScheduleRow);

	// Modal
	elements.modalClose.addEventListener('click', closeModal);
	elements.modalCancel.addEventListener('click', closeModal);
	elements.modalOverlay.addEventListener('click', (e) => {
		if (e.target === elements.modalOverlay) closeModal();
	});

	// Keyboard shortcuts
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeModal();
		if (e.ctrlKey && e.key === 's') {
			e.preventDefault();
			handleExport();
		}
	});
}

function setupPresetTabs() {
	$$('.preset-tab').forEach(tab => {
		tab.addEventListener('click', () => {
			$$('.preset-tab').forEach(t => t.classList.remove('active'));
			$$('.preset-panel').forEach(p => p.classList.remove('active'));
			tab.classList.add('active');
			$(`#panel-${tab.dataset.tab}`).classList.add('active');
		});
	});
}

// ================= DRAFT HANDLING =================

function saveDraft() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(timetable));
	} catch (e) {
		console.warn('[Editor] Could not save draft:', e);
	}
}

function loadDraft() {
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		if (data) {
			timetable = normalizeTimetable(JSON.parse(data));
			return true;
		}
	} catch (e) {
		console.warn('[Editor] Could not load draft:', e);
	}
	return false;
}

function clearDraft() {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		console.warn('[Editor] Could not clear draft:', e);
	}
}

function checkForDraft() {
	const draft = localStorage.getItem(STORAGE_KEY);
	if (draft) {
		const restored = confirm('A draft was found. Would you like to restore it?\n\nClick OK to restore, or Cancel to start fresh.');
		if (restored) {
			loadDraft();
			renderAll();
			showToast('Draft restored', 'success');
		} else {
			clearDraft();
			timetable = createEmptyTimetable();
			renderAll();
		}
	} else {
		renderAll();
	}
}

// ================= RENDER FUNCTIONS =================

function renderAll() {
	renderMeta();
	renderPresets('types');
	renderPresets('dests');
	renderPresets('remarks');
	renderPresets('stops');
	renderSchedule();
}

function renderMeta() {
	const h = timetable.meta.header || {
		line_name: { local: '', en: '' },
		for: { local: '', en: '' },
		logo_url: ''
	};
	elements.headerLineLocal.value = h.line_name?.local || '';
	elements.headerLineEn.value = h.line_name?.en || '';
	elements.headerForLocal.value = h.for?.local || '';
	elements.headerForEn.value = h.for?.en || '';
	elements.headerLogoUrl.value = h.logo_url || '';
}

function renderPresets(type) {
	const list = elements[`list${capitalize(type)}`];
	const presets = timetable.presets[type];

	if (!presets || presets.length === 0) {
		list.innerHTML = '<div class="empty-state"><p>No items yet</p></div>';
		return;
	}

	list.innerHTML = presets.map((item, idx) => {
		const hasColor = type === 'types' && item.color;
		const colorSwatch = hasColor
			? `<div class="preset-color-swatch" style="background: ${item.color}; color: ${item.textColor || '#fff'}"></div>`
			: '';

		return `
            <div class="preset-item" data-type="${type}" data-index="${idx}">
                <div class="preset-item-content">
                    ${colorSwatch}
                    <div class="preset-text">
                        <span class="preset-text-local">${escapeHtml(item.local || '')}</span>
                        <span class="preset-text-en">${escapeHtml(item.en || '')}</span>
                    </div>
                </div>
                <div class="preset-item-actions">
                    <button class="btn-icon" onclick="editPreset('${type}', ${idx})" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="deletePreset('${type}', ${idx})" title="Delete">🗑️</button>
                </div>
            </div>
        `;
	}).join('');
}

function renderSchedule() {
	const schedule = timetable.schedule;
	elements.scheduleCount.textContent = `(${schedule.length} entries)`;

	if (schedule.length === 0) {
		elements.scheduleBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state"><p>No trains scheduled yet</p></td>
            </tr>
        `;
		return;
	}

	elements.scheduleBody.innerHTML = schedule.map((train, idx) => `
        <tr data-index="${idx}">
            <td class="row-actions">
                <button class="btn-icon" onclick="moveScheduleRow(${idx}, -1)" title="Move up">⬆️</button>
                <button class="btn-icon" onclick="moveScheduleRow(${idx}, 1)" title="Move down">⬇️</button>
                <button class="btn-icon" onclick="deleteScheduleRow(${idx})" title="Delete">🗑️</button>
            </td>
            <td>
                <input type="text" value="${escapeHtml(train.track_no || '')}" 
                    onchange="updateScheduleField(${idx}, 'track_no', this.value)" 
                    style="width: 50px">
            </td>
            <td>
                <div class="bilingual-cell" onclick="editScheduleBilingual(${idx}, 'type')">
                    <div class="local">${escapeHtml(train.type?.local || '')}</div>
                    <div class="en">${escapeHtml(train.type?.en || '')}</div>
                </div>
            </td>
            <td class="color-cell">
                <input type="color" value="${train.type_color_hex || '#333333'}" 
                    onchange="updateScheduleField(${idx}, 'type_color_hex', this.value)" title="Background">
                <input type="color" value="${train.type_text_color || '#ffffff'}" 
                    onchange="updateScheduleField(${idx}, 'type_text_color', this.value)" title="Text">
            </td>
            <td>
                <input type="text" value="${escapeHtml(train.train_no || '')}" 
                    onchange="updateScheduleField(${idx}, 'train_no', this.value)" 
                    style="width: 80px">
            </td>
            <td>
                <input type="text" value="${escapeHtml(train.depart_time || '')}" 
                    onchange="updateScheduleField(${idx}, 'depart_time', this.value)" 
                    style="width: 60px" placeholder="HH:MM">
            </td>
            <td>
                <div class="bilingual-cell" onclick="editScheduleBilingual(${idx}, 'destination')">
                    <div class="local">${escapeHtml(train.destination?.local || '')}</div>
                    <div class="en">${escapeHtml(train.destination?.en || '')}</div>
                </div>
            </td>
            <td>
                <div class="bilingual-cell" onclick="editScheduleBilingual(${idx}, 'remarks')">
                    <div class="local">${escapeHtml(train.remarks?.local || '')}</div>
                    <div class="en">${escapeHtml(train.remarks?.en || '')}</div>
                </div>
            </td>
            <td>
                <div class="bilingual-cell" onclick="editScheduleBilingual(${idx}, 'stops_at')">
                    <div class="local">${escapeHtml(train.stops_at?.local || '')}</div>
                    <div class="en">${escapeHtml(train.stops_at?.en || '')}</div>
                </div>
            </td>
        </tr>
    `).join('');
}

// ================= SCHEDULE CRUD =================

function addScheduleRow() {
	timetable.schedule.push({
		track_no: '',
		type: { local: '', en: '' },
		type_color_hex: '#333333',
		type_text_color: '#ffffff',
		train_no: '',
		depart_time: '',
		destination: { local: '', en: '' },
		remarks: { local: '', en: '' },
		stops_at: { local: '', en: '' }
	});
	renderSchedule();
	saveDraft();

	// Scroll to bottom
	const lastRow = elements.scheduleBody.lastElementChild;
	if (lastRow) lastRow.scrollIntoView({ behavior: 'smooth' });
}

window.updateScheduleField = function (idx, field, value) {
	timetable.schedule[idx][field] = value;
	saveDraft();
};

window.moveScheduleRow = function (idx, direction) {
	const newIdx = idx + direction;
	if (newIdx < 0 || newIdx >= timetable.schedule.length) return;

	const temp = timetable.schedule[idx];
	timetable.schedule[idx] = timetable.schedule[newIdx];
	timetable.schedule[newIdx] = temp;

	renderSchedule();
	saveDraft();
};

window.deleteScheduleRow = function (idx) {
	if (!confirm('Delete this train entry?')) return;
	timetable.schedule.splice(idx, 1);
	renderSchedule();
	saveDraft();
};

window.editScheduleBilingual = function (idx, field) {
	const train = timetable.schedule[idx];
	const current = train[field] || { local: '', en: '' };

	const titles = {
		type: 'Edit Train Type',
		destination: 'Edit Destination',
		remarks: 'Edit Remarks',
		stops_at: 'Edit Stops'
	};

	openBilingualModal(titles[field] || 'Edit', current, (newValue) => {
		train[field] = newValue;
		renderSchedule();
		saveDraft();
	});
};

// ================= PRESETS CRUD =================

window.openPresetModal = function (type, editIdx = null) {
	const isEdit = editIdx !== null;
	const current = isEdit ? timetable.presets[type][editIdx] : { local: '', en: '' };

	const titles = {
		types: isEdit ? 'Edit Train Type' : 'Add Train Type',
		dests: isEdit ? 'Edit Destination' : 'Add Destination',
		remarks: isEdit ? 'Edit Remark' : 'Add Remark',
		stops: isEdit ? 'Edit Stops Pattern' : 'Add Stops Pattern'
	};

	let formHtml = `
        <div class="form-group">
            <label>Local</label>
            <input type="text" id="modal-local" value="${escapeHtml(current.local || '')}" placeholder="e.g. 特急">
        </div>
        <div class="form-group">
            <label>English</label>
            <input type="text" id="modal-en" value="${escapeHtml(current.en || '')}" placeholder="e.g. LIMITED EXPRESS">
        </div>
    `;

	// Train types have color options
	if (type === 'types') {
		formHtml += `
            <div class="form-row">
                <div class="form-group">
                    <label>Background Color</label>
                    <input type="color" id="modal-color" value="${current.color || '#333333'}">
                </div>
                <div class="form-group">
                    <label>Text Color</label>
                    <input type="color" id="modal-textColor" value="${current.textColor || '#ffffff'}">
                </div>
            </div>
        `;
	}

	showModal(titles[type], formHtml, () => {
		const newItem = {
			local: $('#modal-local').value,
			en: $('#modal-en').value
		};

		if (type === 'types') {
			newItem.color = $('#modal-color').value;
			const textColor = $('#modal-textColor').value;
			if (textColor !== '#ffffff') {
				newItem.textColor = textColor;
			}
		}

		if (isEdit) {
			timetable.presets[type][editIdx] = newItem;
		} else {
			timetable.presets[type].push(newItem);
		}

		renderPresets(type);
		saveDraft();
		closeModal();
	});

	// Focus first input
	setTimeout(() => $('#modal-local')?.focus(), 100);
};

window.editPreset = function (type, idx) {
	openPresetModal(type, idx);
};

window.deletePreset = function (type, idx) {
	if (!confirm('Delete this preset?')) return;
	timetable.presets[type].splice(idx, 1);
	renderPresets(type);
	saveDraft();
};

// ================= BILINGUAL MODAL =================

function openBilingualModal(title, current, onSave) {
	const formHtml = `
        <div class="form-group">
            <label>Local</label>
            <input type="text" id="modal-local" value="${escapeHtml(current.local || '')}">
        </div>
        <div class="form-group">
            <label>English</label>
            <input type="text" id="modal-en" value="${escapeHtml(current.en || '')}">
        </div>
    `;

	showModal(title, formHtml, () => {
		onSave({
			local: $('#modal-local').value,
			en: $('#modal-en').value
		});
		closeModal();
	});

	setTimeout(() => $('#modal-local')?.focus(), 100);
}

// ================= MODAL HELPERS =================

function showModal(title, bodyHtml, onSave) {
	elements.modalTitle.textContent = title;
	elements.modalBody.innerHTML = bodyHtml;
	elements.modalOverlay.classList.add('active');

	// Remove old listener and add new one
	const newSaveBtn = elements.modalSave.cloneNode(true);
	elements.modalSave.parentNode.replaceChild(newSaveBtn, elements.modalSave);
	elements.modalSave = newSaveBtn;
	elements.modalSave.addEventListener('click', onSave);
}

function closeModal() {
	elements.modalOverlay.classList.remove('active');
}

// ================= IMPORT / EXPORT =================

function handleNew() {
	if (timetable.schedule.length > 0 || timetable.presets.types.length > 0) {
		if (!confirm('Clear current data and start fresh?')) return;
	}
	timetable = createEmptyTimetable();
	clearDraft();
	renderAll();
	showToast('Started new timetable', 'success');
}

function handleImport(e) {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (event) => {
		try {
			const data = JSON.parse(event.target.result);
			timetable = normalizeTimetable(data);

			renderAll();
			saveDraft();
			showToast(`Imported ${file.name}`, 'success');
		} catch (err) {
			console.error('[Editor] Import error:', err);
			showToast('Failed to import: ' + err.message, 'error');
		}
	};
	reader.readAsText(file);

	// Reset file input
	e.target.value = '';
}

function handleExport() {
	// Validate before export
	const lineNameLocal = timetable.meta.header?.line_name?.local;
	if (!lineNameLocal || lineNameLocal.trim() === '') {
		showToast('Please enter a Line Name (Local)', 'error');
		elements.headerLineLocal.focus();
		return;
	}

	const json = JSON.stringify(timetable, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const filename = sanitizeFilename(lineNameLocal) + '.json';

	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	showToast(`Exported ${filename}`, 'success');
}

function handlePreview() {
	// Save current data to sessionStorage for preview
	sessionStorage.setItem('flapemu_preview', JSON.stringify(timetable));

	// Open board.html with preview mode
	const params = new URLSearchParams(window.location.search);
	params.set('preview', '1');
	if (params.has('nocache') || params.has('dev')) {
		params.set('nocache', '1');
	}

	window.open(`board.html?${params.toString()}`, '_blank');
}

// ================= UTILITIES =================

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

function sanitizeFilename(name) {
	return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
}

function showToast(message, type = 'info') {
	let container = $('.toast-container');
	if (!container) {
		container = document.createElement('div');
		container.className = 'toast-container';
		document.body.appendChild(container);
	}

	const toast = document.createElement('div');
	toast.className = `toast ${type}`;
	toast.textContent = message;
	container.appendChild(toast);

	setTimeout(() => toast.remove(), 3000);
}

console.log('[Editor] FlapEmu Timetable Editor loaded');
