import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { clearPin, getPin, setPin, verifyPin } from '../lib/pin';
import { Field, Modal } from './ui';
import { IconLock } from './Icons';

/* ------------------------------------------------------------- lock screen */

export const PinLock: React.FC<{ scope: string; onUnlock: () => void }> = ({ scope, onUnlock }) => {
  const { t, user, reauthenticate, authMessage, signOut } = useStore();
  const rec = getPin(scope);
  const len = rec?.len ?? 4;
  const [pin, setPinValue] = useState('');
  const [msg, setMsg] = useState('');
  const [lockedMs, setLockedMs] = useState(() => Math.max(0, (rec?.lockedUntil ?? 0) - Date.now()));
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (lockedMs <= 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, (getPin(scope)?.lockedUntil ?? 0) - Date.now());
      setLockedMs(left);
      if (left === 0) setMsg('');
    }, 500);
    return () => clearInterval(id);
  }, [lockedMs > 0, scope]); // eslint-disable-line react-hooks/exhaustive-deps

  const press = async (digit: string) => {
    if (busy || lockedMs > 0) return;
    const next = (pin + digit).slice(0, len);
    setPinValue(next);
    if (next.length < len) return;
    setBusy(true);
    const r = await verifyPin(scope, next);
    setBusy(false);
    setPinValue('');
    if (r.ok) return onUnlock();
    if (r.lockedMs > 0) {
      setLockedMs(r.lockedMs);
      setMsg(t('pinLockedWait'));
    } else {
      setMsg(t('pinWrong', { n: r.attemptsLeft }));
    }
  };

  const back = () => setPinValue((p) => p.slice(0, -1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (forgot) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const secs = Math.ceil(lockedMs / 1000);

  return (
    <div className="lock" role="dialog" aria-modal="true" aria-label={t('appLocked')}>
      <div className="lock-card">
        <span className="lock-icon"><IconLock size={30} /></span>
        <h1 className="h1">{t('appLocked')}</h1>
        <p className="muted">{t('enterPin')}</p>
        <div className="dots" aria-label={`${pin.length}/${len}`}>
          {Array.from({ length: len }, (_, i) => (
            <span key={i} className={i < pin.length ? 'dot on' : 'dot'} />
          ))}
        </div>
        <p className="error min" role="alert">
          {lockedMs > 0 ? t('pinTryAgainIn', { s: secs }) : msg}
        </p>
        <div className="pad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} onClick={() => press(d)} disabled={lockedMs > 0} aria-label={d}>{d}</button>
          ))}
          <span />
          <button onClick={() => press('0')} disabled={lockedMs > 0} aria-label="0">0</button>
          <button onClick={back} aria-label={t('backspace')}>⌫</button>
        </div>
        <button className="link" onClick={() => setForgot(true)}>{t('forgotPin')}</button>
      </div>
      {forgot && (
        <ForgotPin
          scope={scope}
          signedIn={!!user}
          onClose={() => setForgot(false)}
          onDone={() => {
            clearPin(scope);
            onUnlock();
          }}
          reauthenticate={reauthenticate}
          authMessage={authMessage}
          signOut={signOut}
        />
      )}
    </div>
  );
};

const ForgotPin: React.FC<{
  scope: string;
  signedIn: boolean;
  onClose: () => void;
  onDone: () => void;
  reauthenticate: (pw?: string) => Promise<void>;
  authMessage: (e: unknown) => string;
  signOut: () => Promise<void>;
}> = ({ signedIn, onClose, onDone, reauthenticate, authMessage }) => {
  const { t, user } = useStore();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const usesPassword = !!user?.providerData.some((p) => p.providerId === 'password');

  if (!signedIn) {
    // Guest mode: there is no account to prove ownership with. Resetting means erasing the local data.
    return (
      <Modal title={t('forgotPin')} onClose={onClose}>
        <div className="form">
          <p>{t('forgotPinGuest')}</p>
          <div className="actions">
            <button className="ghost" onClick={onClose}>{t('cancel')}</button>
            <button
              className="danger"
              onClick={() => {
                try {
                  localStorage.removeItem('hisabpro:v2:local');
                } catch { /* ignore */ }
                onDone();
                window.location.reload();
              }}
            >
              {t('eraseAndReset')}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await reauthenticate(usesPassword ? pw : undefined); // throws unless the account really is verified
      onDone();
    } catch (ex) {
      setErr(authMessage(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={t('forgotPin')} onClose={onClose}>
      <form className="form" onSubmit={go}>
        <p>{usesPassword ? t('forgotPinPassword') : t('forgotPinGoogle')}</p>
        {usesPassword && (
          <Field label={t('password')}>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          </Field>
        )}
        {err && <p className="error" role="alert">{err}</p>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="primary" disabled={busy || (usesPassword && !pw)}>{busy ? t('wait') : t('verifyAndReset')}</button>
        </div>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------ set / change / off */

export const PinSetup: React.FC<{ scope: string; mode: 'set' | 'change' | 'off'; onClose: () => void }> = ({ scope, mode, onClose }) => {
  const { t, toast } = useStore();
  const existing = getPin(scope);
  const [len, setLen] = useState<4 | 6>(existing?.len ?? 4);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode !== 'set') {
        const r = await verifyPin(scope, current);
        if (!r.ok) return setErr(r.lockedMs > 0 ? t('pinLockedWait') : t('pinWrong', { n: r.attemptsLeft }));
      }
      if (mode === 'off') {
        clearPin(scope);
        toast(t('pinOff'), 'info');
        return onClose();
      }
      if (next.length !== len) return setErr(t('pinLenError', { n: len }));
      if (next !== again) return setErr(t('pinMismatch'));
      await setPin(scope, next, len);
      toast(t('pinSaved'));
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={mode === 'set' ? t('setPin') : mode === 'change' ? t('changePin') : t('disablePin')} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {mode !== 'set' && (
          <Field label={t('currentPin')}>
            <input type="password" inputMode="numeric" value={current} onChange={(e) => setCurrent(digits(e.target.value))} autoComplete="off" />
          </Field>
        )}
        {mode !== 'off' && (
          <>
            <div className="seg" role="group" aria-label={t('pinLength')}>
              <button type="button" className={len === 4 ? 'on' : ''} aria-pressed={len === 4} onClick={() => { setLen(4); setNext(''); setAgain(''); }}>4</button>
              <button type="button" className={len === 6 ? 'on' : ''} aria-pressed={len === 6} onClick={() => { setLen(6); setNext(''); setAgain(''); }}>6</button>
            </div>
            <Field label={t('newPin')}>
              <input type="password" inputMode="numeric" value={next} onChange={(e) => setNext(digits(e.target.value).slice(0, len))} autoComplete="off" />
            </Field>
            <Field label={t('confirmPin')}>
              <input type="password" inputMode="numeric" value={again} onChange={(e) => setAgain(digits(e.target.value).slice(0, len))} autoComplete="off" />
            </Field>
          </>
        )}
        {err && <p className="error" role="alert">{err}</p>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className={mode === 'off' ? 'danger' : 'primary'} disabled={busy}>
            {mode === 'off' ? t('disablePin') : t('save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
