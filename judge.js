import { normalizeTrace } from './trace.js';

function containsAny(text, needles) {
  const value = (Array.isArray(text) ? text.join(' ') : text || '').toLowerCase();
  return needles.some(needle => value.includes(needle));
}

export function heuristicJudge(payload) {
  const { task, system_prompt: systemPrompt, context, trace } = payload;
  const norm = normalizeTrace(trace);
  const userNeed = (norm.messages.find(message => message.role === 'user')?.content || task || '').toLowerCase();
  const requiresTool = containsAny([task, systemPrompt, userNeed], ['always check', 'must use tool', 'retrieve', 'look up', 'search', 'policy', 'database', 'knowledge base', 'docs']);
  const didUseTool = norm.toolCalls.length > 0;
  const hasRetrieval = norm.allDocs.length > 0;
  const groundedTerms = norm.allDocs.map(doc => (doc.text || JSON.stringify(doc)).toLowerCase());
  const response = (norm.finalResponse || '').toLowerCase();
  const responseGrounded = groundedTerms.some(text => text && text.split(/\W+/).filter(word => word.length > 5).slice(0, 10).some(word => response.includes(word)));
  const mentionsUncertainty = containsAny(response, ['i am not sure', 'cannot determine', 'need more information', 'i do not know']);
  const taskMatches = [
    containsAny(userNeed, ['refund']) ? containsAny(response, ['refund', 'exchange']) : true,
    containsAny(userNeed, ['book', 'schedule']) ? containsAny(response, ['schedule', 'book', 'appointment']) : true,
    containsAny(userNeed, ['price', 'cost']) ? containsAny(response, ['price', 'cost', '$']) : true
  ].every(Boolean);
  const wrongAction = requiresTool && !didUseTool;

  const scores = {
    intent: 2 + (taskMatches ? 2 : 0) + (!wrongAction ? 1 : 0),
    tool_correctness: requiresTool ? (didUseTool ? 4 : 1) : (didUseTool ? 4 : 5),
    retrieval_grounding: hasRetrieval ? (responseGrounded ? 5 : 3) : (requiresTool ? 1 : 3),
    response_quality: (norm.finalResponse ? 3 : 0) + (taskMatches ? 1 : 0) + (!mentionsUncertainty ? 1 : 0)
  };

  Object.keys(scores).forEach(key => { scores[key] = Math.max(0, Math.min(5, scores[key])); });
  const average = Object.values(scores).reduce((sum, score) => sum + score, 0) / 4;
  const criticalFailures = [];
  if (wrongAction) criticalFailures.push('The system/task implied retrieval or tool use, but the trace shows no tool call.');
  if (requiresTool && !hasRetrieval) criticalFailures.push('The run required grounding material, but no retrieved evidence was captured.');
  if (!taskMatches) criticalFailures.push('The final response does not clearly address the user intent.');

  return {
    overall_score: Number(average.toFixed(1)),
    overall_grade: average >= 4 ? 'pass' : average >= 2.75 ? 'borderline' : 'fail',
    summary: wrongAction ? 'The run likely chose the wrong action path before answering.' : 'The run mostly followed the expected action path.',
    categories: {
      intent: {
        score: scores.intent,
        verdict: taskMatches ? 'Intent was mostly understood.' : 'Intent handling was weak or off-target.',
        evidence: [
          `User need inferred from trace: ${userNeed.slice(0, 140) || 'n/a'}`,
          taskMatches ? 'The final response appears to target the user request.' : 'The final response missed obvious task keywords.'
        ],
        fixes: taskMatches ? ['Add expected intent labels to the trace for stricter checking.'] : ['Add an intent classification step before tool selection.']
      },
      tool_correctness: {
        score: scores.tool_correctness,
        verdict: wrongAction ? 'Tool choice was likely incorrect or incomplete.' : 'Tool usage matched the apparent need.',
        evidence: [
          `Tool calls observed: ${norm.toolCalls.length}`,
          requiresTool ? 'Prompt/task implied the agent should consult external context before answering.' : 'The task did not clearly require tools.'
        ],
        fixes: wrongAction ? ['Gate final answers behind required retrieval or policy checks.'] : ['Log expected tool labels to improve automated checks.']
      },
      retrieval_grounding: {
        score: scores.retrieval_grounding,
        verdict: hasRetrieval ? (responseGrounded ? 'Response is partially grounded in retrieved evidence.' : 'Evidence exists, but grounding is weak.') : 'No retrieval evidence was available.',
        evidence: [
          `Retrieved items observed: ${norm.allDocs.length}`,
          responseGrounded ? 'The response reused content that appears in the retrieved material.' : 'The response did not clearly tie back to the retrieved material.'
        ],
        fixes: hasRetrieval ? ['Quote or cite the exact snippet that justifies the answer.'] : ['Capture retrieval documents and tool results in the trace.']
      },
      response_quality: {
        score: scores.response_quality,
        verdict: norm.finalResponse ? 'The run produced a readable answer.' : 'No final response detected.',
        evidence: [
          norm.finalResponse ? `Final response length: ${norm.finalResponse.length} characters.` : 'Final response missing.',
          mentionsUncertainty ? 'The answer included uncertainty language.' : 'The answer was direct and concise.'
        ],
        fixes: ['Add explicit rationale and policy references when the answer depends on retrieved context.']
      }
    },
    critical_failures: criticalFailures,
    recommended_tests: [
      'Add a golden test where the task requires retrieval and the wrong-tool path should fail.',
      'Compare grounded vs ungrounded answers using the same user request.',
      'Add a trace with intentionally conflicting context to test refusal behavior.'
    ]
  };
}
