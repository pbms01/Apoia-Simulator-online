import { Router } from 'express';
import type { ProviderName } from '../../../src/config/models.js';

const router = Router();

// POST /api/config/check-keys - Check which providers are configured with given keys
router.post('/check-keys', (req, res) => {
  const keys = req.body as Partial<Record<ProviderName, string>>;
  const configured: ProviderName[] = [];

  for (const [provider, key] of Object.entries(keys)) {
    if (key && typeof key === 'string' && key.trim().length > 0) {
      configured.push(provider as ProviderName);
    }
  }

  // Also check env vars
  if (process.env.OPENAI_API_KEY && !configured.includes('openai')) configured.push('openai');
  if (process.env.ANTHROPIC_API_KEY && !configured.includes('anthropic')) configured.push('anthropic');
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY && !configured.includes('google')) configured.push('google');

  res.json({ configured });
});

// GET /api/config/server-keys - Check which providers have server-side env vars
router.get('/server-keys', (_req, res) => {
  const serverConfigured: ProviderName[] = [];
  if (process.env.OPENAI_API_KEY) serverConfigured.push('openai');
  if (process.env.ANTHROPIC_API_KEY) serverConfigured.push('anthropic');
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) serverConfigured.push('google');
  res.json({ configured: serverConfigured });
});

export default router;
