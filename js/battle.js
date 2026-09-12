const username = Session.require();

let mode = '';
let weightedFacts = null;
let current = null;
let score = 0, correct = 0, attempts = 0, streak = 0;
let factLog = [];
let timeLeft = 300;
let timerHandle = null;
let questionStart = 0;
let awaitingNext = false;

document.getElementById('mode-normal').addEventListener('click', () => startBattle('battle-normal'));
document.getElementById('mode-adaptive').addEventListener('click', () => startBattle('battle-adaptive'));

async function startBattle(selectedMode) {
  mode = selectedMode;
  score = 0; correct = 0; attempts = 0; streak = 0; factLog = []; timeLeft = 300;

  document.getElementById('mode-view').style.display = 'none';

  if (mode === 'battle-adaptive') {
    document.getElementById('loading-view').style.display = 'block';
    const res = await Api.getFactStats(username);
    document.getElementById('loading-view').style.display = 'none';
    if (res.facts) weightedFacts = computeFactWeights(res.facts);
  }

  document.getElementById('arena-view').style.display = 'block';
  updateScoreUI();
  nextQuestion();
  timerHandle = setInterval(tick, 1000);
}

function tick() {
  timeLeft--;
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  document.getElementById('timer-text').textContent = `${m}:${s.toString().padStart(2, '0')}`;
  if (timeLeft <= 0 && !awaitingNext) endBattle();
}

function nextQuestion() {
  if (timeLeft <= 0) return endBattle();
  if (mode === 'battle-adaptive' && weightedFacts) {
    current = pickWeightedFact(weightedFacts);
  } else {
    current = { a: Math.floor(Math.random() * 11), b: Math.floor(Math.random() * 11) };
  }
  document.getElementById('problem-text').textContent = `${current.a} × ${current.b}`;
  const input = document.getElementById('answer-input');
  input.value = '';
  input.disabled = false;
  input.focus();
  document.getElementById('feedback-text').textContent = '';
  questionStart = performance.now();
}

document.getElementById('answer-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (timeLeft <= 0 || awaitingNext) return;
  const val = document.getElementById('answer-input').value;
  if (val === '') return;
  const timeMs = Math.round(performance.now() - questionStart);
  const correctAnswer = current.a * current.b;
  const isCorrect = Number(val) === correctAnswer;
  attempts++;
  if (isCorrect) { correct++; score++; streak++; } else { streak = 0; }
  factLog.push({ a: current.a, b: current.b, correct: isCorrect, timeMs, given: Number(val) });
  updateScoreUI();

  const feedbackEl = document.getElementById('feedback-text');
  feedbackEl.textContent = isCorrect ? '✅ Correct!' : `❌ It's ${correctAnswer}`;
  document.getElementById('answer-input').disabled = true;
  awaitingNext = true;
  setTimeout(() => { awaitingNext = false; nextQuestion(); }, isCorrect ? 400 : 900);
});

function updateScoreUI() {
  document.getElementById('score-text').textContent = `Score: ${score}`;
  document.getElementById('streak-text').textContent = `Streak: ${streak}`;
}

async function endBattle() {
  clearInterval(timerHandle);
  document.getElementById('arena-view').style.display = 'none';
  document.getElementById('result-view').style.display = 'block';
  const accuracyPct = attempts > 0 ? Math.round((correct / attempts) * 1000) / 10 : 0;
  document.getElementById('result-score').textContent = `${score} points`;
  document.getElementById('result-stats').textContent = `${correct}/${attempts} correct · ${accuracyPct}% accuracy`;
  document.getElementById('suggestion-box').innerHTML = renderSessionSuggestion(buildSessionSuggestion(factLog));

  await Api.submitBattleSession({ username, mode, score, correct, attempts, accuracyPct, durationSec: 300, factLog });
  const earned = await evaluateAndAwardAchievements(username);
  document.getElementById('new-badges').innerHTML = earned.map(a => `<span class="badge-earned">🏅 ${a.label}</span>`).join('');
}

document.getElementById('view-leaderboard-btn').addEventListener('click', () => window.location.href = 'leaderboard.html');
document.getElementById('play-again-btn').addEventListener('click', () => window.location.reload());
