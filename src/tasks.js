import { ORDERS } from './order.js';

function task(id, action, subject, plannedOutcome = 'success') {
  return { id, action, subject, plannedOutcome };
}

export const PRACTICE_TASK = task('practice-favorite', 'favorite', 'Оладьи');

// Условие в тренировке: участник знакомится и со звуком, и с речью
export const PRACTICE_CONDITION = 'C3';

// Наборы привязаны к позиции блока, а не к условию. Неудача в каждом наборе
// приходится на другое действие и на другую позицию: 1, 2, 3, 4
export const TASK_SETS = [
  [
    task('s1-shopping', 'shopping', 'Лагман', 'failure'),
    task('s1-favorite', 'favorite', 'Плов'),
    task('s1-review', 'review', 'Манты'),
    task('s1-setting', 'setting', 'Крупный шрифт'),
  ],
  [
    task('s2-setting', 'setting', 'Уведомления о новых рецептах'),
    task('s2-review', 'review', 'Шорпо', 'failure'),
    task('s2-shopping', 'shopping', 'Самса'),
    task('s2-favorite', 'favorite', 'Бешбармак'),
  ],
  [
    task('s3-favorite', 'favorite', 'Ашлянфу'),
    task('s3-shopping', 'shopping', 'Куурдак'),
    task('s3-setting', 'setting', 'Метрические единицы', 'failure'),
    task('s3-review', 'review', 'Боорсок'),
  ],
  [
    task('s4-review', 'review', 'Гульчатай'),
    task('s4-setting', 'setting', 'Время приготовления'),
    task('s4-shopping', 'shopping', 'Каттама'),
    task('s4-favorite', 'favorite', 'Оромо', 'failure'),
  ],
];

// Отдельный поисковый блок с вибрацией: идёт последним и не нарушает баланс квадрата
const VIBRATION_SET = [
  task('s5-setting', 'setting', 'Калорийность блюд'),
  task('s5-favorite', 'favorite', 'Шашлык'),
  task('s5-shopping', 'shopping', 'Самбуса', 'failure'),
  task('s5-review', 'review', 'Жаркое'),
];

export function buildBlocks(orderId, includeVibration = false) {
  const blocks = ORDERS[orderId].map((condition, index) => ({
    number: index + 1,
    condition,
    tasks: TASK_SETS[index],
    exploratory: false,
  }));

  if (includeVibration) {
    blocks.push({ number: 5, condition: 'C4', tasks: VIBRATION_SET, exploratory: true });
  }
  return blocks;
}
