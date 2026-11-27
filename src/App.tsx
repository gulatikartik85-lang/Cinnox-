import React, { useEffect, useState } from 'react';
import { HELP_HUBS } from './data/helpHubs';
import {
  helpworldApi,
  type AccessibilityPrefs,
  type UserProfile,
} from './lib/helpworldApi';
import { Footer, MobileBottomNav, TopBar } from './components/AppChrome';
import { OfflineIndicator } from './components/PWAAndOffline';
import { HomePage } from './pages/HomePage';
import { HubWorkspacePage } from './pages/HubWorkspacePage';
import { AuthPage, DashboardPage } from './pages/AuthAndDashboardPages';
import {
  ContactPage,
  PlusMembershipPage,
  PrivacyPolicyPage,
  TermsPage,
} from './pages/PlusAndTrustPages';

function getPath(): string {
  return window.location.pathname || '/';
}

export function App() {
  const [path, setPath] = useState<string>(getPath);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('hw_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [language, setLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('hw_language') || 'English';
    } catch {
      return 'English';
    }
  });
  const [ttsVoice, setTtsVoice] = useState<string>('Kore');
  const [accessibility, setAccessibility] = useState<AccessibilityPrefs>({
    textScale: 'normal',
    highContrast: false,
    reducedMotion: false,
    autoReadAloud: false,
  });
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('hw_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('hw-text-lg', 'hw-text-xl', 'hw-high-contrast', 'hw-reduced-motion');
    if (accessibility.textScale === 'lg') root.classList.add('hw-text-lg');
    if (accessibility.textScale === 'xl') root.classList.add('hw-text-xl');
    if (accessibility.highContrast) root.classList.add('hw-high-contrast');
    if (accessibility.reducedMotion) root.classList.add('hw-reduced-motion');
  }, [accessibility]);

  useEffect(() => {
    helpworldApi
      .getMe()
      .then((res) => {
        setUser(res.user);
        setLanguage(res.user.preferredLanguage);
        setTtsVoice(res.user.ttsVoice);
        setAccessibility(res.user.accessibility);
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const onPop = () => setPath(getPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const hubMatch = path.match(/^\/hub\/([^/]+)/);
    let title = 'HelpWorld AI – One App for Everyone';
    if (hubMatch) {
      const hub = HELP_HUBS.find((h) => h.slug === hubMatch[1]);
      if (hub) title = `${hub.name} – HelpWorld AI`;
    } else if (path === '/dashboard') title = 'Personalised Dashboard – HelpWorld AI';
    else if (path === '/plus') title = 'HelpWorld Plus – HelpWorld AI';
    else if (path === '/privacy') title = 'Privacy & Data Protection – HelpWorld AI';
    else if (path === '/terms') title = 'Terms & Safety – HelpWorld AI';
    else if (path === '/contact') title = 'Contact Support – HelpWorld AI';
    document.title = title;
  }, [path]);

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath.split('?')[0] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeLanguage = (nextLang: string) => {
    setLanguage(nextLang);
    try {
      localStorage.setItem('hw_language', nextLang);
    } catch {
      // ignore
    }
    if (user) {
      helpworldApi
        .updatePreferences({ preferredLanguage: nextLang })
        .then((res) => setUser(res.user))
        .catch(() => {});
    }
  };

  const handleChangeVoice = (nextVoice: string) => {
    setTtsVoice(nextVoice);
    if (user) {
      helpworldApi
        .updatePreferences({ ttsVoice: nextVoice })
        .then((res) => setUser(res.user))
        .catch(() => {});
    }
  };

  const handleChangeAccessibility = (next: AccessibilityPrefs) => {
    setAccessibility(next);
    if (user) {
      helpworldApi
        .updatePreferences({ accessibility: next })
        .then((res) => setUser(res.user))
        .catch(() => {});
    }
  };

  const renderPage = () => {
    const hubMatch = path.match(/^\/hub\/([^/]+)/);
    if (hubMatch) {
      const hub = HELP_HUBS.find((h) => h.slug === hubMatch[1]);
      if (hub) {
        return (
          <HubWorkspacePage
            hub={hub}
            language={language}
            onChangeLanguage={handleChangeLanguage}
            ttsVoice={ttsVoice}
            onChangeVoice={handleChangeVoice}
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            accessibility={accessibility}
            onChangeAccessibility={handleChangeAccessibility}
            user={user}
            onUserUpdated={setUser}
            onNavigate={navigate}
          />
        );
      }
    }

    if (path === '/login') {
      return (
        <AuthPage
          mode="login"
          preferredLanguage={language}
          onSuccess={(u) => {
            setUser(u);
            setLanguage(u.preferredLanguage);
          }}
          onNavigate={navigate}
        />
      );
    }
    if (path === '/signup') {
      return (
        <AuthPage
          mode="signup"
          preferredLanguage={language}
          onSuccess={(u) => {
            setUser(u);
            setLanguage(u.preferredLanguage);
          }}
          onNavigate={navigate}
        />
      );
    }
    if (path === '/dashboard') {
      return (
        <DashboardPage
          user={user}
          onUserUpdated={setUser}
          onNavigate={navigate}
          accessibility={accessibility}
          onChangeAccessibility={handleChangeAccessibility}
        />
      );
    }
    if (path === '/plus') {
      return <PlusMembershipPage user={user} onUserUpdated={setUser} onNavigate={navigate} />;
    }
    if (path === '/privacy') return <PrivacyPolicyPage />;
    if (path === '/terms') return <TermsPage />;
    if (path === '/contact') return <ContactPage />;

    return (
      <HomePage
        language={language}
        onChangeLanguage={handleChangeLanguage}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        accessibility={accessibility}
        onChangeAccessibility={handleChangeAccessibility}
        user={user}
        onUserUpdated={setUser}
        onNavigate={navigate}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#050912] dark:text-slate-100 transition-colors">
      <TopBar currentPath={path} user={user} onNavigate={navigate} />
      <div className="flex-1">{renderPage()}</div>
      <Footer onNavigate={navigate} />
      <MobileBottomNav currentPath={path} onNavigate={navigate} />
      <OfflineIndicator />
    </div>
  );
}

export default App;
