import express from 'express';
import { DISHES } from './saudi-context/dishes';
import { googleHealthRouter } from './google-health';
import { aiRouter } from './ai';

// In-region (Doha/Dammam) Node service. Holds provider keys, the Google Health
// OAuth token exchange, the Saudi-context layer, data minimization, and the
// AI proxy to Vertex AI. Real routes land in Phases 2-4.
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'nabdh-backend', dishes: DISHES.length });
});

// Phase 2: Google Health API OAuth token exchange + in-region sync (Fitbit Air).
app.use('/google-health', googleHealthRouter);
// Phase 3: AI coach proxy — Saudi-context system prompt + in-region Vertex Gemini.
app.use('/ai', aiRouter);
// Phase 4: app.use('/nutrition', nutritionRouter)

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Nabdh backend listening on :${port}`);
});

export default app;
