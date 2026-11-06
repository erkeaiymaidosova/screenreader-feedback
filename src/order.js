// Сбалансированный латинский квадрат: каждое условие идёт за каждым другим ровно один раз
export const ORDERS = {
  O1: ['C0', 'C1', 'C3', 'C2'],
  O2: ['C1', 'C2', 'C0', 'C3'],
  O3: ['C2', 'C3', 'C1', 'C0'],
  O4: ['C3', 'C0', 'C2', 'C1'],
};

// Только коды P1–P10, чтобы в журнал не попали имена
export function normalizeParticipantId(value) {
  const id = value.trim().toUpperCase();
  return /^P([1-9]|10)$/.test(id) ? id : null;
}

// P1–P4 получают O1–O4, затем порядки повторяются: P5 снова O1
export function getOrderIdForParticipant(participantId) {
  const number = Number(participantId.slice(1));
  return `O${((number - 1) % 4) + 1}`;
}
