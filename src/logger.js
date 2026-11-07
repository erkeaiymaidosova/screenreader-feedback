const STORAGE_KEY = 'srf-sessions';

// Порядок столбцов в CSV событий
export const EVENT_COLUMNS = [
  'seq', 'sessionId', 'participantId', 'orderId', 'pageLoad', 'eventType',
  'practice', 'exploratory', 'block', 'condition', 'taskRun', 'taskId', 'action',
  'plannedOutcome', 'actualOutcome', 'element', 'audioState', 'perfMs', 'isoTime',
];

// Порядок столбцов в CSV итогов по заданиям
export const SUMMARY_COLUMNS = [
  'sessionId', 'participantId', 'orderId', 'practice', 'exploratory', 'block', 'condition',
  'taskRun', 'taskId', 'action', 'plannedOutcome', 'finalOutcome',
  'targetPresses', 'repeatPresses', 'otherPresses', 'firstPressToNextMs', 'completed',
];

// localStorage может быть недоступен, например в частном режиме: тогда журнал живёт только в памяти
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function createLogger() {
  const sessions = load();
  let storageAvailable = true;

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
  }
  save();

  function start({ participantId, orderId, includeVibration }) {
    // Незавершённые сессии остаются в журнале, но больше не предлагаются для продолжения
    for (const old of sessions) {
      if (!old.finished) old.abandoned = true;
    }
    const session = {
      sessionId: `${participantId}-${new Date().toISOString()}`,
      participantId,
      orderId,
      includeVibration,
      startedAt: new Date().toISOString(),
      finished: false,
      abandoned: false,
      progress: null,
      pageLoad: 1,
      taskRunCounter: 0,
      events: [],
    };
    sessions.push(session);
    save();
    return session;
  }

  // Продолжение после перезагрузки: performance.now() начинается заново, поэтому номер загрузки растёт
  function resume(session) {
    session.pageLoad += 1;
    save();
  }

  function log(session, eventType, details = {}) {
    session.events.push({
      seq: session.events.length + 1,
      sessionId: session.sessionId,
      participantId: session.participantId,
      orderId: session.orderId,
      pageLoad: session.pageLoad,
      eventType,
      practice: false,
      exploratory: false,
      block: null,
      condition: null,
      taskRun: null,
      taskId: null,
      action: null,
      plannedOutcome: null,
      actualOutcome: null,
      element: null,
      audioState: null,
      ...details,
      perfMs: Math.round(performance.now() * 10) / 10,
      isoTime: new Date().toISOString(),
    });
    save();
  }

  // Каждый показ задания получает свой номер, даже если задание показано повторно после перезагрузки
  function nextTaskRun(session) {
    session.taskRunCounter += 1;
    save();
    return session.taskRunCounter;
  }

  function setProgress(session, progress) {
    session.progress = progress;
    save();
  }

  function finish(session) {
    session.finished = true;
    save();
  }

  function clearAll() {
    sessions.length = 0;
    save();
  }

  return {
    isStorageAvailable: () => storageAvailable,
    getSessions: () => sessions,
    findUnfinished: () => [...sessions].reverse().find((session) => !session.finished && !session.abandoned),
    start,
    resume,
    log,
    nextTaskRun,
    setProgress,
    finish,
    clearAll,
  };
}

// Итоги по каждому показу задания
export function summarize(events) {
  const runs = new Map();

  for (const event of events) {
    if (event.taskRun === null) continue;
    const key = `${event.sessionId}#${event.taskRun}`;
    if (!runs.has(key)) {
      runs.set(key, {
        ...event,
        finalOutcome: null,
        targetPresses: 0,
        otherPresses: 0,
        firstPressMs: null,
        nextMs: null,
      });
    }
    const run = runs.get(key);

    if (event.eventType === 'target_press') {
      run.targetPresses += 1;
      run.finalOutcome = event.actualOutcome;
      if (run.firstPressMs === null) run.firstPressMs = event.perfMs;
    } else if (event.eventType === 'other_press') {
      run.otherPresses += 1;
    } else if (event.eventType === 'next_task') {
      run.nextMs = event.perfMs;
    }
  }

  return [...runs.values()].map((run) => ({
    ...run,
    // Повторные нажатия: все нажатия на целевой элемент после первого
    repeatPresses: Math.max(0, run.targetPresses - 1),
    firstPressToNextMs:
      run.firstPressMs !== null && run.nextMs !== null ? Math.round((run.nextMs - run.firstPressMs) * 10) / 10 : null,
    completed: run.nextMs !== null,
  }));
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  // Кавычки нужны, если в тексте есть запятая, кавычка или перенос строки
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows, columns) {
  const lines = [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))];
  return lines.join('\r\n');
}
