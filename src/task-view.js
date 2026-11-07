import { el } from './dom.js';
import { messages, ui } from './messages.js';

// Определяет исход нажатия. Запланированный исход задан в данных задания
function getResult(task, state, nameValue) {
  const { action, subject, plannedOutcome } = task;
  const failed = plannedOutcome === 'failure';

  switch (action) {
    case 'favorite':
      if (failed) return { outcome: 'failure', message: messages.favoriteLimit(subject) };
      // Настоящий переключатель: повторное нажатие убирает рецепт из избранного
      state.isFavorite = !state.isFavorite;
      return {
        outcome: 'success',
        message: state.isFavorite ? messages.favoriteAdded(subject) : messages.favoriteRemoved(subject),
      };
    case 'shopping':
      return failed
        ? { outcome: 'failure', message: messages.shoppingFull(subject) }
        : { outcome: 'success', message: messages.shoppingAdded(subject) };
    case 'setting':
      return failed
        ? { outcome: 'failure', message: messages.settingNotSaved(subject) }
        : { outcome: 'success', message: messages.settingSaved(subject) };
    case 'review':
      // Проверяем поле по-настоящему: сообщение не должно расходиться с тем, что ввёл участник
      return nameValue.trim() === ''
        ? { outcome: 'failure', message: messages.reviewNameMissing }
        : { outcome: 'success', message: messages.reviewSent(subject) };
    default:
      throw new Error(`Неизвестное действие: ${action}`);
  }
}

function button(label) {
  return el('button', { type: 'button' }, label);
}

export function renderTask({ task, title, condition, feedback, onEvent, onNext }) {
  const state = { isFavorite: false };
  const heading = el('h1', {}, title);

  // Видимый результат скрыт от скринридера во всех условиях: иначе его можно
  // найти свайпом, и C0 перестанет быть условием без обратной связи
  const visualState = el('p', { class: 'visual-state', 'aria-hidden': 'true' });

  let nameInput = null;

  function pressTarget() {
    const result = getResult(task, state, nameInput ? nameInput.value : '');
    visualState.textContent = `${result.outcome === 'success' ? '✓' : '✕'} ${result.message}`;
    visualState.dataset.outcome = result.outcome;
    // Подсветка только визуальная: aria-invalid объявил бы ошибку и в C0
    if (nameInput) nameInput.classList.toggle('field-error', result.outcome === 'failure');
    // Состояние звука до вызова обратной связи: видно, мог ли earcon вообще прозвучать
    onEvent('target_press', { actualOutcome: result.outcome, audioState: feedback.getAudioState() });
    feedback.give({ condition, outcome: result.outcome, message: result.message });
  }

  function otherButton(label) {
    const other = button(label);
    other.addEventListener('click', () => onEvent('other_press', { element: label }));
    return other;
  }

  let content;
  if (task.action === 'review') {
    // Имя заполнено заранее, если задание должно закончиться успехом
    nameInput = el('input', { id: 'review-name', type: 'text', autocomplete: 'off' });
    if (task.plannedOutcome === 'success') nameInput.value = 'Гость';
    const reviewInput = el('textarea', { id: 'review-text', rows: '3' });
    const submit = el('button', { type: 'submit' }, ui.sendReview);

    // novalidate: всплывающая подсказка браузера стала бы лишней обратной связью
    const form = el(
      'form',
      { novalidate: '' },
      el('label', { for: 'review-name' }, ui.nameLabel),
      nameInput,
      el('label', { for: 'review-text' }, ui.reviewLabel),
      reviewInput,
      submit,
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      pressTarget();
    });
    content = [el('h2', {}, task.subject), form, visualState, otherButton(ui.share)];
  } else {
    // Обычная кнопка, а не флажок: флажок сам объявил бы своё состояние и в C0
    const labels = {
      favorite: ui.addToFavorites,
      shopping: ui.addToShopping,
      setting: ui.enableSetting(task.subject),
    };
    const target = button(labels[task.action]);
    target.addEventListener('click', pressTarget);

    const isSetting = task.action === 'setting';
    content = [
      el('h2', {}, isSetting ? ui.settingsTitle : task.subject),
      ...(isSetting ? [] : [el('p', {}, ui.recipeCaption)]),
      el('div', { class: 'button-row' }, target, otherButton(isSetting ? ui.resetSettings : ui.share)),
      visualState,
    ];
  }

  const next = button(ui.nextTask);
  next.classList.add('next-button');
  next.addEventListener('click', onNext);

  return el('div', {}, heading, el('section', { class: 'card' }, ...content), next);
}
