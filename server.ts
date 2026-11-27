import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, formatUser, initDatabase, type DbUserRow } from './server/helpworldDb.ts';
import {
  analyzeUploadedImage,
  extractAiError,
  generateStructuredHelp,
  generateTranslation,
  synthesizeSpeechWav,
  transcribeAudioClip,
} from './server/helpworldAi.ts';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
const SESSION_COOKIE_NAME = 'helpworld_session';

app.set('trust proxy', 1);
app.use(express.json({ limit: '16mb' }));

interface AuthPayload {
  userId: number;
  email: string;
}

interface AuthenticatedRequest extends Request {
  auth?: AuthPayload;
}

function parseCookies(req: Request): Record<string, string> {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      result[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return result;
}

function extractToken(req: Request): { token: string | null; viaCookie: boolean } {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return { token: header.slice(7).trim(), viaCookie: false };
  }
  const cookies = parseCookies(req);
  if (cookies[SESSION_COOKIE_NAME]) {
    return { token: cookies[SESSION_COOKIE_NAME], viaCookie: true };
  }
  return { token: null, viaCookie: false };
}

function verifyMutationOrigin(req: Request): boolean {
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') return true;
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const { token } = extractToken(req);
  if (token) {
    try {
      req.auth = jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      req.auth = undefined;
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { token, viaCookie } = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Please sign in to access your personal dashboard.' });
    return;
  }
  if (viaCookie && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !verifyMutationOrigin(req)) {
    res.status(403).json({ error: 'Origin verification failed.' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const row = db.prepare(`SELECT id, email FROM users WHERE id = ?`).get(decoded.userId) as
      | { id: number; email: string }
      | undefined;
    if (!row) {
      res.status(401).json({ error: 'Account not found.' });
      return;
    }
    req.auth = { userId: row.id, email: row.email };
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

function signToken(user: { id: number; email: string }): string {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '14d' });
}

function setSessionCookie(res: Response, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=1209600`
  );
}

function clearSessionCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`
  );
}

function saveHelpSession(
  userId: number | undefined,
  hubSlug: string,
  hubName: string,
  language: string,
  prompt: string,
  preview: string,
  data: unknown
): void {
  if (!userId) return;
  const serialized = JSON.stringify(data);
  const capped = serialized.length > 350000 ? JSON.stringify({ preview }) : serialized;
  db.prepare(
    `INSERT INTO help_sessions (user_id, hub_slug, hub_name, language, prompt, response_preview, response_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, hubSlug, hubName, language, prompt.slice(0, 350), preview.slice(0, 260), capped);
}

const EMERGENCY_DIRECTORY = [
  {
    country: 'India',
    code: 'IN',
    unified: '112',
    police: '100',
    ambulance: '108',
    fire: '101',
    helplines: 'Women: 1091 · Child: 1098 · Mental Health (Tele-MANAS): 14416',
  },
  {
    country: 'United States & Canada',
    code: 'US',
    unified: '911',
    police: '911',
    ambulance: '911',
    fire: '911',
    helplines: 'Suicide & Crisis Lifeline: 988 · Poison Control: 1-800-222-1222',
  },
  {
    country: 'United Kingdom',
    code: 'UK',
    unified: '999',
    police: '999',
    ambulance: '999',
    fire: '999',
    helplines: 'NHS Non-Emergency Medical: 111 · Police Non-Emergency: 101',
  },
  {
    country: 'European Union (All Member States)',
    code: 'EU',
    unified: '112',
    police: '112',
    ambulance: '112',
    fire: '112',
    helplines: 'Works free from any mobile or landline across all 27 EU nations',
  },
  {
    country: 'Australia',
    code: 'AU',
    unified: '000',
    police: '000',
    ambulance: '000',
    fire: '000',
    helplines: 'Lifeline Crisis Support: 13 11 14 · Healthdirect: 1800 022 222',
  },
  {
    country: 'United Arab Emirates',
    code: 'AE',
    unified: '999',
    police: '999',
    ambulance: '998',
    fire: '997',
    helplines: 'Electricity/Water Emergency: 991 · Coast Guard: 996',
  },
];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'helpworld-ai', modules: 14 });
});

app.get('/api/emergency/directory', (_req, res) => {
  res.json({ directory: EMERGENCY_DIRECTORY });
});

// Authentication & Privacy Management Routes
app.post('/api/auth/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const preferredLanguage = String(req.body?.preferredLanguage || 'English').trim();

  if (name.length < 2 || name.length > 60) {
    res.status(400).json({ error: 'Name must be between 2 and 60 characters.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, preferred_language)
       VALUES (?, ?, ?, ?)`
    )
    .run(name, email, hash, preferredLanguage.slice(0, 40));

  const created = db
    .prepare(
      `SELECT id, name, email, preferred_language, tts_voice, is_plus, favorite_hubs, accessibility_json, avatar_url, created_at
       FROM users WHERE id = ?`
    )
    .get(info.lastInsertRowid) as DbUserRow;

  const token = signToken(created);
  setSessionCookie(res, token);
  res.status(201).json({ token, user: formatUser(created) });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const row = db
    .prepare(
      `SELECT id, name, email, password_hash, preferred_language, tts_voice, is_plus, favorite_hubs, accessibility_json, avatar_url, created_at
       FROM users WHERE email = ?`
    )
    .get(email) as DbUserRow | undefined;

  if (!row || !row.password_hash || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = signToken(row);
  setSessionCookie(res, token);
  res.json({ token, user: formatUser(row) });
});

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ loggedOut: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const row = db
    .prepare(
      `SELECT id, name, email, preferred_language, tts_voice, is_plus, favorite_hubs, accessibility_json, avatar_url, created_at
       FROM users WHERE id = ?`
    )
    .get(req.auth!.userId) as DbUserRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }
  res.json({ user: formatUser(row) });
});

