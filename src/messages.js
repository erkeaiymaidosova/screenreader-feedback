// Все тексты интерфейса: здесь же позже можно добавить другие языки

// Сообщения о результате действия
export const messages = {
  favoriteAdded: (recipe) => `Рецепт „${recipe}“ добавлен в избранное`,
  favoriteRemoved: (recipe) => `Рецепт „${recipe}“ удалён из избранного`,
  favoriteLimit: (recipe) => `Не удалось добавить рецепт „${recipe}“ в избранное: достигнут лимит избранного`,
  shoppingAdded: (recipe) => `Ингредиенты рецепта „${recipe}“ добавлены в список покупок`,
  shoppingFull: (recipe) => `Не удалось добавить ингредиенты рецепта „${recipe}“: список покупок переполнен`,
  settingSaved: (setting) => `Настройка „${setting}“ сохранена`,
  settingNotSaved: (setting) => `Настройка „${setting}“ не сохранена: нет соединения`,
  reviewSent: (recipe) => `Отзыв о рецепте „${recipe}“ отправлен`,
  reviewNameMissing: 'Не удалось отправить отзыв: заполните поле „Имя“',
};

// Формулировки заданий
export const taskTitles = {
  favorite: (recipe) => `Добавьте рецепт „${recipe}“ в избранное`,
  shopping: (recipe) => `Добавьте ингредиенты рецепта „${recipe}“ в список покупок`,
  setting: (setting) => `Включите настройку „${setting}“`,
  review: (recipe) => `Оставьте отзыв о рецепте „${recipe}“: напишите в поле „Отзыв“ слово „Вкусно“ и отправьте форму`,
};

// Подписи экранов и кнопок
export const ui = {
  setupTitle: 'Настройка сессии',
  participantId: 'ID участника (P1–P10)',
  participantIdError: 'Введите код от P1 до P10. Имена не вводите.',
  orderLabel: 'Порядок условий',
  orderAuto: 'Автоматически по ID',
  includeVibration: 'Добавить поисковый блок с вибрацией',
  vibrationUnsupported: 'Этот браузер не поддерживает вибрацию.',
  audioUnsupported: 'Этот браузер не поддерживает Web Audio. Сессию проводить нельзя.',
  start: 'Начать',

  introTitle: 'Знакомство со звуками',
  introText: 'Каждый звук можно прослушать дважды. Затем будет одно тренировочное задание.',
  playSuccess: 'Прослушать звук успеха',
  playFailure: 'Прослушать звук неудачи',
  toPractice: 'Перейти к тренировке',

  practiceTitle: (title) => `Тренировка. ${title}`,
  taskTitle: (number, total, title) => `Задание ${number} из ${total}. ${title}`,
  nextTask: 'Следующее задание',

  recipeCaption: 'Рецепт дня',
  settingsTitle: 'Настройки',
  addToFavorites: 'Добавить в избранное',
  addToShopping: 'Добавить в список покупок',
  enableSetting: (setting) => `Включить: ${setting}`,
  share: 'Поделиться рецептом',
  resetSettings: 'Сбросить настройки',
  nameLabel: 'Имя',
  reviewLabel: 'Отзыв',
  sendReview: 'Отправить отзыв',

  blockDoneTitle: (number, total) => `Блок ${number} из ${total} завершён`,
  blockDoneText: 'Сейчас исследователь задаст несколько вопросов.',
  continue: 'Продолжить',

  finishTitle: 'Спасибо за участие!',
  finishText: 'Сессия завершена.',

  storageUnavailable: 'Хранилище браузера недоступно: журнал пропадёт при перезагрузке. Сделайте экспорт до закрытия страницы.',
  resumeSession: (participantId) => `Продолжить сессию ${participantId}`,
  stoppedAt: (place) => `Сессия остановилась: ${place}.`,
  progressIntro: 'знакомство со звуками',
  progressTask: (block, task) => `блок ${block}, задание ${task}`,
  progressPause: (block) => `пауза после блока ${block}`,

  exportTitle: 'Экспорт журнала',
  savedSessions: (count) => `Сохранённых сессий в этом браузере: ${count}`,
  downloadJson: 'Скачать JSON',
  downloadEventsCsv: 'Скачать CSV событий',
  downloadSummaryCsv: 'Скачать CSV итогов',
  copyJson: 'Скопировать JSON',
  copied: 'JSON скопирован в буфер обмена.',
  copyFailed: 'Скопировать не удалось. Скачайте файл.',
  deleteData: 'Удалить сохранённые данные',
  confirmDelete: 'Удалить все сохранённые сессии из этого браузера? Сначала сделайте экспорт.',
};
