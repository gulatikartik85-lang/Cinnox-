export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl: string;
  favoriteTools: string[];
  createdAt: string;
}

export interface GenerationRecord {
  id: number;
  toolSlug: string;
  toolName: string;
  prompt: string;
  outputPreview: string;
  outputData: string;
  createdAt: string;
}

export interface DashboardData {
  stats: {
    totalGenerations: number;
    toolsUsedCount: number;
    chatTurns: number;
  };
  toolUsage: Array<{ toolSlug: string; toolName: string; count: number }>;
  generations: GenerationRecord[];
}

// Held strictly in JS memory; reload persistence relies on HttpOnly Partitioned cookie
let memoryToken: string | null = null;

export function setMemoryAuthToken(token: string | null): void {
  memoryToken = token;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (memoryToken) {
    headers.Authorization = `Bearer ${memoryToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const cinnoxApi = {
  // Auth
  async register(payload: { name: string; email: string; password: string }) {
    const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setMemoryAuthToken(res.token);
    return res;
  },

  async login(payload: { email: string; password: string }) {
    const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setMemoryAuthToken(res.token);
    return res;
  },

  async logout() {
    setMemoryAuthToken(null);
    return apiFetch<{ loggedOut: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  async getMe() {
    return apiFetch<{ user: UserProfile }>('/api/auth/me');
  },

  async updateProfile(name: string) {
    return apiFetch<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async toggleFavorite(toolSlug: string) {
    return apiFetch<{ user: UserProfile }>('/api/auth/favorites', {
      method: 'POST',
      body: JSON.stringify({ toolSlug }),
    });
  },

  // Dashboard
  async getDashboard() {
    return apiFetch<DashboardData>('/api/dashboard');
  },

  async deleteGeneration(id: number) {
    return apiFetch<{ deleted: boolean }>(`/api/dashboard/generations/${id}`, { method: 'DELETE' });
  },

  async getChatHistory(sessionId: string) {
    return apiFetch<{
      messages: Array<{ id: number; role: 'user' | 'model'; content: string; persona: string }>;
    }>(`/api/ai/chat/history?sessionId=${encodeURIComponent(sessionId)}`);
  },

  // 15 Real AI Tool Endpoints
  generateImage(payload: { prompt: string; style: string; aspectRatio: string }) {
    return apiFetch<{
      title: string;
      enhancedPrompt: string;
      palette: string[];
      compositionNotes: string;
      svg: string;
    }>('/api/ai/image-generate', { method: 'POST', body: JSON.stringify(payload) });
  },

  makeLogos(payload: {
    brandName: string;
    tagline: string;
    industry: string;
    style: string;
    colorMood: string;
  }) {
    return apiFetch<{
      concepts: Array<{
        conceptName: string;
        styleTag: string;
        rationale: string;
        palette: string[];
        fontPairing: string;
        svg: string;
      }>;
    }>('/api/ai/logo-make', { method: 'POST', body: JSON.stringify(payload) });
  },

  generateText(payload: { prompt: string; format: string; tone: string; length: string }) {
    return apiFetch<{ text: string }>('/api/ai/text-generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  writeStory(payload: {
    premise: string;
    genre: string;
    tone: string;
    characters: string;
    previousStory?: string;
  }) {
    return apiFetch<{
      title: string;
      chapterHeading: string;
      storyText: string;
      writingNote: string;
    }>('/api/ai/story-write', { method: 'POST', body: JSON.stringify(payload) });
  },

  editPhoto(payload: { imageBase64: string; mimeType: string; instruction: string }) {
    return apiFetch<{
      presetTitle: string;
      critique: string;
      brightness: number;
      contrast: number;
      saturate: number;
      hueRotate: number;
      sepia: number;
      blur: number;
      vignette: number;
      tintHex: string;
      tintOpacity: number;
    }>('/api/ai/photo-edit', { method: 'POST', body: JSON.stringify(payload) });
  },

  analyzeBackgroundRemove(payload: { imageBase64: string; mimeType: string }) {
    return apiFetch<{
      subjectLabel: string;
      backgroundDescription: string;
      strategy: string;
      bgRed: number;
      bgGreen: number;
      bgBlue: number;
      recommendedTolerance: number;
      edgeFeather: number;
      confidenceNote: string;
    }>('/api/ai/background-remove', { method: 'POST', body: JSON.stringify(payload) });
  },

  generateVideoStoryboard(payload: { prompt: string; aspectRatio: string; mood: string }) {
    return apiFetch<{
      title: string;
      narrativeSummary: string;
      scenes: Array<{
        sceneNumber: number;
        durationSec: number;
        caption: string;
        cameraMotion: string;
        accentColor: string;
        svgScene: string;
      }>;
    }>('/api/ai/video-generate', { method: 'POST', body: JSON.stringify(payload) });
  },

  generateVoice(payload: { text: string; voiceName: string; style: string }) {
    return apiFetch<{ audioBase64: string; mimeType: string; voiceName: string }>(
      '/api/ai/voice-generate',
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },

  generateCode(payload: { prompt: string; language: string; includeTests: boolean }) {
    return apiFetch<{
      filename: string;
      language: string;
      code: string;
      explanation: string;
      complexityNote: string;
    }>('/api/ai/code-generate', { method: 'POST', body: JSON.stringify(payload) });
  },

  sendChat(payload: {
    message: string;
    persona: string;
    sessionId: string;
    history: Array<{ role: 'user' | 'model'; content: string }>;
  }) {
    return apiFetch<{ reply: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  buildResume(payload: {
    fullName: string;
    email: string;
    location: string;
    targetRole: string;
    experienceYears: string;
    skills: string;
    backgroundSummary: string;
  }) {
    return apiFetch<{
      fullName: string;
      headline: string;
      contactLine: string;
      summary: string;
      skills: string[];
      experience: Array<{ role: string; company: string; period: string; bullets: string[] }>;
      education: Array<{ degree: string; institution: string; year: string }>;
      atsTips: string[];
    }>('/api/ai/resume-build', { method: 'POST', body: JSON.stringify(payload) });
  },

  translateText(payload: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    formality: string;
  }) {
    return apiFetch<{
      detectedSourceLanguage: string;
      translatedText: string;
      transliteration: string;
      alternativePhrasing: string;
      culturalNote: string;
    }>('/api/ai/translate', { method: 'POST', body: JSON.stringify(payload) });
  },

  makeThumbnail(payload: {
    videoTitle: string;
    niche: string;
    visualTheme: string;
    badgeText: string;
  }) {
    return apiFetch<{
      hookHeadline: string;
      subBadge: string;
      accentColor: string;
      textColor: string;
      ctrAnalysis: string;
      svgBackdrop: string;
    }>('/api/ai/thumbnail-make', { method: 'POST', body: JSON.stringify(payload) });
  },

  generateBusinessNames(payload: {
    description: string;
    industry: string;
    style: string;
    keywords: string;
  }) {
    return apiFetch<{
      names: Array<{
        brandName: string;
        tagline: string;
        domainIdea: string;
        category: string;
        rationale: string;
      }>;
    }>('/api/ai/business-names', { method: 'POST', body: JSON.stringify(payload) });
  },

  generateSocialPost(payload: { topic: string; platform: string; tone: string; goal: string }) {
    return apiFetch<{
      hook: string;
      caption: string;
      callToAction: string;
      hashtags: string[];
      visualSuggestion: string;
      bestPostingWindow: string;
    }>('/api/ai/social-post', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Telemetry & Contact
  trackAdEvent(slotId: string, eventType: 'impression' | 'click', pagePath: string) {
    return apiFetch<{ recorded: boolean }>('/api/ads/event', {
      method: 'POST',
      body: JSON.stringify({ slotId, eventType, pagePath }),
    }).catch(() => ({ recorded: false }));
  },

  trackAffiliateClick(partnerSlug: string, partnerName: string) {
    return apiFetch<{ recorded: boolean }>('/api/affiliates/click', {
      method: 'POST',
      body: JSON.stringify({ partnerSlug, partnerName }),
    }).catch(() => ({ recorded: false }));
  },

  submitContact(payload: { name: string; email: string; subject: string; message: string }) {
    return apiFetch<{ submitted: boolean }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
