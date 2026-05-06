export function safeJsonParse(text) {
  try { return { ok: true, value: JSON.parse(text) }; }
  catch (error) { return { ok: false, error: error.message }; }
}

export function normalizeTrace(trace) {
  const steps = Array.isArray(trace.steps) ? trace.steps : [];
  const retrieval = Array.isArray(trace.retrieval) ? trace.retrieval : [];
  const toolCalls = steps.filter(step => step.type === 'tool_call');
  const toolResults = steps.filter(step => step.type === 'tool_result');
  const docsFromResults = toolResults.flatMap(step => Array.isArray(step.content) ? step.content : []);
  const finalResponse = trace.final_response || [...steps].reverse().find(step => step.type === 'assistant' && step.content)?.content || '';

  return {
    messages: Array.isArray(trace.messages) ? trace.messages : [],
    steps,
    retrieval,
    toolCalls,
    toolResults,
    allDocs: [...retrieval, ...docsFromResults],
    finalResponse
  };
}
