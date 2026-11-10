import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { inr } from '../lib/format';
import { IconX } from './Icons';

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  const { t } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // focus the first field
    const first = ref.current?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, button.primary');
    first?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('close')} type="button">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="field">
    <span className="field-label">{label}</span>
    {children}
    {hint ? <span className="field-hint">{hint}</span> : null}
  </label>
);

/** Colour + words, never colour alone. */
export const BalanceText: React.FC<{ balance: number; big?: boolean }> = ({ balance, big }) => {
  const { t } = useStore();
  const cls = balance > 0 ? 'due' : balance < 0 ? 'adv' : 'ok';
  const word = balance > 0 ? t('due') : balance < 0 ? t('advance') : t('settled');
  return (
    <span className={`bal ${cls} ${big ? 'xl' : ''}`}>
      <span className="bal-amt">{inr(Math.abs(balance))}</span>
      <span className="bal-word">{word}</span>
    </span>
  );
};

export const Empty: React.FC<{ text: string; action?: React.ReactNode }> = ({ text, action }) => (
  <div className="empty">
    <p>{text}</p>
    {action}
  </div>
);

export const Toasts: React.FC = () => {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite" role="status">
      {toasts.map((x) => (
        <div key={x.id} className={`toast ${x.kind}`}>
          {x.msg}
        </div>
      ))}
    </div>
  );
};
