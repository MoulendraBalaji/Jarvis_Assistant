const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-3-5-sonnet-20241022";

export interface CloudResult {
  text: string;
  ok: boolean;
}

export async function claudeChat(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<CloudResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { text: "", ok: false };
  try {
    const res = await fetch(CLAUDE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages
      })
    });
    if (!res.ok) return { text: "", ok: false };
    const data = (await res.json()) as { content?: { text?: string }[] };
    return { text: data.content?.[0]?.text ?? "", ok: true };
  } catch {
    return { text: "", ok: false };
  }
}
