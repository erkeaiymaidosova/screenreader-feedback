import { el } from './dom.js';
import { copyText, downloadText } from './export.js';
import { createFeedback, isVibrationSupported } from './feedback.js';
import { EVENT_COLUMNS, SUMMARY_COLUMNS, createLogger, summarize, toCsv } from './logger.js';
import { taskTitles, ui } from './messages.js';
import { ORDERS, getOrderIdForParticipant, normalizeParticipantId } from './order.js';
import { renderTask } from './task-view.js';
import { PRACTICE_CONDITION, PRACTICE_TASK, buildBlocks } from './tasks.js';
import { APP_VERSION } from './version.js';

// Пауза перед звуком на экране знакомства: VoiceOver успевает прочитать название кнопки.
// Касается только знакомства, в заданиях звук звучит сразу
const PREVIEW_DELAY_MS = 2000;

const screen = document.getElementById('screen');
const feedback = createFeedback(document.getElementById('status'));
const logger = createLogger();

let session = null;
// Где сейчас участник: эти поля добавляются к каждому событию
let context = {};

function recordEvent(eventType, details = {}) {
  if (session) logger.log(session, eventType, { ...context, ...details });
}

// Смена экрана. Фокус переносится только здесь, на заголовок нового экрана:
// после нажатия на обычные кнопки заданий он остаётся на месте
function show(content) {
  feedback.reset();
  screen.replaceChildren(content);
  const heading = screen.querySelector('h1');
  heading.setAttribute('tabindex', '-1');
  heading.focus();
}

function textButton(label, onClick) {
  const button = el('button', { type: 'button' }, label);
  button.addEventListener('click', onClick);
  return button;
}

function fileStamp() {
  return new Date().toISOString().slice(0, 19).replaceAll(':', '-');
}

// Кнопки экспорта. getSessions решает, какие сессии выгружать
function exportPanel(getSessions, fileName) {
  const note = el('p', { class: 'export-note' });

  function events() {
    return getSessions().flatMap((saved) => saved.events);
  }

  function json() {
    const sessions = getSessions().map((saved) => ({ ...saved, summary: summarize(saved.events) }));
    return JSON.stringify({ exportedAt: new Date().toISOString(), sessions }, null, 2);
  }

  // Знак BOM в начале нужен, чтобы Excel правильно показал русские буквы
  const bom = '﻿';

  // Браузер не сообщает, сохранился ли файл, поэтому показываем, где его искать
  function download(name, text, type) {
    downloadText(name, text, type);
    note.textContent = ui.downloadStarted(name);
  }

  // Запасной путь, который работает везде: текст на экране, его можно выделить и скопировать вручную
  const dataArea = el('textarea', { id: 'export-data', readonly: '', rows: '8' });
  const dataBlock = el('div', { hidden: '' }, el('label', { for: 'export-data' }, ui.dataLabel), dataArea);

  return el(
    'section',
    { class: 'export-panel' },
    el('h2', {}, ui.exportTitle),
    el(
      'div',
      { class: 'button-stack' },
      textButton(ui.downloadJson, () => download(`${fileName()}.json`, json(), 'application/json')),
      textButton(ui.downloadEventsCsv, () =>
        download(`${fileName()}-events.csv`, bom + toCsv(events(), EVENT_COLUMNS), 'text/csv'),
      ),
      textButton(ui.downloadSummaryCsv, () =>
        download(`${fileName()}-summary.csv`, bom + toCsv(summarize(events()), SUMMARY_COLUMNS), 'text/csv'),
      ),
      textButton(ui.copyJson, async () => {
        note.textContent = (await copyText(json())) ? ui.copied : ui.copyFailed;
      }),
      textButton(ui.showData, () => {
        dataArea.value = json();
        dataBlock.hidden = false;
        dataArea.focus();
        dataArea.select();
      }),
    ),
    note,
    dataBlock,
  );
}

function describeProgress(progress) {
  if (progress?.screen === 'task') return ui.progressTask(progress.blockIndex + 1, progress.taskIndex + 1);
  if (progress?.screen === 'pause') return ui.progressPause(progress.blockIndex + 1);
  return ui.progressIntro;
}

