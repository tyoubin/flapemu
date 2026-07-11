// train-pipeline.js was removed — all its functions have direct alternatives:
//
//   prepareTrainBoardData(raw, tracks)  →  prepareBoardData(raw)
//   applyTrackFilter(data, tracks)      →  data.filter(r => tracks.includes(r.track_no))
//   sortScheduleByDepartTime(data)      →  sortByField(data, 'depart_time')
//   selectDisplayTrains(data, n, now)   →  selectDisplayRows(data, n, { strategy: 'nextByTime', timeField: 'depart_time' }, now)
//   extractScheduleWords(rows, field)   →  extractFieldWords(rows, field)
//
// All generic functions are in board-pipeline.js (sortByField, selectDisplayRows,
// extractFieldWords, prepareBoardData). Consumers own domain logic before JSON creation.

console.log('train-pipeline.js removed — consumer uses board-pipeline.js directly');
