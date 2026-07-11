export function buildActualWordMap(columns, scheduleData) {
	const output = {};
	if (!Array.isArray(scheduleData)) return output;

	columns.forEach((column) => {
		if (column.kind !== 'word') return;
		output[column.sourceField] = scheduleData
			.map((item) => getColumnTarget(column, item))
			.filter((item) => item && item.main);
	});

	return output;
}

export function getColumnTarget(column, record) {
	const safeRecord = record || {};
	const sourceField = column.sourceField || column.key;

	if (column.kind === 'chars') {
		const raw = (safeRecord[sourceField] || '').toString();
		return raw.padEnd(column.padEnd || raw.length, ' ');
	}

	if (column.kind === 'time') {
		let raw = (safeRecord[sourceField] || '').toString();
		if (column.timeSeparator) {
			raw = raw.replace(':', column.timeSeparator);
		}
		return raw;
	}

	if (column.kind === 'word') {
		const target = safeRecord[sourceField] || null;
		if (target && column.colorFields) {
			const out = { ...target };
			const bg = safeRecord[column.colorFields.background];
			const tc = safeRecord[column.colorFields.text];
			if (bg != null) out.color = bg;
			if (tc != null) out.textColor = tc;
			return out;
		}
		return target;
	}

	return null;
}
