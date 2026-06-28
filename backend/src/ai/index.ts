import { Router, type Request, type Response } from 'express';
import { buildCoachPrompt } from '../saudi-context/system-prompt';

// AI coach proxy. The app NEVER calls a model provider directly and NEVER holds
// a provider key — it posts the conversation here, and this in-region service
// attaches the Saudi-context system prompt (the moat) and calls the model.
//
// Default provider is Gemini on Vertex AI pinned to a Middle-East region, so the
// (already minimized) health context is processed in-region (PDPL). Groq/Llama is
// available as an env-configured alternative for quick testing. Keys come from
// the environment only — never from the app, never committed to source.

type ChatRole = 'user' | 'assistant';
type ChatMsg = { role: ChatRole; content: string };
type MinSummary = {
  steps?: number;
  restingHeartRate?: number;
  hrvSdnn?: number;
  spo2?: number;
  sleepMinutes?: number;
  activeEnergyKcal?: number;
  distanceKm?: number;
};
type CoachBody = {
  messages?: ChatMsg[];
  summary?: MinSummary | null;
  water?: number;
  locale?: 'ar' | 'en';
  isRamadan?: boolean;
};

export const aiRouter = Router();

aiRouter.post('/coach', async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as CoachBody;
  const messages = Array.isArray(body.messages) ? body.messages.filter((m) => m?.content?.trim()) : [];
  if (!messages.length) return res.status(400).json({ error: 'no_messages' });

  const system = buildCoachPrompt({
    language: body.locale === 'en' ? 'en' : 'ar',
    healthSummary: summarize(body.summary, body.water),
    memory: '',
    isRamadan: !!body.isRamadan,
  });

  const provider = (process.env.AI_PROVIDER ?? 'vertex').toLowerCase();
  try {
    const reply =
      provider === 'groq' ? await callGroq(system, messages) : await callVertex(system, messages);
    if (reply == null) return res.status(503).json({ error: `${provider}_unconfigured` });
    return res.json({ reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'ai_error';
    return res.status(502).json({ error: 'ai_failed', detail: msg });
  }
});

function summarize(s: MinSummary | null | undefined, water?: number): string {
  if (!s) return 'no recent data available';
  const p: string[] = [];
  if (s.steps != null) p.push(`steps ${s.steps}`);
  if (s.restingHeartRate != null) p.push(`resting HR ${s.restingHeartRate} bpm`);
  if (s.hrvSdnn != null) p.push(`HRV ${s.hrvSdnn} ms`);
  if (s.spo2 != null) p.push(`SpO2 ${s.spo2}%`);
  if (s.sleepMinutes != null) p.push(`sleep ${Math.round((s.sleepMinutes / 60) * 10) / 10} h`);
  if (s.activeEnergyKcal != null) p.push(`active ${s.activeEnergyKcal} kcal`);
  if (s.distanceKm != null) p.push(`distance ${s.distanceKm} km`);
  if (water != null) p.push(`water ${water}/8 glasses`);
  return p.length ? p.join(', ') : 'no recent data available';
}

/** Gemini on Vertex AI, pinned to an in-region location. */
async function callVertex(system: string, messages: ChatMsg[]): Promise<string | null> {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) return null;
  const location = process.env.VERTEX_LOCATION ?? 'me-central1';
  const modelName = process.env.VERTEX_DEFAULT_MODEL ?? 'gemini-2.5-flash';

  // Lazy import so the service still boots if the SDK isn't installed yet.
  const { VertexAI } = await import('@google-cloud/vertexai');
  const vertex = new VertexAI({ project, location });
  const model = vertex.getGenerativeModel({ model: modelName, systemInstruction: system });

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  while (contents.length && contents[0].role === 'model') contents.shift(); // history must start with user

  const result = await model.generateContent({ contents });
  const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ?? '';
}

/** Groq (Llama) — env-configured alternative for quick testing. US-hosted. */
async function callGroq(system: string, messages: ChatMsg[]): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens: 320,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });
  if (!r.ok) throw new Error(`groq ${r.status}`);
  const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}
