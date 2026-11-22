import { GoogleGenAI, Type, type GenerateContentResponse } from '@google/genai';

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

export class ApiConfigError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 503) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function extractAiError(err: unknown): { status: number; message: string } {
  if (err instanceof ApiConfigError) {
    return { status: err.statusCode, message: err.message };
  }
  const msg = err instanceof Error ? err.message : String(err || 'AI generation failed');
  if (/API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(msg)) {
    return {
      status: 403,
      message: 'Gemini API key authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (/RESOURCE_EXHAUSTED|429/i.test(msg)) {
    return {
      status: 429,
      message: 'Rate limit temporarily reached for the Gemini API. Please retry in a few seconds.',
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

// 1. AI Image Generator (Vector & Generative SVG Composition via gemini-4-hydrogen)
export async function generateAiImage(input: {
  prompt: string;
  style: string;
  aspectRatio: string;
}) {
  const ai = getAiClient();
  const dimensions: Record<string, { w: number; h: number }> = {
    '1:1': { w: 1024, h: 1024 },
    '16:9': { w: 1280, h: 720 },
    '4:3': { w: 1024, h: 768 },
    '9:16': { w: 720, h: 1280 },
  };
  const { w, h } = dimensions[input.aspectRatio] || dimensions['1:1'];

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Create a rich, layered, artistic SVG composition for this image prompt: "${input.prompt}".
Visual Style: ${input.style}.
Canvas viewBox must be "0 0 ${w} ${h}" with width="${w}" height="${h}".
Use detailed <defs> (linearGradient, radialGradient, soft Gaussian glow filters), layered silhouettes, foreground/midground/background depth, lighting highlights, and crisp geometric or organic shapes. Do NOT include any <script> tags, external image hrefs, or event handlers.`,
    config: {
      systemInstruction:
        'You are a master digital illustrator and generative SVG artist. Always return valid JSON matching the schema with museum-grade layered SVG art.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          enhancedPrompt: { type: Type.STRING },
          palette: { type: Type.ARRAY, items: { type: Type.STRING } },
          compositionNotes: { type: Type.STRING },
          svg: { type: Type.STRING },
        },
        required: ['title', 'enhancedPrompt', 'palette', 'compositionNotes', 'svg'],
      },
    },
  });

  return parseJsonSafe<{
    title: string;
    enhancedPrompt: string;
    palette: string[];
    compositionNotes: string;
    svg: string;
  }>(response.text, 'Failed to generate artwork');
}

// 2. AI Logo Maker
export async function generateAiLogos(input: {
  brandName: string;
  tagline: string;
  industry: string;
  style: string;
  colorMood: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Design 3 distinct, iconic vector logo concepts for:
Brand Name: "${input.brandName}"
Tagline: "${input.tagline || 'None'}"
Industry: ${input.industry}
Design Style: ${input.style}
Color Mood: ${input.colorMood}

Each SVG must use viewBox="0 0 400 300", crisp geometric vector marks + clean brand typography rendered with standard sans/serif SVG <text> (include dark or subtle card background rect inside the SVG so every logo renders clearly), linearGradients, and zero <script> tags.`,
    config: {
      systemInstruction:
        'You are an executive brand identity director. Produce 3 remarkably distinct, commercial-ready SVG logo concepts.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                conceptName: { type: Type.STRING },
                styleTag: { type: Type.STRING },
                rationale: { type: Type.STRING },
                palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                fontPairing: { type: Type.STRING },
                svg: { type: Type.STRING },
              },
              required: ['conceptName', 'styleTag', 'rationale', 'palette', 'fontPairing', 'svg'],
            },
          },
        },
        required: ['concepts'],
      },
    },
  });

  return parseJsonSafe<{
    concepts: Array<{
      conceptName: string;
      styleTag: string;
      rationale: string;
      palette: string[];
      fontPairing: string;
      svg: string;
    }>;
  }>(response.text, 'Failed to design logo concepts');
}

