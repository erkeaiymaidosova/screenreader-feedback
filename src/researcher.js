import { el } from './dom.js';
import { downloadText } from './export.js';
import { EVENT_COLUMNS, SUMMARY_COLUMNS, summarize, toCsv } from './logger.js';
import { researcherUi as ui, taskTitles } from './messages.js';
import { ORDERS, getOrderIdForParticipant, normalizeParticipantId } from './order.js';
import { buildBlocks } from './tasks.js';

const STORAGE_KEY = 'srf-researcher';
const app = document.getElementById('app');

// Одна строка CSV — один ответ (длинный формат): так в одном файле помещаются ответы всех уровней
export const ANSWER_COLUMNS = [
  'participantId', 'orderId', 'level', 'block', 'condition', 'exploratory',
  'taskId', 'action', 'plannedOutcome', 'measure', 'value', 'updatedAt',
];

const SCALE = ['1', '2', '3', '4', '5'].map((value) => ({ value, label: value }));
const WHAT_HAPPENED = [
  { value: 'success', label: ui.answerSuccess },
  { value: 'failure', label: ui.answerFailure },
  { value: 'unsure', label: ui.answerUnsure },
];

// Ответы всех участников: { P1: { participantId, orderId, includeVibration, updatedAt, answers: {...} } }
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

const records = load();
let storageAvailable = true;

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}
save();

function bom(text) {
  // Знак BOM нужен, чтобы Excel правильно показал русские буквы
  return '﻿' + text;
}

function fileStamp() {
  return new Date().toISOString().slice(0, 19).replaceAll(':', '-');
}

function button(label, onClick) {
  const element = el('button', { type: 'button' }, label);
  element.addEventListener('click', onClick);
  return element;
}

// Все ответы участника в виде строк CSV, включая пустые: так видно, что пропущено
export function answerRows(record) {
  const blocks = buildBlocks(record.orderId, record.includeVibration);
  const value = (key) => record.answers[key] ?? '';
  const base = { participantId: record.participantId, orderId: record.orderId, updatedAt: record.updatedAt };
  const rows = [];

  for (const block of blocks) {
    const blockBase = { ...base, block: block.number, condition: block.condition, exploratory: block.exploratory };
    for (const task of block.tasks) {
      for (const measure of ['whatHappened', 'confidence']) {
        rows.push({
          ...blockBase,
          level: 'task',
          taskId: task.id,
          action: task.action,
          plannedOutcome: task.plannedOutcome,
          measure,
          value: value(`task:${task.id}:${measure}`),
        });
      }
    }
    for (const measure of ['clarity', 'intrusiveness']) {
      rows.push({ ...blockBase, level: 'block', measure, value: value(`block:${block.number}:${measure}`) });
    }
  }

  for (const block of blocks) {
    rows.push({
      ...base,
      level: 'session',
      block: block.number,
      condition: block.condition,
      exploratory: block.exploratory,
      measure: 'rank',
      value: value(`rank:${block.number}`),
    });
  }
  rows.push({ ...base, level: 'session', measure: 'notes', value: value('notes') });
  return rows;
}

function showStart() {
  const idInput = el('input', { id: 'participant-id', type: 'text', autocomplete: 'off' });
  const idError = el('p', { id: 'participant-id-error', class: 'field-message' });

  const orderSelect = el('select', { id: 'order' }, el('option', { value: 'auto' }, ui.orderAuto));
  for (const [orderId, conditions] of Object.entries(ORDERS)) {
    orderSelect.append(el('option', { value: orderId }, `${orderId}: ${conditions.join(', ')}`));
  }
  const vibrationInput = el('input', { id: 'include-vibration', type: 'checkbox' });

  const form = el(
    'form',
    { novalidate: '' },
    el('label', { for: 'participant-id' }, ui.participantId),
    idInput,
    idError,
    el('label', { for: 'order' }, ui.orderLabel),
    orderSelect,
    el('label', { class: 'checkbox-label', for: 'include-vibration' }, vibrationInput, ui.includeVibration),
    el('button', { type: 'submit' }, ui.open),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const participantId = normalizeParticipantId(idInput.value);
    if (!participantId) {
      idError.textContent = ui.participantIdError;
      idInput.setAttribute('aria-invalid', 'true');
      idInput.setAttribute('aria-describedby', idError.id);
      idInput.focus();
      return;
    }

    // Если участник уже есть, открываем его сохранённые ответы
    if (!records[participantId]) {
      records[participantId] = {
        participantId,
        orderId: orderSelect.value === 'auto' ? getOrderIdForParticipant(participantId) : orderSelect.value,
        includeVibration: vibrationInput.checked,
        updatedAt: new Date().toISOString(),
        answers: {},
      };
      save();
    }
    showSheet(records[participantId]);
  });

  const saved = Object.keys(records);
  app.replaceChildren(
    el('h1', {}, ui.title),
    el('p', {}, ui.intro),
    ...(storageAvailable ? [] : [el('p', { class: 'field-message' }, ui.storageUnavailable)]),
    form,
    ...(saved.length ? [el('p', {}, ui.savedParticipants(saved.join(', ')))] : []),
    exportSection(),
    importSection(),
  );
}