function showSetup() {
  const idInput = el('input', { id: 'participant-id', type: 'text', autocomplete: 'off', autocapitalize: 'characters' });
  const idError = el('p', { id: 'participant-id-error', class: 'field-message' });

  const orderSelect = el('select', { id: 'order' }, el('option', { value: 'auto' }, ui.orderAuto));
  for (const [orderId, conditions] of Object.entries(ORDERS)) {
    orderSelect.append(el('option', { value: orderId }, `${orderId}: ${conditions.join(', ')}`));
  }

  const vibrationSupported = isVibrationSupported();
  const vibrationInput = el('input', { id: 'include-vibration', type: 'checkbox' });
  vibrationInput.disabled = !vibrationSupported;

  const audioError = el('p', { class: 'field-message' });

  const form = el(
    'form',
    { novalidate: '' },
    el('label', { for: 'participant-id' }, ui.participantId),
    idInput,
    idError,
    el('label', { for: 'order' }, ui.orderLabel),
    orderSelect,
    el('label', { class: 'checkbox-label', for: 'include-vibration' }, vibrationInput, ui.includeVibration),
    ...(vibrationSupported ? [] : [el('p', {}, ui.vibrationUnsupported)]),
    el('button', { type: 'submit' }, ui.start),
    audioError,
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const participantId = normalizeParticipantId(idInput.value);
    if (!participantId) {
      // Это обычная ошибка формы для исследователя: она связана с полем и доступна скринридеру
      idError.textContent = ui.participantIdError;
      idInput.setAttribute('aria-invalid', 'true');
      idInput.setAttribute('aria-describedby', idError.id);
      idInput.focus();
      return;
    }

    // Звук разрешён только после жеста, поэтому запускаем его по нажатию «Начать»
    if (!feedback.initAudio()) {
      audioError.textContent = ui.audioUnsupported;
      return;
    }

    const orderId = orderSelect.value === 'auto' ? getOrderIdForParticipant(participantId) : orderSelect.value;
    session = logger.start({ participantId, orderId, includeVibration: vibrationInput.checked });
    context = {};
    recordEvent('session_start');
    showIntro(buildBlocks(orderId, session.includeVibration));
  });

  const parts = [el('h1', {}, ui.setupTitle), el('p', {}, ui.version(APP_VERSION))];
  if (!logger.isStorageAvailable()) parts.push(el('p', { class: 'field-message' }, ui.storageUnavailable));

  // Незавершённая сессия: например, страницу случайно перезагрузили
  const unfinished = logger.findUnfinished();
  if (unfinished) {
    parts.push(
      el('p', {}, ui.stoppedAt(describeProgress(unfinished.progress))),
      textButton(ui.resumeSession(unfinished.participantId), () => {
        if (!feedback.initAudio()) {
          audioError.textContent = ui.audioUnsupported;
          return;
        }
        resumeSession(unfinished);
      }),
    );
  }

  parts.push(form);

  const sessions = logger.getSessions();
  if (sessions.length > 0) {
    parts.push(
      el('p', {}, ui.savedSessions(sessions.length)),
      exportPanel(logger.getSessions, () => `srf-all-${fileStamp()}`),
      textButton(ui.deleteData, () => {
        if (window.confirm(ui.confirmDelete)) {
          logger.clearAll();
          showSetup();
        }
      }),
    );
  }

  show(el('div', {}, ...parts));
}

function resumeSession(saved) {
  session = saved;
  logger.resume(session);
  context = {};
  recordEvent('session_resumed');

  const blocks = buildBlocks(session.orderId, session.includeVibration);
  const progress = session.progress;
  if (progress?.screen === 'task') showTask(blocks, progress.blockIndex, progress.taskIndex);
  else if (progress?.screen === 'pause') showBlockDone(blocks, progress.blockIndex);
  else showIntro(blocks);
}

function showIntro(blocks) {
  logger.setProgress(session, { screen: 'intro' });
  context = { practice: true };

  function preview(outcome, label) {
    return textButton(label, () => {
      recordEvent('earcon_preview', { element: label, audioState: feedback.getAudioState() });
      setTimeout(() => feedback.playEarcon(outcome), PREVIEW_DELAY_MS);
    });
  }

  show(
    el(
      'div',
      {},
      el('h1', {}, ui.introTitle),
      el('p', {}, ui.introText),
      el('div', { class: 'button-row' }, preview('success', ui.playSuccess), preview('failure', ui.playFailure)),
      textButton(ui.toPractice, () => showPractice(blocks)),
    ),
  );
}

// Общий запуск задания: контекст для журнала, экран, событие показа
function startTask({ task, title, condition, blockContext, onDone }) {
  context = {
    ...blockContext,
    condition,
    taskRun: logger.nextTaskRun(session),
    taskId: task.id,
    action: task.action,
    plannedOutcome: task.plannedOutcome,
  };

  show(
    renderTask({
      task,
      title,
      condition,
      feedback,
      onEvent: recordEvent,
      onNext: () => {
        recordEvent('next_task');
        onDone();
      },
    }),
  );
  recordEvent('task_shown');
}

function showPractice(blocks) {
  logger.setProgress(session, { screen: 'practice' });
  startTask({
    task: PRACTICE_TASK,
    title: ui.practiceTitle(taskTitles[PRACTICE_TASK.action](PRACTICE_TASK.subject)),
    condition: PRACTICE_CONDITION,
    blockContext: { practice: true, exploratory: false, block: null },
    onDone: () => showTask(blocks, 0, 0),
  });
}

function showTask(blocks, blockIndex, taskIndex) {
  const block = blocks[blockIndex];
  const task = block.tasks[taskIndex];
  const isLastTask = taskIndex === block.tasks.length - 1;

  logger.setProgress(session, { screen: 'task', blockIndex, taskIndex });
  startTask({
    task,
    title: ui.taskTitle(taskIndex + 1, block.tasks.length, taskTitles[task.action](task.subject)),
    condition: block.condition,
    blockContext: { practice: false, exploratory: block.exploratory, block: block.number },
    onDone: () => (isLastTask ? showBlockDone(blocks, blockIndex) : showTask(blocks, blockIndex, taskIndex + 1)),
  });
}

function showBlockDone(blocks, blockIndex) {
  const isLastBlock = blockIndex === blocks.length - 1;
  logger.setProgress(session, { screen: 'pause', blockIndex });
  context = {};

  show(
    el(
      'div',
      {},
      el('h1', {}, ui.blockDoneTitle(blockIndex + 1, blocks.length)),
      el('p', {}, ui.blockDoneText),
      textButton(ui.continue, () => (isLastBlock ? showFinish() : showTask(blocks, blockIndex + 1, 0))),
    ),
  );
}

function showFinish() {
  context = {};
  recordEvent('session_end');
  logger.setProgress(session, { screen: 'finish' });
  logger.finish(session);

  const finished = session;
  show(
    el(
      'div',
      {},
      el('h1', {}, ui.finishTitle),
      el('p', {}, ui.finishText),
      exportPanel(() => [finished], () => `srf-${finished.participantId}-${fileStamp()}`),
    ),
  );
}

showSetup();
