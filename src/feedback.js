// Пауза между очисткой области статуса и записью текста
const CLEAR_DELAY_MS = 100;
// Пауза между концом earcon и началом речи в C3
const EARCON_GAP_MS = 150;
// Сколько текст хранится в области: потом его нельзя найти свайпом, как и в C0 и C2
const MESSAGE_LIFETIME_MS = 5000;
const VOLUME = 0.4;

// Длительность earcon в секундах: каждая меньше 0,5 с
export const EARCON_DURATION = { success: 0.3, failure: 0.42 };

const VIBRATION_PATTERN = { success: [50], failure: [150, 80, 150] };

export function isVibrationSupported() {
  return typeof navigator.vibrate === 'function';
}

export function createFeedback(statusElement) {
  let audioContext = null;
  let pendingWrite = null;
  let pendingClear = null;

  // Браузер разрешает звук только после жеста: вызывать из обработчика нажатия
  function initAudio() {
    if (!audioContext) {
      if (!window.AudioContext) return false;
      audioContext = new AudioContext();
    }
    audioContext.resume();
    return true;
  }

  function playTone(type, startHz, endHz, startAt, duration, peak = VOLUME) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const endAt = startAt + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startHz, startAt);
    oscillator.frequency.linearRampToValueAtTime(endHz, endAt);

    // Плавное начало и конец убирают щелчки
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.01);
    gain.gain.setValueAtTime(peak, endAt - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt);
  }

  function playEarcon(outcome) {
    if (!audioContext) return false;
    // iOS может приостановить звук, например после сворачивания браузера
    if (audioContext.state !== 'running') audioContext.resume();

    const now = audioContext.currentTime + 0.01;
    if (outcome === 'success') {
      // Успех: два восходящих тона
      playTone('sine', 660, 660, now, 0.13);
      playTone('sine', 880, 880, now + 0.13, 0.17);
    } else {
      // Неудача: один нисходящий тон ниже звука успеха. Не ниже 262 Гц: динамик телефона
      // плохо передаёт низкие частоты. Квадратная волна «жужжит» и громче синусоиды, поэтому тише
      playTone('square', 392, 262, now, EARCON_DURATION.failure, VOLUME * 0.5);
    }
    return true;
  }

  // Очистить → подождать → записать: новый текст остаётся изменением, даже если совпадает с прошлым
  function announce(message, extraDelayMs = 0) {
    pendingWrite = setTimeout(() => {
      statusElement.textContent = message;
      pendingClear = setTimeout(() => {
        statusElement.textContent = '';
      }, MESSAGE_LIFETIME_MS);
    }, CLEAR_DELAY_MS + extraDelayMs);
  }

  // Снять запланированные запись и очистку, очистить область
  function reset() {
    clearTimeout(pendingWrite);
    clearTimeout(pendingClear);
    statusElement.textContent = '';
  }

  // Единый вход для всех условий. Фокус здесь никогда не перемещается
  function give({ condition, outcome, message }) {
    reset();

    switch (condition) {
      case 'C0':
        // Намеренно ничего: воспроизводит сбой реальных приложений, где меняется только картинка
        break;
      case 'C1':
        announce(message);
        break;
      case 'C2':
        playEarcon(outcome);
        break;
      case 'C3':
        // Речь начинается после earcon, чтобы они не накладывались
        playEarcon(outcome);
        announce(message, EARCON_DURATION[outcome] * 1000 + EARCON_GAP_MS);
        break;
      case 'C4':
        if (isVibrationSupported()) navigator.vibrate(VIBRATION_PATTERN[outcome]);
        break;
      default:
        throw new Error(`Неизвестное условие: ${condition}`);
    }
  }

  return { initAudio, playEarcon, give, reset };
}