// 3. AI Text Generator
export async function generateAiText(input: {
  prompt: string;
  format: string;
  tone: string;
  length: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Format: ${input.format}
Tone: ${input.tone}
Target Length: ${input.length}
Topic / Brief: ${input.prompt}

Write polished, publication-ready copy with clear headings and formatting.`,
    config: {
      systemInstruction:
        'You are an editorial copywriter and content strategist. Write original, structured, high-clarity prose without filler clichés.',
    },
  });

  return { text: (response.text || '').trim() };
}

// 4. AI Story Writer
export async function generateAiStory(input: {
  premise: string;
  genre: string;
  tone: string;
  characters: string;
  previousStory?: string;
}) {
  const ai = getAiClient();
  const prompt = input.previousStory
    ? `Continue the following ${input.genre} story in a ${input.tone} tone. Keep continuity with the characters (${input.characters || 'established cast'}) and escalate the dramatic arc.\n\nStory so far:\n${input.previousStory}\n\nNext direction:\n${input.premise}`
    : `Write an engaging ${input.genre} short story in a ${input.tone} tone.\nCharacters: ${input.characters || 'Original protagonist'}\nPremise: ${input.premise}\nGive it a vivid opening, sensory detail, dialogue, and a compelling hook.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a bestselling fiction author. Craft vivid scenes with strong pacing, authentic dialogue, and memorable imagery.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          chapterHeading: { type: Type.STRING },
          storyText: { type: Type.STRING },
          writingNote: { type: Type.STRING },
        },
        required: ['title', 'chapterHeading', 'storyText', 'writingNote'],
      },
    },
  });

  return parseJsonSafe<{
    title: string;
    chapterHeading: string;
    storyText: string;
    writingNote: string;
  }>(response.text, 'Failed to generate story');
}

// 5. AI Photo Editor (Multimodal vision analysis + exact canvas color-grading parameters)
export async function analyzePhotoEdit(input: {
  imageBase64: string;
  mimeType: string;
  instruction: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: input.mimeType || 'image/jpeg',
            data: input.imageBase64,
          },
        },
        {
          text: `Inspect this uploaded photograph carefully and determine the optimal color-grading, exposure, contrast, tint, and vignette adjustments to achieve the user's editing instruction: "${input.instruction}".
Return calibrated numeric parameters within safe ranges:
- brightness: 50 to 160 (100 = neutral)
- contrast: 60 to 175 (100 = neutral)
- saturate: 0 to 200 (100 = neutral)
- hueRotate: -180 to 180 (0 = neutral)
- sepia: 0 to 100 (0 = neutral)
- blur: 0 to 4 (0 = sharp)
- vignette: 0 to 85 (0 = none)
- tintHex: valid #RRGGBB color for color grading overlay
- tintOpacity: 0 to 0.45`,
        },
      ],
    },
    config: {
      systemInstruction:
        'You are a professional photo retoucher and colorist. Calibrate numeric grading values precisely based on the uploaded photo lighting and the requested edit.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          presetTitle: { type: Type.STRING },
          critique: { type: Type.STRING },
          brightness: { type: Type.NUMBER },
          contrast: { type: Type.NUMBER },
          saturate: { type: Type.NUMBER },
          hueRotate: { type: Type.NUMBER },
          sepia: { type: Type.NUMBER },
          blur: { type: Type.NUMBER },
          vignette: { type: Type.NUMBER },
          tintHex: { type: Type.STRING },
          tintOpacity: { type: Type.NUMBER },
        },
        required: [
          'presetTitle',
          'critique',
          'brightness',
          'contrast',
          'saturate',
          'hueRotate',
          'sepia',
          'blur',
          'vignette',
          'tintHex',
          'tintOpacity',
        ],
      },
    },
  });

  return parseJsonSafe<{
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
  }>(response.text, 'Failed to analyze photo for editing');
}

