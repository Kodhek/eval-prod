export async function runLlmJudge({ apiBase, apiKey, model, promptTemplate, payload }) {
  if (!apiBase || !apiKey || !model) throw new Error('External LLM mode requires API base, model, and API key.');

  const response = await fetch(apiBase.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: promptTemplate },
        { role: 'user', content: JSON.stringify(payload, null, 2) }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Judge API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Judge API returned no message content.');
  return JSON.parse(content);
}
