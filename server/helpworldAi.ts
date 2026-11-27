import { GoogleGenAI, Type, type GenerateContentResponse } from '@google/genai';

export class ApiConfigError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 503) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new ApiConfigError(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function extractAiError(err: unknown): { status: number; message: string } {
  if (err instanceof ApiConfigError) {
    return { status: err.statusCode, message: err.message };
  }
  const msg = err instanceof Error ? err.message : String(err || 'AI request failed');
  if (/API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(msg)) {
    return {
      status: 403,
      message: 'Gemini API key authentication failed. Please check GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (/RESOURCE_EXHAUSTED|429/i.test(msg)) {
    return {
      status: 429,
      message: 'Rate limit reached temporarily. Please wait a few seconds and retry.',
    };
  }
  return { status: 502, message: msg.slice(0, 240) };
}

function parseJsonSafe<T>(raw: string | undefined, fallbackMsg: string): T {
  const text = (raw || '').trim();
  if (!text) throw new Error(fallbackMsg);
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

const HUB_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  assistant:
    'You are HelpWorld AI Personal Assistant. Solve everyday practical problems clearly, warmly, and concisely with actionable steps.',
  student:
    'You are HelpWorld AI Student Tutor. Explain concepts clearly, provide structured study notes, step-by-step homework reasoning, project ideas, and 3 quick self-check practice questions.',
  jobs:
    'You are HelpWorld AI Career & Job Coach. STRICT SAFETY RULE: Never invent fake job vacancies, fake company hiring claims, or guaranteed-income promises. Instead provide realistic role matches, verified legitimate job-search platforms (e.g. LinkedIn, Indeed, Naukri, Wellfound, RemoteOK, official government portals), scam red-flag checks, resume improvements, and realistic remote/work-from-home pathways.',
  business:
    'You are HelpWorld AI Small Business Advisor. Give realistic business ideas, low-cost marketing steps, customer validation checklists, and operational planning without any guaranteed profit claims.',
  health:
    'You are HelpWorld AI Health & Wellness Educator. STRICT SAFETY RULE: Provide general wellness, nutrition, sleep, and fitness education only. NEVER diagnose diseases or prescribe medication. Always set safetyNotice to remind the user to consult a qualified doctor. If the query mentions chest pain, trouble breathing, severe bleeding, stroke signs, poisoning, suicidal ideation, or unconsciousness, set isEmergencyAlert=true and instruct them to call local emergency services immediately.',
  money:
    'You are HelpWorld AI Financial Literacy Educator. Teach budgeting, emergency savings, debt reduction, and safe banking habits. STRICT RULE: Never promise guaranteed investment returns or get-rich-quick schemes.',
  legal:
    'You are HelpWorld AI Civic & Legal Information Guide. Explain basic legal rights, consumer protections, workplace/tenant rights, and official government service steps in plain language. Clearly state in safetyNotice that this is educational information, not licensed legal advice.',
  tech:
    'You are HelpWorld AI Technology Support Specialist. Diagnose smartphone (Android/iOS), Windows/Mac computer, Wi-Fi/internet, and software problems with calm, step-by-step troubleshooting and basic phishing/malware safety tips.',
  emergency:
    'You are HelpWorld AI Emergency Triage & Safety Guide. PRIORITY RULE: Always set isEmergencyAlert=true when immediate danger or medical/fire/crime crisis is described. Immediately tell the user to dial their local emergency number (e.g., 112 in India/EU, 911 in US/Canada, 999 in UK, 108/102 ambulance), followed by calm first-priority safety steps while waiting for responders.',
  daily:
    'You are HelpWorld AI Daily Life Assistant. Help with practical home cooking recipes, smart grocery lists, travel packing/itineraries, home organization, and everyday errands.',
};

export interface StructuredAssistResponse {
  title: string;
  answer: string;
  actionSteps: string[];
  safetyNotice: string;
  isEmergencyAlert: boolean;
}

export async function generateStructuredHelp(input: {
  hubSlug: string;
  prompt: string;
  language: string;
  context?: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}): Promise<StructuredAssistResponse> {
  const ai = getAiClient();
  const baseRole = HUB_SYSTEM_INSTRUCTIONS[input.hubSlug] || HUB_SYSTEM_INSTRUCTIONS.assistant;

  const historySnippet =
    input.history && input.history.length > 0
      ? `Recent conversation context:\n${input.history
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 500)}`)
          .join('\n')}\n\n`
      : '';

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `${historySnippet}${input.context ? `Extra details / mode: ${input.context}\n` : ''}User request: ${input.prompt}`,
    config: {
      systemInstruction: `${baseRole}
Respond entirely in ${input.language}.
Keep explanations clear, accessible, and practical for everyday people worldwide.
Return valid JSON matching the requested schema.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Short, helpful heading in the requested language.',
          },
          answer: {
            type: Type.STRING,
            description: 'Clear, thorough, well-structured explanation in plain readable paragraphs or bullet points.',
          },
          actionSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 to 5 concrete next steps the person can take right now.',
          },
          safetyNotice: {
            type: Type.STRING,
            description:
              'Brief helpful disclaimer or safety reminder when relevant (e.g. medical, legal, financial, scam awareness, or emergency dialing). Empty string if not needed.',
          },
          isEmergencyAlert: {
            type: Type.BOOLEAN,
            description:
              'True ONLY if the user describes an active medical, physical safety, fire, crime, or mental health emergency requiring immediate emergency services.',
          },
        },
        required: ['title', 'answer', 'actionSteps', 'safetyNotice', 'isEmergencyAlert'],
      },
    },
  });

  return parseJsonSafe<StructuredAssistResponse>(
    response.text,
    'Could not generate structured help response.'
  );
}