app.patch('/api/auth/preferences', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.auth!.userId;
  const current = db
    .prepare(
      `SELECT name, preferred_language, tts_voice, accessibility_json FROM users WHERE id = ?`
    )
    .get(userId) as DbUserRow | undefined;

  if (!current) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  const name = req.body?.name ? String(req.body.name).trim().slice(0, 60) : current.name;
  const preferredLanguage = req.body?.preferredLanguage
    ? String(req.body.preferredLanguage).trim().slice(0, 40)
    : current.preferred_language;
  const ttsVoice = req.body?.ttsVoice ? String(req.body.ttsVoice).trim().slice(0, 20) : current.tts_voice;
  const accessibilityJson = req.body?.accessibility
    ? JSON.stringify(req.body.accessibility)
    : current.accessibility_json;

  db.prepare(
    `UPDATE users SET name = ?, preferred_language = ?, tts_voice = ?, accessibility_json = ? WHERE id = ?`
  ).run(name, preferredLanguage, ttsVoice, accessibilityJson, userId);

  const updated = db
    .prepare(
      `SELECT id, name, email, preferred_language, tts_voice, is_plus, favorite_hubs, accessibility_json, avatar_url, created_at
       FROM users WHERE id = ?`
    )
    .get(userId) as DbUserRow;

  res.json({ user: formatUser(updated) });
});

app.post('/api/auth/favorites', requireAuth, (req: AuthenticatedRequest, res) => {
  const slug = String(req.body?.hubSlug || '').trim();
  if (!slug) {
    res.status(400).json({ error: 'hubSlug is required.' });
    return;
  }
  const row = db
    .prepare(`SELECT favorite_hubs FROM users WHERE id = ?`)
    .get(req.auth!.userId) as { favorite_hubs: string } | undefined;

  let favs: string[] = [];
  try {
    favs = JSON.parse(row?.favorite_hubs || '[]');
  } catch {
    favs = [];
  }
  favs = favs.includes(slug) ? favs.filter((f) => f !== slug) : [...favs, slug];

  db.prepare(`UPDATE users SET favorite_hubs = ? WHERE id = ?`).run(
    JSON.stringify(favs),
    req.auth!.userId
  );

  const updated = db
    .prepare(
      `SELECT id, name, email, preferred_language, tts_voice, is_plus, favorite_hubs, accessibility_json, avatar_url, created_at
       FROM users WHERE id = ?`
    )
    .get(req.auth!.userId) as DbUserRow;

  res.json({ user: formatUser(updated) });
});