// 6. AI Background Remover (Multimodal subject & backdrop RGB analysis)
export async function analyzeBackgroundRemoval(input: {
  imageBase64: string;
  mimeType: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: input.mimeType || 'image/jpeg',
            data: input.imageBase64,
          },
        },
        {
          text: `Analyze this uploaded image to guide automatic background matte extraction.
Identify the main foreground subject, describe the background surface, determine whether the background is relatively uniform around the image borders ("edge-flood") or global color key ("global-chroma"), estimate the dominant border background RGB (0-255 each), and recommend a pixel distance tolerance (15-90) and feathering smoothness (1-12).`,
        },
      ],
    },
    config: {
      systemInstruction:
        'You are a computer-vision image segmentation specialist. Inspect the border and subject contrast accurately.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subjectLabel: { type: Type.STRING },
          backgroundDescription: { type: Type.STRING },
          strategy: { type: Type.STRING },
          bgRed: { type: Type.INTEGER },
          bgGreen: { type: Type.INTEGER },
          bgBlue: { type: Type.INTEGER },
          recommendedTolerance: { type: Type.INTEGER },
          edgeFeather: { type: Type.INTEGER },
          confidenceNote: { type: Type.STRING },
        },
        required: [
          'subjectLabel',
          'backgroundDescription',
          'strategy',
          'bgRed',
          'bgGreen',
          'bgBlue',
          'recommendedTolerance',
          'edgeFeather',
          'confidenceNote',
        ],
      },
    },
  });

  return parseJsonSafe<{
    subjectLabel: string;
    backgroundDescription: string;
    strategy: string;
    bgRed: number;
    bgGreen: number;
    bgBlue: number;
    recommendedTolerance: number;
    edgeFeather: number;
    confidenceNote: string;
  }>(response.text, 'Failed to analyze image background');
}

// 7. AI Video Generator (4-Scene Motion Storyboard + SVG Keyframes rendered to real WebM video)
export async function generateAiVideoStoryboard(input: {
  prompt: string;
  aspectRatio: string;
  mood: string;
}) {
  const ai = getAiClient();
  const w = input.aspectRatio === '9:16' ? 540 : input.aspectRatio === '1:1' ? 720 : 960;
  const h = input.aspectRatio === '9:16' ? 960 : input.aspectRatio === '1:1' ? 720 : 540;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Create a 4-scene animated video storyboard for: "${input.prompt}".
Mood: ${input.mood}.
Canvas resolution: ${w}x${h}.
For each of the 4 scenes, produce:
- sceneNumber (1 to 4)
- durationSec (2.5 to 4)
- caption (short cinematic subtitle <= 10 words)
- cameraMotion (one of: "zoom-in", "zoom-out", "pan-left", "pan-right")
- accentColor (#RRGGBB)
- svgScene: complete rich layered <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"> illustration representing that exact scene with atmospheric gradients, lighting, silhouettes, and scenery (zero <script> tags).`,
    config: {
      systemInstruction:
        'You are a creative director & motion storyboard artist. Build 4 visually cohesive animated scene keyframes.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          narrativeSummary: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                durationSec: { type: Type.NUMBER },
                caption: { type: Type.STRING },
                cameraMotion: { type: Type.STRING },
                accentColor: { type: Type.STRING },
                svgScene: { type: Type.STRING },
              },
              required: [
                'sceneNumber',
                'durationSec',
                'caption',
                'cameraMotion',
                'accentColor',
                'svgScene',
              ],
            },
          },
        },
        required: ['title', 'narrativeSummary', 'scenes'],
      },
    },
  });

  return parseJsonSafe<{
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
  }>(response.text, 'Failed to generate video storyboard');
}

// 8. AI Voice Generator (Real Gemini 3.8 TTS WAV generation)
export async function generateAiVoice(input: {
  text: string;
  voiceName: string;
  style: string;
}) {
  const ai = getAiClient();
  const allowedVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
  const selectedVoice = allowedVoices.includes(input.voiceName) ? input.voiceName : 'Kore';

  const styledText = input.style
    ? `Speak in a ${input.style} style: ${input.text}`
    : input.text;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [{ text: styledText }],
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

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'audio/wav',
        voiceName: selectedVoice,
      };
    }
  }
  throw new Error('The voice model did not return audio data. Please try shorter text.');
}