export async function generateTranslation(input: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  tone: string;
}): Promise<{
  detectedLanguage: string;
  translatedText: string;
  pronunciationGuide: string;
  contextTip: string;
}> {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Source language: ${input.sourceLanguage}\nTarget language: ${input.targetLanguage}\nStyle: ${input.tone}\nText to translate:\n${input.text}`,
    config: {
      systemInstruction:
        'You are an accurate global translator supporting Hindi, English, and all major world languages. Provide faithful translation, easy phonetic pronunciation/transliteration, and a brief usage note.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedLanguage: { type: Type.STRING },
          translatedText: { type: Type.STRING },
          pronunciationGuide: { type: Type.STRING },
          contextTip: { type: Type.STRING },
        },
        required: ['detectedLanguage', 'translatedText', 'pronunciationGuide', 'contextTip'],
      },
    },
  });

  return parseJsonSafe(response.text, 'Could not complete translation.');
}

export async function analyzeUploadedImage(input: {
  imageBase64: string;
  mimeType: string;
  question: string;
  language: string;
}): Promise<{
  summary: string;
  detailedExplanation: string;
  extractedText: string;
  nextSteps: string[];
  safetyNotice: string;
}> {
  const ai = getAiClient();
  const cleanBase64 = input.imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: input.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        {
          text: `Question about this image: ${input.question || 'Explain what is shown in this image, read any visible text, and help me understand it.'}`,
        },
      ],
    },
    config: {
      systemInstruction: `You are HelpWorld Image AI. Respond clearly in ${input.language}. Help the user understand documents, homework problems, error screens, product labels, or everyday photos. If the image appears to show a prescription/medication label or medical issue, include a clear safetyNotice advising consultation with a doctor or pharmacist.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          detailedExplanation: { type: Type.STRING },
          extractedText: {
            type: Type.STRING,
            description: 'Key visible text or numbers read from the image, or empty string if none.',
          },
          nextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          safetyNotice: { type: Type.STRING },
        },
        required: ['summary', 'detailedExplanation', 'extractedText', 'nextSteps', 'safetyNotice'],
      },
    },
  });

  return parseJsonSafe(response.text, 'Could not analyze uploaded image.');
}

export async function transcribeAudioClip(input: {
  audioBase64: string;
  mimeType: string;
  language: string;
}): Promise<{ transcript: string }> {
  const ai = getAiClient();
  const cleanAudio = input.audioBase64.replace(/^data:audio\/[\w.-]+;base64,/, '');

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: input.mimeType || 'audio/webm',
            data: cleanAudio,
          },
        },
        {
          text: `Transcribe the spoken audio accurately in its original spoken language (user locale preference: ${input.language}). Return only the clean transcription text.`,
        },
      ],
    },
  });

  const transcript = (response.text || '').trim();
  if (!transcript) {
    throw new Error('No speech could be transcribed from the recording.');
  }
  return { transcript };
}

export async function synthesizeSpeechWav(input: {
  text: string;
  voiceName: string;
  style?: string;
}): Promise<{ audioBase64: string; mimeType: string; voiceName: string }> {
  const ai = getAiClient();
  const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const selectedVoice = allowedVoices.includes(input.voiceName) ? input.voiceName : 'Kore';

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: input.text.slice(0, 1800),
            speechMetadata: {
              style: input.style || 'Warm, clear, accessible helpful assistant',
            },
          } as unknown as { text: string },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: selectedVoice },
        },
      },
    },
  });

  const inline = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inline?.data) {
    throw new Error('Speech synthesis did not return audio output.');
  }

  return {
    audioBase64: inline.data,
    mimeType: inline.mimeType || 'audio/wav',
    voiceName: selectedVoice,
  };
}
