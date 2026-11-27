export interface AccessibilityPrefs {
  textScale: 'normal' | 'lg' | 'xl';
  highContrast: boolean;
  reducedMotion: boolean;
  autoReadAloud: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  preferredLanguage: string;
  ttsVoice: string;
  isPlus: boolean;
  favoriteHubs: string[];
  accessibility: AccessibilityPrefs;
  avatarUrl: string;
  createdAt: string;
}

export interface StructuredAssistResponse {
  title: string;
  answer: string;
  actionSteps: string[];
  safetyNotice: string;
  isEmergencyAlert: boolean;
}

export interface EmergencyEntry {
  country: string;
  code: string;
  unified: string;
  police: string;
  ambulance: string;
  fire: string;
  helplines: string;
}

export interface DashboardResponse {
  stats: {
    totalAnswers: number;
    hubsUsed: number;
  };
  usage: Array<{ hubSlug: string; hubName: string; count: number }>;
  sessions: Array<{
    id: number;
    hubSlug: string;
    hubName: string;
    language: string;
    prompt: string;
    responsePreview: string;
    createdAt: string;
  }>;
}

// Stored strictly in JS memory; session reload persistence relies on HttpOnly Partitioned cookie
let memoryToken: string | null = null;

export function setMemoryAuthToken(token: string | null): void {
  memoryToken = token;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!headers['Content-Type']) {
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

export const helpworldApi = {
  async register(payload: {
    name: string;
    email: string;
    password: string;
    preferredLanguage: string;
  }) {
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

  getMe() {
    return apiFetch<{ user: UserProfile }>('/api/auth/me');
  },

  updatePreferences(payload: {
    name?: string;
    preferredLanguage?: string;
    ttsVoice?: string;
    accessibility?: AccessibilityPrefs;
  }) {
    return apiFetch<{ user: UserProfile }>('/api/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  toggleFavorite(hubSlug: string) {
    return apiFetch<{ user: UserProfile }>('/api/auth/favorites', {
      method: 'POST',
      body: JSON.stringify({ hubSlug }),
    });
  },

  setPlusStatus(enable: boolean) {
    return apiFetch<{ user: UserProfile }>('/api/auth/plus', {
      method: 'POST',
      body: JSON.stringify({ enable }),
    });
  },

  clearHistory() {
    return apiFetch<{ cleared: boolean }>('/api/auth/history', { method: 'DELETE' });
  },

  deleteAccount() {
    setMemoryAuthToken(null);
    return apiFetch<{ deleted: boolean }>('/api/auth/account', { method: 'DELETE' });
  },

  getDashboard() {
    return apiFetch<DashboardResponse>('/api/dashboard');
  },

  deleteSession(id: number) {
    return apiFetch<{ deleted: boolean }>(`/api/dashboard/sessions/${id}`, { method: 'DELETE' });
  },

  getEmergencyDirectory() {
    return apiFetch<{ directory: EmergencyEntry[] }>('/api/emergency/directory');
  },

  askAssist(payload: {
    hubSlug: string;
    hubName: string;
    prompt: string;
    language: string;
    context?: string;
    history?: Array<{ role: 'user' | 'model'; content: string }>;
  }) {
    return apiFetch<StructuredAssistResponse>('/api/ai/assist', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  translate(payload: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    tone: string;
  }) {
    return apiFetch<{
      detectedLanguage: string;
      translatedText: string;
      pronunciationGuide: string;
      contextTip: string;
    }>('/api/ai/translate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  analyzeImage(payload: {
    imageBase64: string;
    mimeType: string;
    question: string;
    language: string;
  }) {
    return apiFetch<{
      summary: string;
      detailedExplanation: string;
      extractedText: string;
      nextSteps: string[];
      safetyNotice: string;
    }>('/api/ai/image-analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  transcribeAudio(payload: { audioBase64: string; mimeType: string; language: string }) {
    return apiFetch<{ transcript: string }>('/api/ai/voice-transcribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  synthesizeSpeech(payload: { text: string; voiceName: string; style?: string }) {
    return apiFetch<{ audioBase64: string; mimeType: string; voiceName: string }>('/api/ai/tts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  trackAdEvent(placementId: string, eventType: 'impression' | 'click', pagePath: string) {
    return apiFetch<{ recorded: boolean }>('/api/ads/event', {
      method: 'POST',
      body: JSON.stringify({ placementId, eventType, pagePath }),
    }).catch(() => ({ recorded: false }));
  },

  submitContact(payload: { name: string; email: string; topic: string; message: string }) {
    return apiFetch<{ submitted: boolean }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