app.post('/api/auth/plus', requireAuth, (req: AuthenticatedRequest, res) => {
  const enable = Boolean(req.body?.enable);
  db.prepare(`UPDATE users SET is_plus = ? WHERE id = ?`).run(enable ? 1 : 0, req.auth!.userId);
  const updated = db
    .prepare(
      `SELECT id, name, email, preferred_language, tts_voice, is_plus, favorite_hubs, accessibility_json, avatar_url, created_at
       FROM users WHERE id = ?`
    )
    .get(req.auth!.userId) as DbUserRow;

  res.json({ user: formatUser(updated) });
});

// Privacy & Data Protection: Clear all saved user history or delete account
app.delete('/api/auth/history', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare(`DELETE FROM help_sessions WHERE user_id = ?`).run(req.auth!.userId);
  db.prepare(`DELETE FROM chat_history WHERE user_id = ?`).run(req.auth!.userId);
  res.json({ cleared: true });
});

app.delete('/api/auth/account', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare(`DELETE FROM users WHERE id = ?`).run(req.auth!.userId);
  clearSessionCookie(res);
  res.json({ deleted: true });
});

// Personalised Dashboard
app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.auth!.userId;
  const sessions = db
    .prepare(
      `SELECT id, hub_slug, hub_name, language, prompt, response_preview, created_at
       FROM help_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 40`
    )
    .all(userId) as Array<{
    id: number;
    hub_slug: string;
    hub_name: string;
    language: string;
    prompt: string;
    response_preview: string;
    created_at: string;
  }>;

  const usage = db
    .prepare(
      `SELECT hub_slug, hub_name, COUNT(*) as count
       FROM help_sessions WHERE user_id = ? GROUP BY hub_slug ORDER BY count DESC`
    )
    .all(userId) as Array<{ hub_slug: string; hub_name: string; count: number }>;

  res.json({
    stats: {
      totalAnswers: sessions.length,
      hubsUsed: usage.length,
    },
    usage: usage.map((u) => ({ hubSlug: u.hub_slug, hubName: u.hub_name, count: u.count })),
    sessions: sessions.map((s) => ({
      id: s.id,
      hubSlug: s.hub_slug,
      hubName: s.hub_name,
      language: s.language,
      prompt: s.prompt,
      responsePreview: s.response_preview,
      createdAt: s.created_at,
    })),
  });
});

app.delete('/api/dashboard/sessions/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const info = db
    .prepare(`DELETE FROM help_sessions WHERE id = ? AND user_id = ?`)
    .run(Number(req.params.id), req.auth!.userId);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Saved item not found.' });
    return;
  }
  res.json({ deleted: true });
});

