import { heuristicJudge } from '../core/judge.js';
import { safeJsonParse } from '../core/trace.js';
import { runLlmJudge } from '../services/llmJudge.js';
import { renderResults } from './render.js';

export function createController(dom) {
  const views = {
    workspace: [dom.workspaceView, dom.resultsView],
    schema: [dom.schemaView],
    prompting: [dom.promptingView]
  };

  function setView(view) {
    Object.values(views).flat().forEach(element => element.classList.add('hidden'));
    (views[view] || []).forEach(element => element.classList.remove('hidden'));
    dom.navButtons.forEach(button => button.classList.toggle('active', button.dataset.viewBtn === view));
  }

  function toggleTheme() {
    const root = document.documentElement;
    root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }

  async function runEval() {
    const parsed = safeJsonParse(dom.traceInput.value.trim());
    if (!parsed.ok) {
      dom.jsonOutput.value = JSON.stringify({ error: 'Invalid JSON trace', details: parsed.error }, null, 2);
      dom.reportOutput.innerHTML = '<p class="bad">Trace JSON could not be parsed. Fix the input and try again.</p>';
      return;
    }

    const payload = {
      run_name: dom.runName.value.trim(),
      task: dom.userTask.value.trim(),
      system_prompt: dom.systemPrompt.value.trim(),
      context: dom.agentContext.value.trim(),
      trace: parsed.value
    };

    dom.runEvalBtn.disabled = true;
    dom.runEvalBtn.textContent = 'Evaluating...';

    try {
      const result = dom.judgeMode.value === 'llm'
        ? await runLlmJudge({
            apiBase: dom.apiBase.value.trim(),
            apiKey: dom.apiKey.value.trim(),
            model: dom.apiModel.value.trim(),
            promptTemplate: dom.judgePromptTemplate.value.trim(),
            payload
          })
        : heuristicJudge(payload);

      renderResults(dom, result, parsed.value, dom.judgeMode.value);
      setView('workspace');
    } catch (error) {
      dom.jsonOutput.value = JSON.stringify({ error: error.message }, null, 2);
      dom.reportOutput.innerHTML = `<p class="bad">${error.message}</p>`;
    } finally {
      dom.runEvalBtn.disabled = false;
      dom.runEvalBtn.textContent = 'Run eval';
    }
  }

  return { setView, toggleTheme, runEval };
}
