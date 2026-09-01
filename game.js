const ROUND_LENGTH = 10;
const QUESTION_TIME_MS = 5000;
const initialQuestion = { left: 6, right: 7, answer: 42, options: [36, 42, 48, 49] };

const elements = {
  choiceMode: document.querySelector('#choice-mode'),
  fillMode: document.querySelector('#fill-mode'),
  questionCount: document.querySelector('#question-count'),
  timerToggle: document.querySelector('#timer-toggle'),
  timerRow: document.querySelector('#timer-row'),
  timerTrack: document.querySelector('.timer-track'),
  timerFill: document.querySelector('#timer-fill'),
  timerValue: document.querySelector('#timer-value'),
  progressTrack: document.querySelector('.progress-track'),
  progressFill: document.querySelector('#progress-fill'),
  gamePanel: document.querySelector('#game-panel'),
  results: document.querySelector('#results'),
  leftFactor: document.querySelector('#left-factor'),
  rightFactor: document.querySelector('#right-factor'),
  choiceGrid: document.querySelector('#choice-grid'),
  fillForm: document.querySelector('#fill-form'),
  answerInput: document.querySelector('#answer-input'),
  feedback: document.querySelector('#feedback'),
  score: document.querySelector('#score'),
  headerStreak: document.querySelector('#header-streak'),
  bestStreak: document.querySelector('#best-streak'),
  resultTitle: document.querySelector('#result-title'),
  resultMessage: document.querySelector('#result-message'),
  replayButton: document.querySelector('#replay-button'),
};

let state = {
  mode: 'choice',
  question: initialQuestion,
  questionNumber: 1,
  score: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  answered: false,
  complete: false,
  timed: true,
  timeRemainingMs: QUESTION_TIME_MS,
};

let timerAnimation = null;

function makeQuestion(previous) {
  let left = 2 + Math.floor(Math.random() * 11);
  let right = 2 + Math.floor(Math.random() * 11);
  while (previous && left === previous.left && right === previous.right) {
    left = 2 + Math.floor(Math.random() * 11);
    right = 2 + Math.floor(Math.random() * 11);
  }

  const answer = left * right;
  const distractors = new Set();
  const candidates = [answer + left, answer - left, answer + right, answer - right, (left + 1) * right, left * Math.max(2, right - 1)]
    .filter((value) => value > 0 && value !== answer)
    .sort(() => Math.random() - 0.5);

  for (const value of candidates) {
    distractors.add(value);
    if (distractors.size === 3) break;
  }

  while (distractors.size < 3) {
    const offset = Math.ceil(Math.random() * 12) * (Math.random() > 0.5 ? 1 : -1);
    if (answer + offset > 0) distractors.add(answer + offset);
  }

  return { left, right, answer, options: [answer, ...distractors].sort(() => Math.random() - 0.5) };
}

function renderQuestion() {
  const { question } = state;
  elements.leftFactor.textContent = question.left;
  elements.rightFactor.textContent = question.right;
  elements.questionCount.textContent = `Question ${state.questionNumber} of ${ROUND_LENGTH}`;
  elements.progressTrack.setAttribute('aria-valuenow', String(state.questionNumber - 1));
  elements.progressFill.style.width = `${((state.questionNumber - 1) / ROUND_LENGTH) * 100}%`;
  elements.feedback.className = 'feedback';
  elements.feedback.replaceChildren();
  elements.answerInput.value = '';
  elements.answerInput.disabled = false;

  elements.choiceGrid.replaceChildren(...question.options.map((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.dataset.value = String(option);
    button.innerHTML = `<small>${index + 1}</small>${option}`;
    button.addEventListener('click', () => recordAnswer(option));
    return button;
  }));

  if (state.mode === 'choice') {
    elements.choiceGrid.classList.remove('hidden');
    elements.fillForm.classList.add('hidden');
  } else {
    elements.choiceGrid.classList.add('hidden');
    elements.fillForm.classList.remove('hidden');
    requestAnimationFrame(() => elements.answerInput.focus());
  }
  startTimer();
}

function updateStats() {
  elements.score.textContent = state.score.toLocaleString();
  elements.headerStreak.textContent = state.streak;
  elements.bestStreak.textContent = state.bestStreak;
}

function stopTimer() {
  if (timerAnimation !== null) cancelAnimationFrame(timerAnimation);
  timerAnimation = null;
}

function updateTimerDisplay(milliseconds) {
  const remaining = Math.max(0, milliseconds);
  const seconds = remaining / 1000;
  elements.timerTrack.setAttribute('aria-valuenow', String(seconds));
  elements.timerFill.style.width = `${(remaining / QUESTION_TIME_MS) * 100}%`;
  elements.timerValue.textContent = state.timed ? `${seconds.toFixed(1)}s` : 'Off';
  elements.timerRow.classList.toggle('off', !state.timed);
  elements.timerRow.classList.toggle('danger', state.timed && remaining <= 1500);
}

