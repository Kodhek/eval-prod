import { normalizeTrace } from '../core/trace.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function scoreTone(score) {
  if (score >= 4) return { cls: 'good', label: 'Strong' };
  if (score >= 2.5) return { cls: 'warn', label: 'Mixed' };
  return { cls: 'bad', label: 'Weak' };
}

export function renderKpis(dom, summary) {
  dom.kpiGrid.innerHTML = summary.map(item => `
    <article class="kpi-card">
      <div class="section-label">${item.label}</div>
      <div class="kpi-value">${item.value}</div>
      <div class="muted text-sm">${item.caption}</div>
    </article>`).join('');
}

export function renderResults(dom, result, trace, judgeMode) {
  const categories = result.categories || {};
  const items = [
    ['intent', 'Intent'],
    ['tool_correctness', 'Tool correctness'],
    ['retrieval_grounding', 'Retrieval grounding'],
    ['response_quality', 'Response quality']
  ];

  dom.scoreGrid.innerHTML = items.map(([key, label]) => {
    const item = categories[key] || { score: 0, verdict: 'No score', evidence: [], fixes: [] };
    const percent = Math.max(0, Math.min(100, (item.score || 0) * 20));
    const tone = scoreTone(item.score || 0);
    return `<article class="score-card">
      <div class="section-label">${label}</div>
      <div class="score-value ${tone.cls}">${Number(item.score || 0).toFixed(1)}</div>
      <div class="bar"><span style="width:${percent}%"></span></div>
      <div class="muted text-sm" style="margin-top:.6rem">${escapeHtml(item.verdict || '')}</div>
    </article>`;
  }).join('');

  dom.rubricFindings.innerHTML = items.map(([key, label]) => {
    const item = categories[key] || { score: 0, verdict: 'No score', evidence: [], fixes: [] };
    const tone = scoreTone(item.score || 0);
    return `<section class="rubric-item">
      <div class="trace-head">
        <strong>${label}</strong>
        <span class="grade ${tone.cls}">${tone.label} · ${Number(item.score || 0).toFixed(1)}/5</span>
      </div>
      <div class="muted text-sm" style="margin-bottom:.65rem">${escapeHtml(item.verdict || '')}</div>
      <div class="section-label">Evidence</div>
      <ul>${(item.evidence || []).map(value => `<li class="muted">${escapeHtml(value)}</li>`).join('')}</ul>
      <div class="section-label" style="margin-top:.7rem">Fixes</div>
      <ul>${(item.fixes || []).map(value => `<li class="muted">${escapeHtml(value)}</li>`).join('')}</ul>
    </section>`;
  }).join('');

  const report = `## ${(result.overall_grade || 'result').toUpperCase()}\n\n${result.summary || ''}\n\n### Critical failures\n${(result.critical_failures || []).length ? (result.critical_failures || []).map(value => `- ${value}`).join('\n') : '- None detected'}\n\n### Recommended tests\n${(result.recommended_tests || []).map(value => `- ${value}`).join('\n')}`;
  dom.reportOutput.innerHTML = window.marked.parse(report);
  dom.jsonOutput.value = JSON.stringify(result, null, 2);
  dom.overallGrade.textContent = `${(result.overall_grade || 'not run').toUpperCase()} · ${result.overall_score ?? '—'}`;

  const norm = normalizeTrace(trace);
  renderKpis(dom, [
    { label: 'Messages', value: String(norm.messages.length), caption: 'Conversation items' },
    { label: 'Tool calls', value: String(norm.toolCalls.length), caption: 'Actions attempted' },
    { label: 'Retrieval items', value: String(norm.allDocs.length), caption: 'Grounding units' },
    { label: 'Judge mode', value: judgeMode === 'llm' ? 'LLM' : 'Local', caption: 'Evaluation engine' }
  ]);

  dom.tracePreview.innerHTML = norm.steps.slice(0, 6).map((step, index) => `
    <article class="trace-item">
      <div class="trace-head"><strong>Step ${index + 1}</strong><span class="chip">${escapeHtml(step.type || 'unknown')}</span></div>
      <div class="muted text-sm">${escapeHtml(step.tool ? `${step.tool} — ` : '')}${escapeHtml((step.content && typeof step.content === 'string' ? step.content : JSON.stringify(step.args || step.content || {})).slice(0, 220))}</div>
    </article>`).join('') || '<div class="muted">No steps detected.</div>';
}