// Unified AI Assistance Route (Covers Assistant, Student, Jobs, Business, Health, Money, Legal, Tech, Emergency, Daily Life)
app.post('/api/ai/assist', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const hubSlug = String(req.body?.hubSlug || 'assistant').trim();
    const hubName = String(req.body?.hubName || 'AI Personal Assistant').trim();
    const prompt = String(req.body?.prompt || '').trim();
    const language = String(req.body?.language || 'English').trim();
    const context = req.body?.context ? String(req.body.context).trim() : undefined;
    const history = Array.isArray(req.body?.history) ? req.body.history : undefined;

    if (prompt.length < 2) {
      res.status(400).json({ error: 'Please type or speak your question first.' });
      return;
    }

    const result = await generateStructuredHelp({
      hubSlug,
      prompt,
      language,
      context,
      history,
    });

    saveHelpSession(req.auth?.userId, hubSlug, hubName, language, prompt, result.answer, result);

    if (req.auth?.userId && (hubSlug === 'assistant' || hubSlug === 'voice')) {
      const stmt = db.prepare(
        `INSERT INTO chat_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)`
      );
      stmt.run(req.auth.userId, hubSlug, 'user', prompt.slice(0, 1500));
      stmt.run(req.auth.userId, hubSlug, 'model', result.answer.slice(0, 3000));
    }

    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/translate', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    const sourceLanguage = String(req.body?.sourceLanguage || 'Auto Detect').trim();
    const targetLanguage = String(req.body?.targetLanguage || 'Hindi').trim();
    const tone = String(req.body?.tone || 'Natural everyday').trim();

    if (!text) {
      res.status(400).json({ error: 'Please enter text to translate.' });
      return;
    }

    const result = await generateTranslation({ text, sourceLanguage, targetLanguage, tone });
    saveHelpSession(
      req.auth?.userId,
      'translate',
      'Translation',
      targetLanguage,
      `${sourceLanguage} → ${targetLanguage}: ${text}`,
      result.translatedText,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/image-analyze', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const imageBase64 = String(req.body?.imageBase64 || '').trim();
    const mimeType = String(req.body?.mimeType || 'image/jpeg').trim();
    const question = String(req.body?.question || '').trim();
    const language = String(req.body?.language || 'English').trim();

    if (!imageBase64) {
      res.status(400).json({ error: 'Please upload or capture an image first.' });
      return;
    }

    const result = await analyzeUploadedImage({ imageBase64, mimeType, question, language });
    saveHelpSession(
      req.auth?.userId,
      'image',
      'Image AI',
      language,
      question || 'Uploaded image question',
      result.summary,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/voice-transcribe', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const audioBase64 = String(req.body?.audioBase64 || '').trim();
    const mimeType = String(req.body?.mimeType || 'audio/webm').trim();
    const language = String(req.body?.language || 'English').trim();

    if (!audioBase64) {
      res.status(400).json({ error: 'Please record voice audio first.' });
      return;
    }

    const result = await transcribeAudioClip({ audioBase64, mimeType, language });
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/tts', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    const voiceName = String(req.body?.voiceName || 'Kore').trim();
    const style = req.body?.style ? String(req.body.style).trim() : undefined;

    if (!text) {
      res.status(400).json({ error: 'Text is required for speech output.' });
      return;
    }

    const result = await synthesizeSpeechWav({ text, voiceName, style });
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

// AdMob Placement Telemetry & Contact Support
app.post('/api/ads/event', (req, res) => {
  const placementId = String(req.body?.placementId || 'banner').slice(0, 64);
  const eventType = req.body?.eventType === 'click' ? 'click' : 'impression';
  const pagePath = String(req.body?.pagePath || '/').slice(0, 120);
  db.prepare(`INSERT INTO ad_events (placement_id, event_type, page_path) VALUES (?, ?, ?)`).run(
    placementId,
    eventType,
    pagePath
  );
  res.status(201).json({ recorded: true });
});

app.post('/api/contact', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const topic = String(req.body?.topic || 'General Support').trim();
  const message = String(req.body?.message || '').trim();

  if (name.length < 2) {
    res.status(400).json({ error: 'Please enter your name.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (message.length < 10) {
    res.status(400).json({ error: 'Please enter at least 10 characters in your message.' });
    return;
  }

  db.prepare(`INSERT INTO contact_messages (name, email, topic, message) VALUES (?, ?, ?, ?)`).run(
    name.slice(0, 80),
    email.slice(0, 120),
    topic.slice(0, 100),
    message.slice(0, 3000)
  );
  res.status(201).json({ submitted: true });
});

// SEO Helpers
function resolveBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

const HUB_SLUGS = [
  'assistant',
  'student',
  'jobs',
  'business',
  'health',
  'translate',
  'money',
  'legal',
  'tech',
  'emergency',
  'daily',
  'voice',
  'image',
  'languages',
];

app.get('/robots.txt', (req, res) => {
  const baseUrl = resolveBaseUrl(req);
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = resolveBaseUrl(req);
  const routes = ['/', ...HUB_SLUGS.map((s) => `/hub/${s}`), '/plus', '/privacy', '/terms', '/contact'];
  const urls = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${baseUrl}${r}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${r === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
    )
    .join('\n');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

async function startServer() {
  const server = http.createServer(app);
  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distDir, 'index.html');
  const isTsxRuntime = process.execArgv.some((arg) => arg.includes('tsx'));
  const useProductionBuild =
    process.env.NODE_ENV === 'production' || (!isTsxRuntime && fs.existsSync(distIndex));

  if (!useProductionBuild) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      if (!fs.existsSync(distIndex)) {
        res.status(503).send('Build output missing. Run "npm run build" before starting the server.');
        return;
      }
      res.sendFile(distIndex);
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`HelpWorld AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
