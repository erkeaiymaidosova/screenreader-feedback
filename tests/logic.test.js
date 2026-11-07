// Автоматические проверки логики. Запуск из папки проекта: node --test "tests/*.test.js"
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeResults } from '../src/analysis.js';
import { summarize, toCsv } from '../src/logger.js';
import { ORDERS, getOrderIdForParticipant, normalizeParticipantId } from '../src/order.js';
import { TASK_SETS, buildBlocks } from '../src/tasks.js';

const CONDITIONS = ['C0', 'C1', 'C2', 'C3'];

test('латинский квадрат: каждое условие один раз в каждом порядке и на каждой позиции', () => {
  const orders = Object.values(ORDERS);
  for (const order of orders) assert.deepEqual([...order].sort(), CONDITIONS);
  for (let position = 0; position < 4; position++) {
    assert.deepEqual(orders.map((order) => order[position]).sort(), CONDITIONS);
  }
});

test('латинский квадрат: каждое условие идёт за каждым другим ровно один раз', () => {
  const pairs = Object.values(ORDERS).flatMap((order) => order.slice(1).map((c, i) => order[i] + c));
  assert.equal(pairs.length, 12);
  assert.equal(new Set(pairs).size, 12);
});

test('ID участника и выбор порядка', () => {
  assert.equal(normalizeParticipantId(' p10 '), 'P10');
  for (const bad of ['P0', 'P11', 'P1a', 'Айым', '']) assert.equal(normalizeParticipantId(bad), null);
  assert.deepEqual(
    ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'].map(getOrderIdForParticipant),
    ['O1', 'O2', 'O3', 'O4', 'O1', 'O2', 'O3', 'O4', 'O1', 'O2'],
  );
});

test('наборы заданий: в каждом все 4 действия и ровно одна неудача на разных действиях и позициях', () => {
  const failures = TASK_SETS.map((set) => {
    assert.deepEqual(set.map((t) => t.action).sort(), ['favorite', 'review', 'setting', 'shopping']);
    const failed = set.filter((t) => t.plannedOutcome === 'failure');
    assert.equal(failed.length, 1);
    return { action: failed[0].action, position: set.indexOf(failed[0]) };
  });
  assert.equal(new Set(failures.map((f) => f.action)).size, 4);
  assert.equal(new Set(failures.map((f) => f.position)).size, 4);
});

test('блоки: набор привязан к позиции блока, условие — к порядку', () => {
  const blocks = buildBlocks('O3');
  assert.deepEqual(blocks.map((b) => b.condition), ORDERS.O3);
  blocks.forEach((block, index) => assert.equal(block.tasks, TASK_SETS[index]));
  assert.equal(buildBlocks('O3', true).at(-1).condition, 'C4');
});

// Короткий журнал для проверок подсчёта
function event(seq, eventType, perfMs, extra = {}) {
  return {
    seq, sessionId: 'S', participantId: 'P1', orderId: 'O1', eventType, perfMs,
    practice: false, block: 1, condition: 'C0', taskRun: 1, taskId: 't1', plannedOutcome: 'failure',
    actualOutcome: null, ...extra,
  };
}

test('итоги: повторные нажатия и время от первого нажатия до перехода', () => {
  const events = [
    event(1, 'task_shown', 100),
    event(2, 'other_press', 150),
    event(3, 'target_press', 200, { actualOutcome: 'failure' }),
    event(4, 'target_press', 300, { actualOutcome: 'failure' }),
    event(5, 'target_press', 400, { actualOutcome: 'failure' }),
    event(6, 'next_task', 1200),
  ];
  const [row] = summarize(events);
  assert.equal(row.targetPresses, 3);
  assert.equal(row.repeatPresses, 2);
  assert.equal(row.otherPresses, 1);
  assert.equal(row.firstPressToNextMs, 1000);
  assert.equal(row.completed, true);
});

test('итоги: без нажатий время пустое, прерванный показ не завершён', () => {
  const [noPress, interrupted] = summarize([
    event(1, 'task_shown', 0),
    event(2, 'next_task', 500),
    event(3, 'task_shown', 600, { taskRun: 2 }),
  ]);
  assert.equal(noPress.repeatPresses, 0);
  assert.equal(noPress.firstPressToNextMs, null);
  assert.equal(interrupted.completed, false);
});

test('CSV: пустые значения, запятые, кавычки и переносы строк', () => {
  const csv = toCsv(
    [{ a: null, b: 'x,y', c: 'он сказал "да"', d: 'две\nстроки' }],
    ['a', 'b', 'c', 'd'],
  );
  assert.equal(csv, 'a,b,c,d\r\n,"x,y","он сказал ""да""","две\nстроки"');
});

test('объединённая таблица: ответ участника сравнивается с фактическим исходом', () => {
  const events = [
    event(1, 'task_shown', 0),
    event(2, 'target_press', 100, { actualOutcome: 'failure' }),
    event(3, 'next_task', 900),
  ];
  const records = { P1: { orderId: 'O1', answers: { 'task:t1:whatHappened': 'success', 'task:t1:confidence': '4' } } };
  const [row] = mergeResults(events, records);
  assert.equal(row.correct, false);
  assert.equal(row.confidence, '4');
  assert.equal(row.orderCheck, 'ok');

  records.P1.answers['task:t1:whatHappened'] = 'failure';
  assert.equal(mergeResults(events, records)[0].correct, true);
  assert.equal(mergeResults(events, { P1: { orderId: 'O2', answers: {} } })[0].orderCheck, 'mismatch');
});

test('объединённая таблица: после перезагрузки берётся последний завершённый показ', () => {
  const rows = mergeResults(
    [
      event(1, 'task_shown', 0),
      event(2, 'target_press', 50, { actualOutcome: 'failure' }),
      event(3, 'task_shown', 10, { taskRun: 2 }),
      event(4, 'target_press', 20, { taskRun: 2, actualOutcome: 'failure' }),
      event(5, 'next_task', 520, { taskRun: 2 }),
    ],
    {},
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].taskRun, 2);
  assert.equal(rows[0].runs, 2);
  assert.equal(rows[0].firstPressToNextMs, 500);
});
