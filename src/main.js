import { el } from './dom.js';
import { createFeedback, isVibrationSupported } from './feedback.js';
import { taskTitles, ui } from './messages.js';
import { ORDERS, getOrderIdForParticipant, normalizeParticipantId } from './order.js';
import { renderTask } from './task-view.js';
import { PRACTICE_CONDITION, PRACTICE_TASK, buildBlocks } from './tasks.js';

const screen = document.getElementById('screen');
const feedback = createFeedback(document.getElementById('status'));

// Запись событий появится на Этапе 4
function recordEvent() {}

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
    showIntro(buildBlocks(orderId, vibrationInput.checked));
  });

  show(el('div', {}, el('h1', {}, ui.setupTitle), form));
}

function showIntro(blocks) {
  show(
    el(
      'div',
      {},
      el('h1', {}, ui.introTitle),
      el('p', {}, ui.introText),
      el(
        'div',
        { class: 'button-row' },
        textButton(ui.playSuccess, () => feedback.playEarcon('success')),
        textButton(ui.playFailure, () => feedback.playEarcon('failure')),
      ),
      textButton(ui.toPractice, () => showPractice(blocks)),
    ),
  );
}

function showPractice(blocks) {
  show(
    renderTask({
      task: PRACTICE_TASK,
      title: ui.practiceTitle(taskTitles[PRACTICE_TASK.action](PRACTICE_TASK.subject)),
      condition: PRACTICE_CONDITION,
      feedback,
      onEvent: recordEvent,
      onNext: () => showTask(blocks, 0, 0),
    }),
  );
}

function showTask(blocks, blockIndex, taskIndex) {
  const block = blocks[blockIndex];
  const task = block.tasks[taskIndex];
  const isLastTask = taskIndex === block.tasks.length - 1;

  show(
    renderTask({
      task,
      title: ui.taskTitle(taskIndex + 1, block.tasks.length, taskTitles[task.action](task.subject)),
      condition: block.condition,
      feedback,
      onEvent: recordEvent,
      onNext: () => (isLastTask ? showBlockDone(blocks, blockIndex) : showTask(blocks, blockIndex, taskIndex + 1)),
    }),
  );
}

function showBlockDone(blocks, blockIndex) {
  const isLastBlock = blockIndex === blocks.length - 1;

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
  show(el('div', {}, el('h1', {}, ui.finishTitle), el('p', {}, ui.finishText)));
}

showSetup();
