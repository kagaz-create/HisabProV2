import React, { useState } from 'react';
import { useStore } from '../store';
import { Modal, Field } from './ui';

export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, signInEmail, signUpEmail, signInGoogle, resetPassword, authMessage } = useStore();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(authMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pw) return setErr(t('errFillAll'));
    if (mode === 'up' && pw.length < 6) return setErr(t('errWeakPassword'));
    run(async () => {
      if (mode === 'in') await signInEmail(email, pw);
      else await signUpEmail(email, pw, name);
      onClose();
    });
  };

  return (
    <Modal title={mode === 'in' ? t('signIn') : t('createAccount')} onClose={onClose}>
      <form onSubmit={submit} className="form" noValidate>
        <button type="button" className="google" disabled={busy} onClick={() => run(async () => { await signInGoogle(); onClose(); })}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
            <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          {t('continueGoogle')}
        </button>
        <div className="or"><span>{t('or')}</span></div>
        {mode === 'up' && (
          <Field label={t('yourName')}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" />
          </Field>
        )}
        <Field label={t('email')}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
        </Field>
        <Field label={t('password')}>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
        </Field>
        {err && <p className="error" role="alert">{err}</p>}
        {info && <p className="ok-text" role="status">{info}</p>}
        <button type="submit" className="primary wide" disabled={busy}>
          {busy ? t('wait') : mode === 'in' ? t('signIn') : t('createAccount')}
        </button>
        {mode === 'in' && (
          <button
            type="button"
            className="link"
            disabled={busy}
            onClick={() => {
              if (!email.trim()) return setErr(t('errEmailFirst'));
              run(async () => {
                await resetPassword(email);
                setInfo(t('resetSent'));
              });
            }}
          >
            {t('forgotPassword')}
          </button>
        )}
        <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); setInfo(''); }}>
          {mode === 'in' ? t('noAccount') : t('haveAccount')}
        </button>
      </form>
    </Modal>
  );
};
