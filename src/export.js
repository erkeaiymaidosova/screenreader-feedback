import { el } from './dom.js';

// Скачать текст как файл. Данные никуда не отправляются: файл создаётся в самом браузере
export function downloadText(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = el('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text) {
  // Современный способ работает только по HTTPS или на localhost
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Перейдём к запасному способу
    }
  }

  // Запасной способ для адреса http://: скрытое поле и старая команда копирования
  const previousFocus = document.activeElement;
  const area = el('textarea', { readonly: '', class: 'visually-hidden', 'aria-hidden': 'true' });
  area.value = text;
  document.body.append(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  area.remove();
  previousFocus?.focus();
  return copied;
}
