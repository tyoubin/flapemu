export function buildActualWordMap(columns, scheduleData) {
	const output = {};
	if (!Array.isArray(scheduleData)) return output;

	columns.forEach((column) => {
		if (column.kind !== 'word') return;
		output[column.sourceField] = scheduleData
			.map((item) => item[column.sourceField])
			.filter((item) => item && item.local);
	});

	return output;
}

export function getColumnTarget(column, record) {
	const safeRecord = record || {};

	if (column.kind === 'chars') {
		const raw = (safeRecord[column.sourceField] || '').toString();
		return raw.padEnd(column.padEnd || raw.length, ' ');
	}

	if (column.kind === 'time') {
		return (safeRecord[column.sourceField] || '').toString();
	}

	if (column.kind === 'word') {
		if (column.keepTypeColors && safeRecord.type) {
			return {
				local: safeRecord.type.local,
				en: safeRecord.type.en,
				color: safeRecord.type_color_hex,
				textColor: safeRecord.type_text_color
			};
		}
		return safeRecord[column.sourceField] || null;
	}

	return null;
}
