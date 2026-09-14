/**
 * Calls the Google Gemini API's generateContent endpoint.
 * Uses Node's built-in fetch (Node 18+), no extra package needed.
 */
async function askGemini(question, contextText, retries = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: contextText }] },
        contents: [{ role: 'user', parts: [{ text: question }] }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!answer) throw new Error('Gemini API returned no answer.');
      return answer.trim();
    }

    // If overloaded (503) or rate-limited (429), wait briefly and retry
    if ((response.status === 503 || response.status === 429) && attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      continue;
    }

    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }
}

module.exports = { askGemini };