// 9. AI Code Generator
export async function generateAiCode(input: {
  prompt: string;
  language: string;
  includeTests: boolean;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Language / Stack: ${input.language}
Include Unit Tests / Usage Example: ${input.includeTests ? 'Yes' : 'No'}
Task: ${input.prompt}`,
    config: {
      systemInstruction:
        'You are a principal software engineer. Write clean, idiomatic, secure, production-ready code with concise explanation.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          filename: { type: Type.STRING },
          language: { type: Type.STRING },
          code: { type: Type.STRING },
          explanation: { type: Type.STRING },
          complexityNote: { type: Type.STRING },
        },
        required: ['filename', 'language', 'code', 'explanation', 'complexityNote'],
      },
    },
  });

  return parseJsonSafe<{
    filename: string;
    language: string;
    code: string;
    explanation: string;
    complexityNote: string;
  }>(response.text, 'Failed to generate code');
}

// 10. AI Chatbot (Multi-turn conversational assistant)
export async function runAiChat(input: {
  message: string;
  persona: string;
  history: Array<{ role: 'user' | 'model'; content: string }>;
}) {
  const ai = getAiClient();
  const personaInstructions: Record<string, string> = {
    general: 'You are Cinnox AI Copilot, a clear, sharp, practical assistant across strategy, writing, tech, and creativity.',
    coder: 'You are Cinnox Senior Architect, specializing in TypeScript, React, Python, SQL, debugging, and clean system design.',
    marketer: 'You are Cinnox Growth Strategist, skilled in positioning, SEO, paid campaigns, landing pages, and conversion copy.',
    tutor: 'You are Cinnox Study Tutor, breaking complex STEM, history, and language topics into crystal-clear step-by-step explanations.',
  };

  const formattedHistory = input.history.slice(-14).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = ai.chats.create({
    model: 'gemini-4-hydrogen',
    history: formattedHistory,
    config: {
      systemInstruction: personaInstructions[input.persona] || personaInstructions.general,
    },
  });

  const response: GenerateContentResponse = await chat.sendMessage({
    message: input.message,
  });

  return { reply: (response.text || '').trim() };
}

// 11. AI Resume Builder
export async function generateAiResume(input: {
  fullName: string;
  email: string;
  location: string;
  targetRole: string;
  experienceYears: string;
  skills: string;
  backgroundSummary: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Build a high-impact, ATS-friendly modern resume for:
Name: ${input.fullName}
Email: ${input.email}
Location: ${input.location}
Target Role: ${input.targetRole}
Experience: ${input.experienceYears}
Core Skills: ${input.skills}
Background & Projects Notes: ${input.backgroundSummary}

Write concrete action verbs and realistic structured bullets grounded strictly in the provided background (do not invent fake employers—label realistic role slots clearly if minimal details were supplied).`,
    config: {
      systemInstruction:
        'You are an executive technical & career resume writer. Produce structured, crisp, ATS-compliant resume content.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullName: { type: Type.STRING },
          headline: { type: Type.STRING },
          contactLine: { type: Type.STRING },
          summary: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING },
                company: { type: Type.STRING },
                period: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['role', 'company', 'period', 'bullets'],
            },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING },
                institution: { type: Type.STRING },
                year: { type: Type.STRING },
              },
              required: ['degree', 'institution', 'year'],
            },
          },
          atsTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'fullName',
          'headline',
          'contactLine',
          'summary',
          'skills',
          'experience',
          'education',
          'atsTips',
        ],
      },
    },
  });

  return parseJsonSafe<{
    fullName: string;
    headline: string;
    contactLine: string;
    summary: string;
    skills: string[];
    experience: Array<{ role: string; company: string; period: string; bullets: string[] }>;
    education: Array<{ degree: string; institution: string; year: string }>;
    atsTips: string[];
  }>(response.text, 'Failed to build resume');
}

