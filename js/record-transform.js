export function buildActualWordMap(columns, scheduleData) {
	const output = {};
	if (!Array.isArray(scheduleData)) return output;

	columns.forEach((column) => {
		if (column.kind !== 'word') return;
		output[column.sourceField] = scheduleData
			.map((item) => getColumnTarget(column, item))
			.filter((item) => item && item.local);
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
		return (safeRecord[sourceField] || '').toString();
	}

	if (column.kind === 'word') {
		const target = safeRecord[sourceField] || null;
		if (target && column.colorFields) {
			return {
				...target,
				color: safeRecord[column.colorFields.background],
				textColor: safeRecord[column.colorFields.text]
			};
		}
		return target;
	}

	return null;
}
