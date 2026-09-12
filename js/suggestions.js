// Builds a suggestion from this session's factLog (each entry: {a, b, correct, timeMs, given}).
// Under 5 mistakes: list each one out. 5 or more: point at whichever number
// showed up most across the mistakes (skipping 0/1, which are rarely the real problem).
function buildSessionSuggestion(factLog) {
  const mistakes = factLog.filter(f => !f.correct);
  if (mistakes.length === 0) return { type: 'perfect' };
  if (mistakes.length < 5) return { type: 'list', mistakes };

  const tally = {};
  mistakes.forEach(m => {
    [m.a, m.b].forEach(v => {
      if (v <= 1) return;
      tally[v] = (tally[v] || 0) + 1;
    });
  });
  const entries = Object.entries(tally).sort((x, y) => y[1] - x[1]);
  if (entries.length === 0) return { type: 'generic', count: mistakes.length };
  return { type: 'focus', table: entries[0][0], count: mistakes.length };
}

function renderSessionSuggestion(suggestion) {
  if (suggestion.type === 'perfect') {
    return `<div class="suggestion-box suggestion-good">🎉 Perfect round — no mistakes!</div>`;
  }
  if (suggestion.type === 'list') {
    const rows = suggestion.mistakes.map(m => `
      <div class="mistake-row">
        <span>${m.a} × ${m.b} = ${m.a * m.b}</span>
        <span class="mistake-given">you said ${m.given}</span>
      </div>`).join('');
    return `<div class="suggestion-box"><div class="suggestion-title">Review these</div>${rows}</div>`;
  }
  if (suggestion.type === 'focus') {
    return `<div class="suggestion-box suggestion-focus">💡 ${suggestion.count} misses this round — try practicing the <strong>${suggestion.table}×</strong> table.</div>`;
  }
  return `<div class="suggestion-box">Keep practicing — you'll get faster with more rounds!</div>`;
}
