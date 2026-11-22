import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import fs from 'node:fs';
import { db, initDatabase, formatUser, type DbUserRow } from './server/cinnoxDb.ts';
import {
  analyzeBackgroundRemoval,
  analyzePhotoEdit,
  extractAiError,
  generateAiBusinessNames,
  generateAiCode,
  generateAiImage,
  generateAiLogos,
  generateAiResume,
  generateAiSocialPost,
  generateAiStory,
  generateAiText,
  generateAiThumbnail,
  generateAiTranslation,
  generateAiVideoStoryboard,
  generateAiVoice,
  runAiChat,
} from './server/geminiTools.ts';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
const SESSION_COOKIE_NAME = 'cinnox_session';

app.set('trust proxy', 1);
app.use(express.json({ limit: '12mb' }));

interface AuthPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

interface AuthenticatedRequest extends Request {
  auth?: AuthPayload;
  authViaCookie?: boolean;
}

function parseCookies(req: Request): Record<string, string> {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      result[k] = decodeURIComponent(v);
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
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const { token, viaCookie } = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      req.auth = decoded;
      req.authViaCookie = viaCookie;
    } catch {
      req.auth = undefined;
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { token, viaCookie } = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  if (viaCookie && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !verifyMutationOrigin(req)) {
    res.status(403).json({ error: 'Origin verification failed' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const row = db
      .prepare(`SELECT id, email, role FROM users WHERE id = ?`)
      .get(decoded.userId) as { id: number; email: string; role: 'user' | 'admin' } | undefined;
    if (!row) {
      res.status(401).json({ error: 'Account not found' });
      return;
    }
    req.auth = { userId: row.id, email: row.email, role: row.role };
    req.authViaCookie = viaCookie;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

function signToken(user: { id: number; email: string; role: 'user' | 'admin' }): string {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '14d',
  });
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

function saveGeneration(
  userId: number | undefined,
  toolSlug: string,
  toolName: string,
  prompt: string,
  outputPreview: string,
  outputData: unknown
): number | null {
  if (!userId) return null;
  const serialized = JSON.stringify(outputData);
  const capped = serialized.length > 450000 ? JSON.stringify({ truncated: true, preview: outputPreview }) : serialized;
  const info = db
    .prepare(
      `INSERT INTO generations (user_id, tool_slug, tool_name, prompt, output_preview, output_data)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(userId, toolSlug, toolName, prompt.slice(0, 400), outputPreview.slice(0, 300), capped);
  return Number(info.lastInsertRowid);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cinnox-ai', toolsCount: 15 });
});

// Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (name.length < 2 || name.length > 50) {
    res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
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
      `INSERT INTO users (name, email, password_hash, role, avatar_url)
       VALUES (?, ?, ?, 'user', '/src/assets/images/avatar_creator_pro_1795255529768.jpg')`
    )
    .run(name, email, hash);

  const created = db
    .prepare(
      `SELECT id, name, email, role, avatar_url, favorite_tools, created_at FROM users WHERE id = ?`
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
      `SELECT id, name, email, password_hash, role, avatar_url, favorite_tools, created_at FROM users WHERE email = ?`
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
      `SELECT id, name, email, role, avatar_url, favorite_tools, created_at FROM users WHERE id = ?`
    )
    .get(req.auth!.userId) as DbUserRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  res.json({ user: formatUser(row) });
});

app.patch('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const name = String(req.body?.name || '').trim();
  if (name.length < 2 || name.length > 50) {
    res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
    return;
  }
  db.prepare(`UPDATE users SET name = ? WHERE id = ?`).run(name, req.auth!.userId);
  const updated = db
    .prepare(
      `SELECT id, name, email, role, avatar_url, favorite_tools, created_at FROM users WHERE id = ?`
    )
    .get(req.auth!.userId) as DbUserRow;
  res.json({ user: formatUser(updated) });
});

app.post('/api/auth/favorites', requireAuth, (req: AuthenticatedRequest, res) => {
  const slug = String(req.body?.toolSlug || '').trim();
  if (!slug) {
    res.status(400).json({ error: 'toolSlug is required' });
    return;
  }
  const row = db
    .prepare(`SELECT favorite_tools FROM users WHERE id = ?`)
    .get(req.auth!.userId) as { favorite_tools: string } | undefined;
  let favs: string[] = [];
  try {
    favs = JSON.parse(row?.favorite_tools || '[]');
  } catch {
    favs = [];
  }
  if (favs.includes(slug)) {
    favs = favs.filter((f) => f !== slug);
  } else {
    favs = [...favs, slug];
  }
  db.prepare(`UPDATE users SET favorite_tools = ? WHERE id = ?`).run(JSON.stringify(favs), req.auth!.userId);
  const updated = db
    .prepare(
      `SELECT id, name, email, role, avatar_url, favorite_tools, created_at FROM users WHERE id = ?`
    )
    .get(req.auth!.userId) as DbUserRow;
  res.json({ user: formatUser(updated) });
});

// User Dashboard Endpoints
app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.auth!.userId;
  const generations = db
    .prepare(
      `SELECT id, tool_slug, tool_name, prompt, output_preview, output_data, created_at
       FROM generations
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 40`
    )
    .all(userId) as Array<{
    id: number;
    tool_slug: string;
    tool_name: string;
    prompt: string;
    output_preview: string;
    output_data: string;
    created_at: string;
  }>;

  const toolUsage = db
    .prepare(
      `SELECT tool_slug, tool_name, COUNT(*) as count
       FROM generations
       WHERE user_id = ?
       GROUP BY tool_slug
       ORDER BY count DESC`
    )
    .all(userId) as Array<{ tool_slug: string; tool_name: string; count: number }>;

  const chatCount = db
    .prepare(`SELECT COUNT(*) as total FROM chat_messages WHERE user_id = ? AND role = 'user'`)
    .get(userId) as { total: number };

  res.json({
    stats: {
      totalGenerations: generations.length,
      toolsUsedCount: toolUsage.length,
      chatTurns: chatCount.total,
    },
    toolUsage: toolUsage.map((t) => ({ toolSlug: t.tool_slug, toolName: t.tool_name, count: t.count })),
    generations: generations.map((g) => ({
      id: g.id,
      toolSlug: g.tool_slug,
      toolName: g.tool_name,
      prompt: g.prompt,
      outputPreview: g.output_preview,
      outputData: g.output_data,
      createdAt: g.created_at,
    })),
  });
});

app.delete('/api/dashboard/generations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const info = db
    .prepare(`DELETE FROM generations WHERE id = ? AND user_id = ?`)
    .run(id, req.auth!.userId);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Generation not found' });
    return;
  }
  res.json({ deleted: true });
});

app.get('/api/ai/chat/history', optionalAuth, (req: AuthenticatedRequest, res) => {
  const sessionId = String(req.query.sessionId || 'default').slice(0, 64);
  if (!req.auth?.userId) {
    res.json({ messages: [] });
    return;
  }
  const rows = db
    .prepare(
      `SELECT id, role, content, persona, created_at
       FROM chat_messages
       WHERE user_id = ? AND session_id = ?
       ORDER BY id ASC
       LIMIT 50`
    )
    .all(req.auth.userId, sessionId) as Array<{
    id: number;
    role: 'user' | 'model';
    content: string;
    persona: string;
    created_at: string;
  }>;
  res.json({ messages: rows });
});

// 15 Real AI Tool Routes
app.post('/api/ai/image-generate', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    const style = String(req.body?.style || 'Digital Illustration').trim();
    const aspectRatio = String(req.body?.aspectRatio || '1:1').trim();
    if (prompt.length < 3) {
      res.status(400).json({ error: 'Please describe the image you want to create.' });
      return;
    }
    const result = await generateAiImage({ prompt, style, aspectRatio });
    saveGeneration(req.auth?.userId, 'image-generator', 'AI Image Generator', prompt, result.title, result);
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/logo-make', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const brandName = String(req.body?.brandName || '').trim();
    const tagline = String(req.body?.tagline || '').trim();
    const industry = String(req.body?.industry || 'Technology').trim();
    const style = String(req.body?.style || 'Minimalist Geometric').trim();
    const colorMood = String(req.body?.colorMood || 'Purple & Electric Blue').trim();
    if (brandName.length < 2) {
      res.status(400).json({ error: 'Please enter a brand name.' });
      return;
    }
    const result = await generateAiLogos({ brandName, tagline, industry, style, colorMood });
    saveGeneration(
      req.auth?.userId,
      'logo-maker',
      'AI Logo Maker',
      `${brandName} (${industry})`,
      `${result.concepts.length} Logo Concepts`,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/text-generate', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    const format = String(req.body?.format || 'Blog Article').trim();
    const tone = String(req.body?.tone || 'Professional').trim();
    const length = String(req.body?.length || 'Medium (~400 words)').trim();
    if (prompt.length < 3) {
      res.status(400).json({ error: 'Please enter a topic or brief.' });
      return;
    }
    const result = await generateAiText({ prompt, format, tone, length });
    saveGeneration(
      req.auth?.userId,
      'text-generator',
      'AI Text Generator',
      prompt,
      result.text.slice(0, 140),
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/story-write', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const premise = String(req.body?.premise || '').trim();
    const genre = String(req.body?.genre || 'Sci-Fi').trim();
    const tone = String(req.body?.tone || 'Atmospheric').trim();
    const characters = String(req.body?.characters || '').trim();
    const previousStory = req.body?.previousStory ? String(req.body.previousStory).slice(0, 8000) : undefined;
    if (premise.length < 3) {
      res.status(400).json({ error: 'Please enter a story premise or next direction.' });
      return;
    }
    const result = await generateAiStory({ premise, genre, tone, characters, previousStory });
    saveGeneration(
      req.auth?.userId,
      'story-writer',
      'AI Story Writer',
      premise,
      result.title,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/photo-edit', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const imageBase64 = String(req.body?.imageBase64 || '').trim();
    const mimeType = String(req.body?.mimeType || 'image/jpeg').trim();
    const instruction = String(req.body?.instruction || '').trim();
    if (!imageBase64 || instruction.length < 2) {
      res.status(400).json({ error: 'Please upload a photo and enter an editing instruction.' });
      return;
    }
    const result = await analyzePhotoEdit({ imageBase64, mimeType, instruction });
    saveGeneration(
      req.auth?.userId,
      'photo-editor',
      'AI Photo Editor',
      instruction,
      result.presetTitle,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/background-remove', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const imageBase64 = String(req.body?.imageBase64 || '').trim();
    const mimeType = String(req.body?.mimeType || 'image/jpeg').trim();
    if (!imageBase64) {
      res.status(400).json({ error: 'Please upload a photo to remove its background.' });
      return;
    }
    const result = await analyzeBackgroundRemoval({ imageBase64, mimeType });
    saveGeneration(
      req.auth?.userId,
      'background-remover',
      'AI Background Remover',
      result.subjectLabel,
      `${result.subjectLabel} (${result.strategy})`,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/video-generate', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    const aspectRatio = String(req.body?.aspectRatio || '16:9').trim();
    const mood = String(req.body?.mood || 'Cinematic').trim();
    if (prompt.length < 3) {
      res.status(400).json({ error: 'Please describe the video scenes you want to create.' });
      return;
    }
    const result = await generateAiVideoStoryboard({ prompt, aspectRatio, mood });
    saveGeneration(
      req.auth?.userId,
      'video-generator',
      'AI Video Generator',
      prompt,
      `${result.title} (${result.scenes.length} scenes)`,
      { title: result.title, narrativeSummary: result.narrativeSummary }
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/voice-generate', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    const voiceName = String(req.body?.voiceName || 'Kore').trim();
    const style = String(req.body?.style || 'Natural studio narrator').trim();
    if (text.length < 2 || text.length > 2000) {
      res.status(400).json({ error: 'Please enter between 2 and 2,000 characters to synthesize.' });
      return;
    }
    const result = await generateAiVoice({ text, voiceName, style });
    saveGeneration(
      req.auth?.userId,
      'voice-generator',
      'AI Voice Generator',
      text.slice(0, 120),
      `Voice: ${result.voiceName} (${style})`,
      { voiceName: result.voiceName, style, textPreview: text.slice(0, 200) }
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/code-generate', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    const language = String(req.body?.language || 'TypeScript').trim();
    const includeTests = Boolean(req.body?.includeTests);
    if (prompt.length < 3) {
      res.status(400).json({ error: 'Please describe the code or function you want generated.' });
      return;
    }
    const result = await generateAiCode({ prompt, language, includeTests });
    saveGeneration(
      req.auth?.userId,
      'code-generator',
      'AI Code Generator',
      prompt,
      `${result.filename} (${result.language})`,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/chat', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    const persona = String(req.body?.persona || 'general').trim();
    const sessionId = String(req.body?.sessionId || 'default').slice(0, 64);
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    if (!message) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }
    const result = await runAiChat({ message, persona, history });
    if (req.auth?.userId) {
      const stmt = db.prepare(
        `INSERT INTO chat_messages (user_id, session_id, role, content, persona) VALUES (?, ?, ?, ?, ?)`
      );
      stmt.run(req.auth.userId, sessionId, 'user', message, persona);
      stmt.run(req.auth.userId, sessionId, 'model', result.reply, persona);
    }
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/resume-build', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const fullName = String(req.body?.fullName || '').trim();
    const email = String(req.body?.email || '').trim();
    const location = String(req.body?.location || '').trim();
    const targetRole = String(req.body?.targetRole || '').trim();
    const experienceYears = String(req.body?.experienceYears || '3+ years').trim();
    const skills = String(req.body?.skills || '').trim();
    const backgroundSummary = String(req.body?.backgroundSummary || '').trim();
    if (!fullName || !targetRole) {
      res.status(400).json({ error: 'Full name and target role are required.' });
      return;
    }
    const result = await generateAiResume({
      fullName,
      email,
      location,
      targetRole,
      experienceYears,
      skills,
      backgroundSummary,
    });
    saveGeneration(
      req.auth?.userId,
      'resume-builder',
      'AI Resume Builder',
      `${fullName} – ${targetRole}`,
      result.headline,
      result
    );
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
    const targetLanguage = String(req.body?.targetLanguage || 'Spanish').trim();
    const formality = String(req.body?.formality || 'Natural').trim();
    if (!text) {
      res.status(400).json({ error: 'Please enter text to translate.' });
      return;
    }
    const result = await generateAiTranslation({ text, sourceLanguage, targetLanguage, formality });
    saveGeneration(
      req.auth?.userId,
      'translator',
      'AI Translator',
      `${sourceLanguage} → ${targetLanguage}: ${text.slice(0, 80)}`,
      result.translatedText.slice(0, 140),
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/thumbnail-make', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const videoTitle = String(req.body?.videoTitle || '').trim();
    const niche = String(req.body?.niche || 'Tech & AI').trim();
    const visualTheme = String(req.body?.visualTheme || 'Purple Blue High Contrast').trim();
    const badgeText = String(req.body?.badgeText || 'NEW').trim();
    if (videoTitle.length < 3) {
      res.status(400).json({ error: 'Please enter a video title or concept.' });
      return;
    }
    const result = await generateAiThumbnail({ videoTitle, niche, visualTheme, badgeText });
    saveGeneration(
      req.auth?.userId,
      'thumbnail-maker',
      'AI Thumbnail Maker',
      videoTitle,
      result.hookHeadline,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/business-names', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const description = String(req.body?.description || '').trim();
    const industry = String(req.body?.industry || 'Software & AI').trim();
    const style = String(req.body?.style || 'Modern & Brandable').trim();
    const keywords = String(req.body?.keywords || '').trim();
    if (description.length < 3) {
      res.status(400).json({ error: 'Please describe your business idea.' });
      return;
    }
    const result = await generateAiBusinessNames({ description, industry, style, keywords });
    saveGeneration(
      req.auth?.userId,
      'business-name-generator',
      'AI Business Name Generator',
      description,
      result.names.map((n) => n.brandName).slice(0, 4).join(', '),
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

app.post('/api/ai/social-post', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const topic = String(req.body?.topic || '').trim();
    const platform = String(req.body?.platform || 'Instagram').trim();
    const tone = String(req.body?.tone || 'Engaging').trim();
    const goal = String(req.body?.goal || 'Engagement & Shares').trim();
    if (topic.length < 3) {
      res.status(400).json({ error: 'Please describe your post topic.' });
      return;
    }
    const result = await generateAiSocialPost({ topic, platform, tone, goal });
    saveGeneration(
      req.auth?.userId,
      'social-media-post-generator',
      'AI Social Media Post Generator',
      `${platform}: ${topic.slice(0, 80)}`,
      result.hook,
      result
    );
    res.json(result);
  } catch (err) {
    const e = extractAiError(err);
    res.status(e.status).json({ error: e.message });
  }
});

// AdSense & Affiliate Telemetry + Contact
app.post('/api/ads/event', (req, res) => {
  const slotId = String(req.body?.slotId || 'banner').slice(0, 64);
  const eventType = req.body?.eventType === 'click' ? 'click' : 'impression';
  const pagePath = String(req.body?.pagePath || '/').slice(0, 120);
  db.prepare(`INSERT INTO ad_events (slot_id, event_type, page_path) VALUES (?, ?, ?)`).run(
    slotId,
    eventType,
    pagePath
  );
  res.status(201).json({ recorded: true });
});

app.post('/api/affiliates/click', (req, res) => {
  const partnerSlug = String(req.body?.partnerSlug || '').slice(0, 64);
  const partnerName = String(req.body?.partnerName || '').slice(0, 100);
  if (!partnerSlug) {
    res.status(400).json({ error: 'partnerSlug is required' });
    return;
  }
  db.prepare(`INSERT INTO affiliate_clicks (partner_slug, partner_name) VALUES (?, ?)`).run(
    partnerSlug,
    partnerName
  );
  res.status(201).json({ recorded: true });
});

app.post('/api/contact', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();

  if (name.length < 2) {
    res.status(400).json({ error: 'Please enter your name.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (subject.length < 2 || message.length < 10) {
    res.status(400).json({ error: 'Please include a subject and at least 10 characters in your message.' });
    return;
  }

  db.prepare(
    `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`
  ).run(name.slice(0, 80), email.slice(0, 120), subject.slice(0, 140), message.slice(0, 3000));

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

const TOOL_SLUGS = [
  'image-generator',
  'logo-maker',
  'text-generator',
  'story-writer',
  'photo-editor',
  'background-remover',
  'video-generator',
  'voice-generator',
  'code-generator',
  'chatbot',
  'resume-builder',
  'translator',
  'thumbnail-maker',
  'business-name-generator',
  'social-media-post-generator',
];

app.get('/robots.txt', (req, res) => {
  const baseUrl = resolveBaseUrl(req);
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = resolveBaseUrl(req);
  const routes = [
    '/',
    ...TOOL_SLUGS.map((s) => `/tools/${s}`),
    '/privacy',
    '/terms',
    '/contact',
  ];
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
    console.log(`Cinnox server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
