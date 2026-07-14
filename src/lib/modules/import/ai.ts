/**
 * Calls OpenRouter to process text using an LLM.
 */
export async function callOpenRouter(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY_MISSING");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "ArqFlow",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(40000) // 40 seconds timeout
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`API_RESPONSE_ERROR_${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("EMPTY_RESPONSE");
    }

    return content;
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.message?.includes("timeout")) {
      throw new Error("AI_TIMEOUT");
    }
    throw err;
  }
}

/**
 * Parses and normalizes JSON arrays returned by OpenRouter, extracting them even if wrapped in a key.
 */
export function normalizeAiOutput(content: string): any[] {
  let text = content.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("JSON parse error:", err, "Raw text:", text);
    throw new Error("INVALID_AI_JSON");
  }

  let items: any[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && typeof parsed === "object") {
    const keys = Object.keys(parsed);
    for (const key of keys) {
      if (Array.isArray(parsed[key])) {
        items = parsed[key];
        break;
      }
    }
    if (items.length === 0) {
      items = [parsed];
    }
  }

  return items;
}