function showSheet(record) {
  const saveNote = el('p', { class: 'save-note' });

  function setAnswer(key, value) {
    record.answers[key] = value;
    record.updatedAt = new Date().toISOString();
    save();
    saveNote.textContent = storageAvailable
      ? ui.saved(new Date().toLocaleTimeString('ru-RU'))
      : ui.storageUnavailable;
  }

  // Группа переключателей с подписью: скринридер читает вопрос вместе с вариантом
  function choiceGroup(key, legend, options) {
    const name = key.replaceAll(':', '-');
    const row = el('div', { class: 'choice-row' });
    options.forEach((option, index) => {
      const id = `${name}-${index}`;
      const input = el('input', { type: 'radio', id, name, value: option.value });
      input.checked = record.answers[key] === option.value;
      input.addEventListener('change', () => setAnswer(key, option.value));
      row.append(el('label', { class: 'choice', for: id }, input, option.label));
    });
    return el('fieldset', { class: 'choice-group' }, el('legend', {}, legend), row);
  }

  const blocks = buildBlocks(record.orderId, record.includeVibration);
  const sections = blocks.map((block) => {
    const tasks = block.tasks.map((task, index) =>
      el(
        'div',
        { class: 'card' },
        el('h3', {}, ui.taskHeading(index + 1, taskTitles[task.action](task.subject))),
        el('p', {}, ui.planned(task.plannedOutcome)),
        choiceGroup(`task:${task.id}:whatHappened`, ui.whatHappened, WHAT_HAPPENED),
        choiceGroup(`task:${task.id}:confidence`, ui.confidence, SCALE),
      ),
    );

    return el(
      'section',
      {},
      el('h2', {}, ui.blockHeading(block.number, block.condition, block.exploratory)),
      ...tasks,
      el(
        'div',
        { class: 'card' },
        el('h3', {}, ui.afterBlock),
        choiceGroup(`block:${block.number}:clarity`, ui.clarity, SCALE),
        choiceGroup(`block:${block.number}:intrusiveness`, ui.intrusiveness, SCALE),
      ),
    );
  });

  // Ранжирование: участник не знает названий условий, поэтому места даются блокам
  const rankWarning = el('p', { class: 'field-message' });
  const rankSelects = blocks.map((block) => {
    const id = `rank-${block.number}`;
    const select = el('select', { id }, el('option', { value: '' }, '—'));
    blocks.forEach((_, index) => select.append(el('option', { value: String(index + 1) }, String(index + 1))));
    select.value = record.answers[`rank:${block.number}`] ?? '';
    select.addEventListener('change', () => {
      setAnswer(`rank:${block.number}`, select.value);
      checkRanks();
    });
    return { select, label: el('label', { for: id }, ui.rankingLabel(block.number, block.condition)) };
  });

  function checkRanks() {
    const chosen = rankSelects.map(({ select }) => select.value).filter(Boolean);
    rankWarning.textContent = new Set(chosen).size === chosen.length ? '' : ui.rankingDuplicate;
  }
  checkRanks();

  const notes = el('textarea', { id: 'notes', rows: '5' });
  notes.value = record.answers.notes ?? '';
  notes.addEventListener('input', () => setAnswer('notes', notes.value));

  app.replaceChildren(
    el('h1', {}, `${ui.title}: ${record.participantId}`),
    el('p', {}, ui.orderInfo(record.orderId, ORDERS[record.orderId].join(', '))),
    button(ui.back, showStart),
    ...sections,
    el(
      'section',
      {},
      el('h2', {}, ui.finalHeading),
      el(
        'fieldset',
        { class: 'choice-group' },
        el('legend', {}, ui.rankingLegend),
        ...rankSelects.flatMap(({ label, select }) => [label, select]),
        rankWarning,
      ),
      el('label', { for: 'notes' }, ui.notes),
      notes,
    ),
    saveNote,
    exportSection(),
  );
  app.querySelector('h1').setAttribute('tabindex', '-1');
  app.querySelector('h1').focus();
}

function exportSection() {
  return el(
    'section',
    { class: 'export-panel' },
    el('h2', {}, ui.exportHeading),
    el(
      'div',
      { class: 'button-stack' },
      button(ui.downloadAnswers, () => {
        const rows = Object.values(records).flatMap(answerRows);
        downloadText(`srf-answers-${fileStamp()}.csv`, bom(toCsv(rows, ANSWER_COLUMNS)), 'text/csv');
      }),
      button(ui.deleteAnswers, () => {
        if (window.confirm(ui.confirmDelete)) {
          for (const key of Object.keys(records)) delete records[key];
          save();
          showStart();
        }
      }),
    ),
  );
}

// Перевод JSON с телефона в CSV на ноутбуке, где скачивание работает надёжно
function importSection() {
  const area = el('textarea', { id: 'import-json', rows: '6' });
  const note = el('p', { class: 'export-note' });

  function readEvents() {
    try {
      const data = JSON.parse(area.value);
      note.textContent = ui.importDone(data.sessions.length);
      return data.sessions.flatMap((session) => session.events);
    } catch {
      note.textContent = ui.importError;
      return null;
    }
  }

  return el(
    'section',
    { class: 'export-panel' },
    el('h2', {}, ui.importHeading),
    el('p', {}, ui.importHelp),
    el('label', { for: 'import-json' }, ui.importLabel),
    area,
    el(
      'div',
      { class: 'button-stack' },
      button(ui.importEvents, () => {
        const events = readEvents();
        if (events) downloadText(`srf-phone-${fileStamp()}-events.csv`, bom(toCsv(events, EVENT_COLUMNS)), 'text/csv');
      }),
      button(ui.importSummary, () => {
        const events = readEvents();
        if (events) {
          downloadText(`srf-phone-${fileStamp()}-summary.csv`, bom(toCsv(summarize(events), SUMMARY_COLUMNS)), 'text/csv');
        }
      }),
    ),
    note,
  );
}

showStart();