// 12. AI Translator
export async function generateAiTranslation(input: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  formality: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Source Language: ${input.sourceLanguage}
Target Language: ${input.targetLanguage}
Formality / Register: ${input.formality}
Text to translate:
${input.text}`,
    config: {
      systemInstruction:
        'You are a native-level multilingual translator and linguist. Preserve nuance, idioms, and requested formality.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedSourceLanguage: { type: Type.STRING },
          translatedText: { type: Type.STRING },
          transliteration: { type: Type.STRING },
          alternativePhrasing: { type: Type.STRING },
          culturalNote: { type: Type.STRING },
        },
        required: [
          'detectedSourceLanguage',
          'translatedText',
          'transliteration',
          'alternativePhrasing',
          'culturalNote',
        ],
      },
    },
  });

  return parseJsonSafe<{
    detectedSourceLanguage: string;
    translatedText: string;
    transliteration: string;
    alternativePhrasing: string;
    culturalNote: string;
  }>(response.text, 'Failed to translate text');
}

// 13. AI Thumbnail Maker
export async function generateAiThumbnail(input: {
  videoTitle: string;
  niche: string;
  visualTheme: string;
  badgeText: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Create a high-click-through-rate YouTube 16:9 thumbnail background illustration & text layout for:
Video Title: "${input.videoTitle}"
Niche: ${input.niche}
Visual Theme: ${input.visualTheme}
Callout Badge: "${input.badgeText || 'NEW'}"

Return a crisp SVG backdrop (viewBox="0 0 1280 720" width="1280" height="720") with dramatic lighting, depth, expressive shapes, and clean negative space on the left for bold typography — do NOT put the headline text inside the SVG itself (the studio renders crisp canvas typography over it so the user can edit text live). Zero <script> tags.`,
    config: {
      systemInstruction:
        'You are a YouTube packaging & thumbnail director. Design vibrant, high-contrast visual backdrops and crisp 2–4 word hook headlines.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hookHeadline: { type: Type.STRING },
          subBadge: { type: Type.STRING },
          accentColor: { type: Type.STRING },
          textColor: { type: Type.STRING },
          ctrAnalysis: { type: Type.STRING },
          svgBackdrop: { type: Type.STRING },
        },
        required: [
          'hookHeadline',
          'subBadge',
          'accentColor',
          'textColor',
          'ctrAnalysis',
          'svgBackdrop',
        ],
      },
    },
  });

  return parseJsonSafe<{
    hookHeadline: string;
    subBadge: string;
    accentColor: string;
    textColor: string;
    ctrAnalysis: string;
    svgBackdrop: string;
  }>(response.text, 'Failed to generate thumbnail');
}

// 14. AI Business Name Generator
export async function generateAiBusinessNames(input: {
  description: string;
  industry: string;
  style: string;
  keywords: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Generate 8 distinctive, memorable business/brand names for:
Business Description: ${input.description}
Industry: ${input.industry}
Naming Style: ${input.style}
Keywords to weave in (optional): ${input.keywords || 'None'}`,
    config: {
      systemInstruction:
        'You are a naming strategist at a top brand agency. Create pronounceable, trademark-friendly, distinctive brand names with taglines and domain suggestions.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          names: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                brandName: { type: Type.STRING },
                tagline: { type: Type.STRING },
                domainIdea: { type: Type.STRING },
                category: { type: Type.STRING },
                rationale: { type: Type.STRING },
              },
              required: ['brandName', 'tagline', 'domainIdea', 'category', 'rationale'],
            },
          },
        },
        required: ['names'],
      },
    },
  });

  return parseJsonSafe<{
    names: Array<{
      brandName: string;
      tagline: string;
      domainIdea: string;
      category: string;
      rationale: string;
    }>;
  }>(response.text, 'Failed to generate business names');
}

// 15. AI Social Media Post Generator
export async function generateAiSocialPost(input: {
  topic: string;
  platform: string;
  tone: string;
  goal: string;
}) {
  const ai = getAiClient();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Platform: ${input.platform}
Goal: ${input.goal}
Tone: ${input.tone}
Topic / Announcement: ${input.topic}`,
    config: {
      systemInstruction:
        'You are a social media creative lead. Write native, engaging, zero-cringe posts tailored to the platform algorithm and reader behavior.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING },
          caption: { type: Type.STRING },
          callToAction: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          visualSuggestion: { type: Type.STRING },
          bestPostingWindow: { type: Type.STRING },
        },
        required: [
          'hook',
          'caption',
          'callToAction',
          'hashtags',
          'visualSuggestion',
          'bestPostingWindow',
        ],
      },
    },
  });

  return parseJsonSafe<{
    hook: string;
    caption: string;
    callToAction: string;
    hashtags: string[];
    visualSuggestion: string;
    bestPostingWindow: string;
  }>(response.text, 'Failed to generate social media post');
}
