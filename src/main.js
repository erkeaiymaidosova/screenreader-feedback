import { messages } from './messages.js';

const saveButton = document.getElementById('save-button');
const status = document.getElementById('status');

// Текст появляется в области role="status", а фокус остаётся на кнопке
saveButton.addEventListener('click', () => {
  status.textContent = messages.recipeSaved('Плов');
});
