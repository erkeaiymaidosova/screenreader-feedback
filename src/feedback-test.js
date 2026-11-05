import { createFeedback, isVibrationSupported } from './feedback.js';
import { messages } from './messages.js';

const feedback = createFeedback(document.getElementById('status'));
const audioState = document.getElementById('audio-state');
const lastCall = document.getElementById('last-call');
let callCount = 0;

const testMessages = {
  success: messages.favoriteAdded('Плов'),
  failure: messages.reviewNameMissing,
};

document.getElementById('vibration-state').textContent = isVibrationSupported()
  ? 'Вибрация: браузер поддерживает'
  : 'Вибрация: браузер не поддерживает';

document.getElementById('init-audio').addEventListener('click', () => {
  audioState.textContent = feedback.initAudio() ? 'Звук включён' : 'Браузер не поддерживает Web Audio';
});

for (const button of document.querySelectorAll('[data-condition]')) {
  button.addEventListener('click', () => {
    const { condition, outcome } = button.dataset;
    feedback.give({ condition, outcome, message: testMessages[outcome] });
    callCount += 1;
    lastCall.textContent = `${callCount}: ${button.textContent}`;
  });
}
