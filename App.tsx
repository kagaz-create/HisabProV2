import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { useRoute, goto, Tab } from './lib/nav';
import { getPin } from './lib/pin';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { CustomerDetail } from './components/CustomerDetail';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { PinLock } from './components/PinLock';
import { AuthModal } from './components/AuthScreen';
import { Toasts } from './components/ui';
import { IconChart, IconHome, IconSettings, IconUsers } from './components/Icons';

const Shell: React.FC = () => {
  const { t, lang, setLang, user, authReady, cloud, sync, profile, hasLocalData, importLocalToCloud, discardLocal, toast } = useStore();
  const route = useRoute();
  const scope = user?.uid ?? 'guest';

  /* ---- app lock ----
     "locked" is derived on every render from (is a PIN set for this account?) and (was it unlocked in this session?),
     so there is never a frame where data shows before the lock screen. */
  const [unlockedScope, setUnlockedScope] = useState<string | null>(null);
  const locked = authReady && !!getPin(scope) && unlockedScope !== scope;
  const lock = useCallback(() => setUnlockedScope(null), []);
  const markUnlocked = useCallback(() => setUnlockedScope(scope), [scope]);
  const hiddenAt = useRef<number | null>(null);
  const lastActive = useRef(Date.now());

  useEffect(() => {
    const onVis = () => {
      const rec = getPin(scope);
      if (!rec) return;
      if (document.hidden) {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current !== null) {
        const away = Date.now() - hiddenAt.current;
        hiddenAt.current = null;
        if (away >= rec.autoLockMin * 60_000) lock();
      }
    };
    const touch = () => (lastActive.current = Date.now());
    const idle = setInterval(() => {
      const rec = getPin(scope);
      if (rec && rec.autoLockMin > 0 && Date.now() - lastActive.current > rec.autoLockMin * 60_000) lock();
    }, 15_000);
    document.addEventListener('visibilitychange', onVis);
    ['pointerdown', 'keydown', 'scroll'].forEach((e) => window.addEventListener(e, touch, { passive: true }));
    return () => {
      clearInterval(idle);
      document.removeEventListener('visibilitychange', onVis);
      ['pointerdown', 'keydown', 'scroll'].forEach((e) => window.removeEventListener(e, touch));
    };
  }, [scope, lock]);

  /* ---- first sign-in with data already on this phone ---- */
  const [offered, setOffered] = useState<string | null>(null);
  const showImport = cloud && hasLocalData && offered !== user?.uid;

  const [authOpen, setAuthOpen] = useState(false);

  if (!authReady) return <div className="splash"><p>HisabPro…</p></div>;
  if (locked) {
    return <PinLock scope={scope} onUnlock={() => { lastActive.current = Date.now(); markUnlocked(); }} />;
  }

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: t('navHome'), icon: <IconHome /> },
    { id: 'customers', label: t('navCustomers'), icon: <IconUsers /> },
    { id: 'reports', label: t('navReports'), icon: <IconChart /> },
    { id: 'settings', label: t('navSettings'), icon: <IconSettings /> },
  ];

  const syncLabel = { local: t('syncLocal'), synced: t('syncSynced'), pending: t('syncPending'), offline: t('syncOffline'), error: t('syncError') }[sync];

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo" aria-hidden="true">₹</span>
          <div className="grow">
            <strong className="brand-name">{profile.businessName || 'HisabPro'}</strong>
            <span className={`sync ${sync}`} role="status">{syncLabel}</span>
          </div>
        </div>
        <div className="top-actions">
          <button className="chip" onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')} aria-label={t('language')}>
            {lang === 'hi' ? 'EN' : 'हिं'}
          </button>
          {!cloud && (
            <button className="chip on" onClick={() => setAuthOpen(true)}>{t('signIn')}</button>
          )}
        </div>
      </header>

      {!cloud && route.tab !== 'settings' && <p className="banner">{t('guestBanner')}</p>}

      <main id="main">
        {route.customerId ? (
          <CustomerDetail id={route.customerId} />
        ) : route.tab === 'home' ? (
          <Dashboard />
        ) : route.tab === 'customers' ? (
          <CustomerList />
        ) : route.tab === 'reports' ? (
          <Reports />
        ) : (
          <Settings scope={scope} onPinChanged={markUnlocked} />
        )}
      </main>

      <nav className="tabs" aria-label="Main">
        {tabs.map((x) => (
          <button
            key={x.id}
            className={route.tab === x.id ? 'on' : ''}
            aria-current={route.tab === x.id ? 'page' : undefined}
            onClick={() => goto(x.id)}
          >
            {x.icon}
            <span>{x.label}</span>
          </button>
        ))}
      </nav>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {showImport && (
        <div className="overlay">
          <div className="sheet" role="dialog" aria-modal="true" aria-label={t('importLocalTitle')}>
            <h2>{t('importLocalTitle')}</h2>
            <p>{t('importLocalBody')}</p>
            <div className="actions">
              <button className="ghost" onClick={() => setOffered(user!.uid)}>{t('notNow')}</button>
              <button className="ghost" onClick={() => window.confirm(t('confirmDiscardLocal')) && discardLocal()}>{t('discardLocal')}</button>
              <button
                className="primary"
                onClick={() => importLocalToCloud().then(() => setOffered(user!.uid)).catch(() => toast(t('errGeneric'), 'err'))}
              >
                {t('importLocalBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toasts />
    </div>
  );
};

export const App: React.FC = () => (
  <StoreProvider>
    <Shell />
  </StoreProvider>
);
