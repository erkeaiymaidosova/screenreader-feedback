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
  version: (version) => `Версия кода: ${version}`,
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
  copyFailed: 'Скопировать не удалось. Нажмите «Показать данные» и скопируйте текст вручную.',
  downloadStarted: (name) =>
    `Файл «${name}» отправлен на скачивание. На iPhone ищите его в приложении «Файлы», папка «Загрузки». Если файла нет, нажмите «Показать данные».`,
  showData: 'Показать данные',
  dataLabel: 'Данные журнала (JSON). Выделите весь текст и скопируйте',
  deleteData: 'Удалить сохранённые данные',
  confirmDelete: 'Удалить все сохранённые сессии из этого браузера? Сначала сделайте экспорт.',
};

// Тексты страницы исследователя
export const researcherUi = {
  title: 'Страница исследователя',
  intro: 'Ответы участника сохраняются только в этом браузере. Не вводите имена.',
  version: (version) => `Версия кода: ${version}`,
  participantId: 'ID участника (P1–P10)',
  participantIdError: 'Введите код от P1 до P10. Имена не вводите.',
  orderLabel: 'Порядок условий (как на телефоне)',
  orderAuto: 'Автоматически по ID',
  includeVibration: 'Был поисковый блок с вибрацией',
  open: 'Открыть лист ответов',
  back: '← К списку участников',
  savedParticipants: (ids) => `Сохранённые участники: ${ids}`,
  orderInfo: (orderId, conditions) => `Порядок ${orderId}: ${conditions}`,

  blockHeading: (number, condition, exploratory) =>
    `Блок ${number} — ${condition}${exploratory ? ' (поисковый)' : ''}`,
  taskHeading: (number, title) => `Задание ${number}. ${title}`,
  planned: (outcome) => `Запланировано: ${outcome === 'success' ? 'успех' : 'неудача'}`,
  whatHappened: 'Что произошло?',
  answerSuccess: 'Удалось',
  answerFailure: 'Не удалось',
  answerUnsure: 'Не уверен(а)',
  confidence: 'Уверенность (1–5)',
  afterBlock: 'После блока',
  clarity: 'Понятность (1–5)',
  intrusiveness: 'Навязчивость (1–5)',

  finalHeading: 'В конце сессии',
  rankingLegend: 'Ранжирование: место каждого блока (1 — лучший)',
  rankingLabel: (number, condition) => `Блок ${number} (${condition})`,
  rankingDuplicate: 'Одно и то же место выбрано несколько раз.',
  notes: 'Заметки',

  saved: (time) => `Сохранено в ${time}`,
  storageUnavailable: 'Хранилище браузера недоступно: ответы пропадут при перезагрузке. Скачайте CSV до закрытия.',

  exportHeading: 'Экспорт ответов',
  downloadAnswers: 'Скачать CSV ответов (все участники)',
  deleteAnswers: 'Удалить все ответы',
  confirmDelete: 'Удалить ответы всех участников из этого браузера? Сначала скачайте CSV.',

  importHeading: 'Журнал с телефона',
  importHelp: 'Вставьте JSON, скопированный на телефоне кнопкой «Показать данные», и скачайте CSV на этом компьютере.',
  importLabel: 'JSON журнала',
  importEvents: 'Скачать CSV событий',
  importSummary: 'Скачать CSV итогов',
  importMerged: 'Скачать объединённую таблицу',
  importMergedHelp: 'Объединённая таблица: одна строка на задание. В ней фактический исход с телефона и ответы участника с этой страницы.',
  importError: 'Не удалось прочитать JSON. Проверьте, что текст скопирован полностью.',
  importDone: (count) => `Прочитано сессий: ${count}.`,
};
