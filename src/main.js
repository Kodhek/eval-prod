import { defaultJudgePrompt, exampleTrace, traceSchema } from './data/examples.js';
import { getDom } from './ui/dom.js';
import { createController } from './ui/controller.js';
import { renderResults } from './ui/render.js';

const dom = getDom();
const controller = createController(dom);

dom.judgePromptTemplate.value = defaultJudgePrompt;
dom.schemaBlock.textContent = traceSchema;
dom.traceInput.value = JSON.stringify(exampleTrace, null, 2);
dom.userTask.value = 'Determine whether the agent took the right action for the user request. Verify intent understanding, tool choice, grounding, and response quality.';
dom.systemPrompt.value = 'Always use the available tools when answering policy or account-specific questions. Ground every answer in retrieved evidence.';
dom.agentContext.value = 'Available tools: search_policies, lookup_orders, knowledge_search. The evaluator should consider both the trace and the provided context.';

dom.navButtons.forEach(button => button.addEventListener('click', () => controller.setView(button.dataset.viewBtn)));
dom.themeToggle.addEventListener('click', controller.toggleTheme);
dom.runEvalBtn.addEventListener('click', controller.runEval);
dom.loadExampleBtn.addEventListener('click', () => {
  dom.runName.value = 'Refund policy support agent';
  dom.userTask.value = 'Determine whether the user qualifies for a refund and cite the relevant policy. Correct action: retrieve policy before answering.';
  dom.systemPrompt.value = 'You are a support agent. Always check store policy before answering refund or exchange questions. Do not invent policies.';
  dom.agentContext.value = 'Store support environment. Available tools: search_policies, lookup_orders.';
  dom.traceInput.value = JSON.stringify(exampleTrace, null, 2);
  dom.apiBase.value = 'https://api.openai.com/v1';
  dom.apiModel.value = 'gpt-4.1-mini';
  controller.runEval();
});

renderResults(dom, {
  overall_score: 0,
  overall_grade: 'not run',
  summary: 'Run the evaluator to see results.',
  categories: {
    intent: { score: 0, verdict: 'Awaiting evaluation', evidence: [], fixes: [] },
    tool_correctness: { score: 0, verdict: 'Awaiting evaluation', evidence: [], fixes: [] },
    retrieval_grounding: { score: 0, verdict: 'Awaiting evaluation', evidence: [], fixes: [] },
    response_quality: { score: 0, verdict: 'Awaiting evaluation', evidence: [], fixes: [] }
  },
  critical_failures: [],
  recommended_tests: []
}, exampleTrace, 'heuristic');
