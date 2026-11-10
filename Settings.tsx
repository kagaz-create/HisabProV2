import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { Field } from './ui';
import { AuthModal } from './AuthScreen';
import { PinSetup } from './PinLock';
import { getPin, setAutoLock } from '../lib/pin';
import { LIMITS, Profile } from '../lib/types';
import { isValidPhone } from '../lib/format';

export const Settings: React.FC<{ scope: string; onPinChanged: () => void }> = ({ scope, onPinChanged }) => {
  const {
    t, lang, setLang, user, cloud, profile, saveProfile, exportBackup, importBackup, loadSample, eraseLocal,
    hasLocalData, importLocalToCloud, discardLocal, signOut, toast, customers,
  } = useStore();

  const [form, setForm] = useState<Profile>(profile);
  const [dirtyFrom, setDirtyFrom] = useState(profile);
  // when the stored profile changes (e.g. after sign-in) and the form was untouched, follow it
  if (profile !== dirtyFrom) {
    setDirtyFrom(profile);
    setForm(profile);
  }
  const [err, setErr] = useState('');
  const [auth, setAuth] = useState(false);
  const [pinMode, setPinMode] = useState<null | 'set' | 'change' | 'off'>(null);
  const [, bump] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const pin = getPin(scope);

  const upd = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phone.trim() && !isValidPhone(form.phone)) return setErr(t('errPhone'));
    setErr('');
    saveProfile(form);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return toast(t('importFail'), 'err');
    try {
      const r = await importBackup(await f.text());
      toast(t('importDone', { c: r.customers, x: r.txs, s: r.skipped }));
    } catch {
      toast(t('importFail'), 'err');
    }
  };

  return (
    <div className="stack">
      {/* account */}
      <section className="card">
        <h2 className="h2">{t('account')}</h2>
        {cloud ? (
          <>
            <p>{t('signedInAs')} <b>{user?.email}</b></p>
            <p className="hint">{t('cloudNote')}</p>
            <button className="ghost" onClick={() => signOut()}>{t('signOut')}</button>
          </>
        ) : (
          <>
            <p className="hint">{t('guestNote')}</p>
            <button className="primary" onClick={() => setAuth(true)}>{t('signInToBackup')}</button>
          </>
        )}
        {cloud && hasLocalData && (
          <div className="notice">
            <p>{t('importLocalBody')}</p>
            <div className="actions">
              <button className="ghost" onClick={() => window.confirm(t('confirmDiscardLocal')) && discardLocal()}>{t('discardLocal')}</button>
              <button className="primary" onClick={() => importLocalToCloud().catch(() => toast(t('errGeneric'), 'err'))}>{t('importLocalBtn')}</button>
            </div>
          </div>
        )}
      </section>

      {/* language */}
      <section className="card">
        <h2 className="h2">{t('language')}</h2>
        <div className="seg" role="group" aria-label={t('language')}>
          <button className={lang === 'hi' ? 'on' : ''} aria-pressed={lang === 'hi'} onClick={() => setLang('hi')}>हिन्दी</button>
          <button className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
        </div>
      </section>

      {/* profile */}
      <section className="card">
        <h2 className="h2">{t('businessProfile')}</h2>
        <form className="form" onSubmit={onSave} noValidate>
          <Field label={t('businessName')}><input value={form.businessName} onChange={upd('businessName')} maxLength={LIMITS.businessName} /></Field>
          <Field label={t('ownerName')}><input value={form.ownerName} onChange={upd('ownerName')} maxLength={LIMITS.ownerName} /></Field>
          <Field label={t('phone')}><input value={form.phone} onChange={upd('phone')} inputMode="tel" maxLength={LIMITS.phone} /></Field>
          <Field label={t('address')}><input value={form.address} onChange={upd('address')} maxLength={LIMITS.address} /></Field>
          <Field label={t('upiId')} hint={t('upiHint')}><input value={form.upiId} onChange={upd('upiId')} maxLength={LIMITS.upiId} autoCapitalize="none" /></Field>
          {err && <p className="error" role="alert">{err}</p>}
          <button className="primary" type="submit">{t('save')}</button>
        </form>
      </section>

      {/* lock */}
      <section className="card">
        <h2 className="h2">{t('appLock')}</h2>
        <p className="hint">{t('appLockNote')}</p>
        {pin ? (
          <>
            <Field label={t('autoLock')}>
              <select
                value={pin.autoLockMin}
                onChange={(e) => {
                  setAutoLock(scope, Number(e.target.value));
                  bump((n) => n + 1);
                  onPinChanged();
                }}
              >
                <option value={0}>{t('immediately')}</option>
                <option value={1}>{t('minutes', { n: 1 })}</option>
                <option value={5}>{t('minutes', { n: 5 })}</option>
                <option value={15}>{t('minutes', { n: 15 })}</option>
              </select>
            </Field>
            <div className="actions">
              <button className="ghost" onClick={() => setPinMode('change')}>{t('changePin')}</button>
              <button className="danger" onClick={() => setPinMode('off')}>{t('disablePin')}</button>
            </div>
          </>
        ) : (
          <button className="primary" onClick={() => setPinMode('set')}>{t('setPin')}</button>
        )}
      </section>

      {/* backup */}
      <section className="card">
        <h2 className="h2">{t('backup')}</h2>
        <div className="actions left">
          <button className="ghost" onClick={exportBackup}>{t('exportBackup')}</button>
          <button className="ghost" onClick={() => fileRef.current?.click()}>{t('importBackup')}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
        </div>
        <p className="hint">{t('backupNote')}</p>
      </section>

      {/* guest-only tools */}
      {!cloud && (
        <section className="card">
          <h2 className="h2">{t('localData')}</h2>
          <div className="actions left">
            <button className="ghost" onClick={loadSample}>{t('loadSample')}</button>
            <button
              className="danger"
              disabled={!hasLocalData}
              onClick={() => window.confirm(t('confirmEraseLocal', { n: customers.length })) && eraseLocal()}
            >
              {t('eraseLocal')}
            </button>
          </div>
        </section>
      )}

      <p className="muted center small">HisabPro v2.0</p>

      {auth && <AuthModal onClose={() => setAuth(false)} />}
      {pinMode && (
        <PinSetup
          scope={scope}
          mode={pinMode}
          onClose={() => {
            setPinMode(null);
            bump((n) => n + 1);
            onPinChanged();
          }}
        />
      )}
    </div>
  );
};
