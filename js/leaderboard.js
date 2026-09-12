Session.require();

const STAR_SVG = '<svg class="star-icon" viewBox="0 0 24 24"><path d="M12 1 L14.7 8.5 L22.8 8.7 L16.3 13.6 L18.6 21.3 L12 16.8 L5.4 21.3 L7.7 13.6 L1.2 8.7 L9.3 8.5 Z" fill="#fff"/></svg>';

let topScores = [];
let topAccuracy = [];
let currentTab = 'scores';

(async function () {
  const res = await Api.getLeaderboard();
  document.getElementById('board-loading').style.display = 'none';
  topScores = res.topScores || [];
  topAccuracy = res.topAccuracy || [];

  if (topScores.length === 0) {
    document.getElementById('board-empty').style.display = 'block';
    return;
  }
  document.getElementById('tab-row').style.display = 'flex';
  document.getElementById('board-view').style.display = 'block';
  render();
})();

document.getElementById('tab-scores').addEventListener('click', () => setTab('scores'));
document.getElementById('tab-accuracy').addEventListener('click', () => setTab('accuracy'));

function setTab(tab) {
  currentTab = tab;
  document.getElementById('tab-scores').classList.toggle('active', tab === 'scores');
  document.getElementById('tab-accuracy').classList.toggle('active', tab === 'accuracy');
  render();
}

function render() {
  const board = currentTab === 'scores' ? topScores : topAccuracy;
  const metric = (p) => currentTab === 'scores' ? `${p.score} pts` : `${p.accuracy_pct}%`;
  const placeClasses = ['first', 'second', 'third'];

  const top3 = board.slice(0, 3);
  document.getElementById('podium').innerHTML = top3.map((p, i) => `
    <div class="pod ${placeClasses[i]}">
      ${STAR_SVG}
      <div class="name">${escapeHtml(p.username)}</div>
      <div class="score">${metric(p)}</div>
    </div>`).join('');

  const rest = board.slice(3, 5);
  document.getElementById('rank-rows').innerHTML = rest.map((p, i) => `
    <div class="rank-row">
      <span class="n">${i + 4}. ${escapeHtml(p.username)}</span>
      <span>${metric(p)} · ${formatDate(p.date_iso)}</span>
    </div>`).join('');

  const noteEl = document.getElementById('board-note');
  if (board.length === 1) {
    noteEl.textContent = `Only ${board[0].username} has played so far — challenge them!`;
    noteEl.style.display = 'block';
  } else if (board.length === 2) {
    noteEl.textContent = `Just 2 players so far — more will show up as the class plays.`;
    noteEl.style.display = 'block';
  } else {
    noteEl.style.display = 'none';
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
