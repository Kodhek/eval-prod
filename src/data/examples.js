export const defaultJudgePrompt = `You are an expert agent evaluator. Score an agent run using the provided system prompt, task, context, trace, and final response. Determine whether the agent took the correct action given its instructions and available evidence.

Return strict JSON with this schema:
{
  "overall_score": 0-5,
  "overall_grade": "pass|borderline|fail",
  "summary": "short summary",
  "categories": {
    "intent": {"score": 0-5, "verdict": "...", "evidence": ["..."], "fixes": ["..."]},
    "tool_correctness": {"score": 0-5, "verdict": "...", "evidence": ["..."], "fixes": ["..."]},
    "retrieval_grounding": {"score": 0-5, "verdict": "...", "evidence": ["..."], "fixes": ["..."]},
    "response_quality": {"score": 0-5, "verdict": "...", "evidence": ["..."], "fixes": ["..."]}
  },
  "critical_failures": ["..."],
  "recommended_tests": ["..."]
}`;

export const exampleTrace = {
  messages: [
    { role: 'user', content: 'I bought this 45 days ago and want a refund. Can you help?' }
  ],
  steps: [
    { type: 'tool_call', tool: 'search_policies', args: { query: 'refund policy purchase age' } },
    { type: 'tool_result', tool: 'search_policies', content: [
      { id: 'refund_policy', text: 'Refunds are allowed within 30 days of purchase. After 30 days, only exchanges are allowed.' }
    ] },
    { type: 'assistant', content: 'I found the refund policy.' }
  ],
  final_response: 'You are not eligible for a refund because the purchase was 45 days ago. You may still qualify for an exchange based on the policy.'
};

export const traceSchema = `{
  "messages": [{"role": "user|assistant|system", "content": "..."}],
  "steps": [
    {"type": "tool_call", "tool": "search_docs", "args": {"query": "..."}, "timestamp": "..."},
    {"type": "tool_result", "tool": "search_docs", "content": [{"id": "doc1", "text": "...", "source": "kb"}]},
    {"type": "assistant", "content": "intermediate or final answer"}
  ],
  "final_response": "...",
  "expected_tool": "optional",
  "expected_intent": "optional",
  "retrieval": [{"id": "doc1", "text": "...", "source": "..."}]
}`;
