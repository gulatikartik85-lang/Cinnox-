import React, { useEffect, useState } from 'react';
import { AI_TOOLS } from './data/toolsCatalog';
import { cinnoxApi, type UserProfile } from './lib/cinnoxApi';
import { Navbar, Footer, type AccentTheme } from './components/NavbarAndFooter';
import { ToolLayout } from './components/ToolLayout';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPages';
import { UserDashboard } from './pages/UserDashboard';
import { ContactPage, PrivacyPolicyPage, TermsPage } from './pages/LegalAndContactPages';
import {
  ImageGeneratorStudio,
  LogoMakerStudio,
  ThumbnailMakerStudio,
} from './studios/VisualStudios';
import {
  BackgroundRemoverStudio,
  PhotoEditorStudio,
  VideoGeneratorStudio,
} from './studios/PhotoAndVideoStudios';
import {
  SocialMediaPostStudio,
  StoryWriterStudio,
  TextGeneratorStudio,
  TranslatorStudio,
} from './studios/WritingAndLanguageStudios';
import {
  BusinessNameStudio,
  ChatbotStudio,
  CodeGeneratorStudio,
  ResumeBuilderStudio,
  VoiceGeneratorStudio,
} from './studios/CodeVoiceChatCareerStudios';

function getCurrentPath(): string {
  return window.location.pathname || '/';
}

export function App() {
  const [path, setPath] = useState<string>(getCurrentPath);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('cinnox_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accentTheme, setAccentTheme] = useState<AccentTheme>(() => {
    try {
      const saved = localStorage.getItem('cinnox_accent') as AccentTheme | null;
      return saved || 'purple-blue';
    } catch {
      return 'purple-blue';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('cinnox_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentTheme);
    try {
      localStorage.setItem('cinnox_accent', accentTheme);
    } catch {
      // ignore
    }
  }, [accentTheme]);

  useEffect(() => {
    cinnoxApi
      .getMe()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const onPop = () => setPath(getCurrentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Dynamic SEO Title & Meta Description synchronization per route
  useEffect(() => {
    const toolMatch = path.match(/^\/tools\/([^/]+)/);
    let title = 'Cinnox – 15-in-1 Creative & Productivity AI Studio';
    let desc =
      'Create images, logos, videos, natural voices, code, resumes, translations, thumbnails, and social posts in one unified Cinnox workspace.';

    if (toolMatch) {
      const tool = AI_TOOLS.find((t) => t.slug === toolMatch[1]);
      if (tool) {
        title = tool.seoTitle;
        desc = tool.seoDescription;
      }
    } else if (path === '/dashboard') {
      title = 'User Dashboard – Cinnox';
      desc = 'Manage your saved AI generations, pinned favorite studios, and profile settings.';
    } else if (path === '/login') {
      title = 'Sign In – Cinnox';
    } else if (path === '/signup') {
      title = 'Create Free Account – Cinnox';
    } else if (path === '/privacy') {
      title = 'Privacy Policy – Cinnox';
    } else if (path === '/terms') {
      title = 'Terms of Service – Cinnox';
    } else if (path === '/contact') {
      title = 'Contact Support – Cinnox';
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
  }, [path]);

  const navigate = (nextPath: string) => {
    if (nextPath.startsWith('/#')) {
      const hashId = nextPath.slice(2);
      if (path !== '/') {
        window.history.pushState({}, '', '/');
        setPath('/');
        setTimeout(() => {
          document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else {
        document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    window.history.pushState({}, '', nextPath);
    const cleanPath = nextPath.split('?')[0] || '/';
    setPath(cleanPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderToolContent = (slug: string) => {
    switch (slug) {
      case 'image-generator':
        return <ImageGeneratorStudio />;
      case 'logo-maker':
        return <LogoMakerStudio />;
      case 'text-generator':
        return <TextGeneratorStudio />;
      case 'story-writer':
        return <StoryWriterStudio />;
      case 'photo-editor':
        return <PhotoEditorStudio />;
      case 'background-remover':
        return <BackgroundRemoverStudio />;
      case 'video-generator':
        return <VideoGeneratorStudio />;
      case 'voice-generator':
        return <VoiceGeneratorStudio />;
      case 'code-generator':
        return <CodeGeneratorStudio />;
      case 'chatbot':
        return <ChatbotStudio user={user} />;
      case 'resume-builder':
        return <ResumeBuilderStudio />;
      case 'translator':
        return <TranslatorStudio />;
      case 'thumbnail-maker':
        return <ThumbnailMakerStudio />;
      case 'business-name-generator':
        return <BusinessNameStudio onNavigate={navigate} />;
      case 'social-media-post-generator':
        return <SocialMediaPostStudio />;
      default:
        return null;
    }
  };

  const renderPage = () => {
    const toolMatch = path.match(/^\/tools\/([^/]+)/);
    if (toolMatch) {
      const tool = AI_TOOLS.find((t) => t.slug === toolMatch[1]);
      if (tool) {
        return (
          <ToolLayout
            tool={tool}
            user={user}
            onUserUpdated={(u) => setUser(u)}
            onNavigate={navigate}
          >
            {renderToolContent(tool.slug)}
          </ToolLayout>
        );
      }
    }

    if (path === '/login') {
      return <AuthPage mode="login" onSuccess={(u) => setUser(u)} onNavigate={navigate} />;
    }
    if (path === '/signup') {
      return <AuthPage mode="signup" onSuccess={(u) => setUser(u)} onNavigate={navigate} />;
    }
    if (path === '/dashboard') {
      return <UserDashboard user={user} onUserUpdated={setUser} onNavigate={navigate} />;
    }
    if (path === '/privacy') {
      return <PrivacyPolicyPage />;
    }
    if (path === '/terms') {
      return <TermsPage />;
    }
    if (path === '/contact') {
      return <ContactPage />;
    }

    return (
      <HomePage
        onNavigate={navigate}
        user={user}
        onUserUpdated={(u) => setUser(u)}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#06070E] dark:text-slate-100 transition-colors">
      <Navbar
        currentPath={path}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        accentTheme={accentTheme}
        onChangeAccent={setAccentTheme}
        user={user}
        onNavigate={navigate}
      />

      <div className="flex-1">{renderPage()}</div>

      <Footer onNavigate={navigate} />
    </div>
  );
}

export default App;