function startTimer() {
  stopTimer();
  state.timeRemainingMs = QUESTION_TIME_MS;
  updateTimerDisplay(QUESTION_TIME_MS);
  if (!state.timed || state.answered || state.complete) return;

  const deadline = performance.now() + QUESTION_TIME_MS;
  const tick = (now) => {
    state.timeRemainingMs = Math.max(0, deadline - now);
    updateTimerDisplay(state.timeRemainingMs);
    if (state.timeRemainingMs <= 0) {
      timerAnimation = null;
      recordAnswer(null, true);
      return;
    }
    timerAnimation = requestAnimationFrame(tick);
  };
  timerAnimation = requestAnimationFrame(tick);
}

function recordAnswer(value, timedOut = false) {
  if (state.answered || state.complete) return;
  stopTimer();
  state.answered = true;
  const correct = value === state.question.answer;
  let earnedPoints = 0;

  if (correct) {
    const speedBonus = state.timed ? Math.ceil((state.timeRemainingMs / QUESTION_TIME_MS) * 100) : 0;
    earnedPoints = 100 + speedBonus;
    state.score += earnedPoints;
    state.correct += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
  } else {
    state.streak = 0;
  }
  updateStats();

  elements.answerInput.disabled = true;
  elements.choiceGrid.querySelectorAll('.answer-button').forEach((button) => {
    button.disabled = true;
    const buttonValue = Number(button.dataset.value);
    if (buttonValue === state.question.answer) button.classList.add('correct');
    if (buttonValue === value && !correct) button.classList.add('wrong');
  });

  const message = document.createElement('span');
  message.textContent = correct
    ? `Yes — +${earnedPoints} points!`
    : timedOut
      ? `Time’s up! The answer is ${state.question.answer}.`
      : `Almost! The answer is ${state.question.answer}.`;
  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'next-button';
  nextButton.textContent = state.questionNumber === ROUND_LENGTH ? 'See my score →' : 'Next question →';
  nextButton.addEventListener('click', nextQuestion);
  elements.feedback.classList.add(correct ? 'correct' : 'wrong');
  elements.feedback.replaceChildren(message, nextButton);
  nextButton.focus();
}

function nextQuestion() {
  if (state.questionNumber === ROUND_LENGTH) {
    finishRound();
    return;
  }
  state.question = makeQuestion(state.question);
  state.questionNumber += 1;
  state.answered = false;
  renderQuestion();
}

function finishRound() {
  stopTimer();
  state.complete = true;
  elements.progressTrack.setAttribute('aria-valuenow', String(ROUND_LENGTH));
  elements.progressFill.style.width = '100%';
  elements.gamePanel.classList.add('hidden');
  elements.results.classList.remove('hidden');
  elements.resultTitle.textContent = `${state.score.toLocaleString()} points!`;
  elements.resultMessage.textContent = state.correct === ROUND_LENGTH
    ? 'Perfect round — 10 out of 10 correct!'
    : `You answered ${state.correct} out of ${ROUND_LENGTH} correctly. Every try builds stronger math muscles.`;
  elements.replayButton.focus();
}

function startRound(mode = state.mode) {
  const timed = state.timed;
  state = { mode, question: makeQuestion(), questionNumber: 1, score: 0, correct: 0, streak: 0, bestStreak: 0, answered: false, complete: false, timed, timeRemainingMs: QUESTION_TIME_MS };
  elements.choiceMode.classList.toggle('active', mode === 'choice');
  elements.fillMode.classList.toggle('active', mode === 'fill');
  elements.choiceMode.setAttribute('aria-pressed', String(mode === 'choice'));
  elements.fillMode.setAttribute('aria-pressed', String(mode === 'fill'));
  elements.gamePanel.classList.remove('hidden');
  elements.results.classList.add('hidden');
  updateStats();
  renderQuestion();
}

function setTimed(timed) {
  state.timed = timed;
  elements.timerToggle.setAttribute('aria-pressed', String(timed));
  elements.timerToggle.innerHTML = `<span aria-hidden="true">⏱</span> Timer ${timed ? 'on' : 'off'}`;
  if (!state.answered && !state.complete) startTimer();
  else updateTimerDisplay(state.timeRemainingMs);
}

elements.choiceMode.addEventListener('click', () => state.mode !== 'choice' && startRound('choice'));
elements.fillMode.addEventListener('click', () => state.mode !== 'fill' && startRound('fill'));
elements.timerToggle.addEventListener('click', () => setTimed(!state.timed));
elements.replayButton.addEventListener('click', () => startRound());
elements.fillForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (elements.answerInput.value.trim()) recordAnswer(Number(elements.answerInput.value));
});
window.addEventListener('keydown', (event) => {
  if (state.mode !== 'choice' || state.answered || state.complete) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < state.question.options.length) recordAnswer(state.question.options[index]);
});

updateStats();
renderQuestion();

