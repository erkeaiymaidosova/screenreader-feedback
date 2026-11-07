import { summarize } from './logger.js';

// Объединённая таблица: одна строка — одно задание участника
export const MERGED_COLUMNS = [
  'participantId', 'orderId', 'orderCheck', 'sessionId', 'appVersion', 'block', 'condition', 'exploratory',
  'taskId', 'action', 'plannedOutcome', 'finalOutcome', 'participantAnswer', 'correct', 'confidence',
  'clarity', 'intrusiveness', 'rank', 'targetPresses', 'repeatPresses', 'otherPresses',
  'firstPressToNextMs', 'completed', 'runs',
];

// events — журнал с телефона, records — ответы со страницы исследователя
export function mergeResults(events, records) {
  const byTask = new Map();
  for (const run of summarize(events)) {
    if (run.practice) continue;
    const key = `${run.participantId}#${run.taskId}`;
    if (!byTask.has(key)) byTask.set(key, []);
    byTask.get(key).push(run);
  }

  return [...byTask.values()].map((runs) => {
    // Если задание показывалось несколько раз (после перезагрузки), берём последний завершённый показ
    const completed = runs.filter((run) => run.completed);
    const run = (completed.length ? completed : runs).at(-1);

    const record = records[run.participantId];
    const answers = record?.answers ?? {};
    const answer = answers[`task:${run.taskId}:whatHappened`] ?? '';

    return {
      ...run,
      // Порядок на ноутбуке должен совпадать с порядком на телефоне
      orderCheck: record ? (record.orderId === run.orderId ? 'ok' : 'mismatch') : '',
      participantAnswer: answer,
      // Совпал ли ответ участника с тем, что случилось. «Не уверен» считается несовпадением
      correct: answer === '' || run.finalOutcome === null ? '' : answer === run.finalOutcome,
      confidence: answers[`task:${run.taskId}:confidence`] ?? '',
      clarity: answers[`block:${run.block}:clarity`] ?? '',
      intrusiveness: answers[`block:${run.block}:intrusiveness`] ?? '',
      rank: answers[`rank:${run.block}`] ?? '',
      runs: runs.length,
    };
  });
}
