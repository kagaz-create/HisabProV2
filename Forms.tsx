import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Field, Modal } from './ui';
import { isValidPhone, nowTime, todayISO } from '../lib/format';
import { Customer, LIMITS, PAY_MODES, PayMode, Transaction, TxType } from '../lib/types';

/* ----------------------------------------------------------------- customer */

export const CustomerForm: React.FC<{ customer?: Customer; onClose: () => void; onSaved?: (id: string) => void }> = ({
  customer,
  onClose,
  onSaved,
}) => {
  const { t, addCustomer, updateCustomer } = useStore();
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [openType, setOpenType] = useState<TxType>('udhar');
  const [openAmt, setOpenAmt] = useState('');
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr(t('errNameRequired'));
    if (phone.trim() && !isValidPhone(phone)) return setErr(t('errPhone'));
    const input = { name, phone: phone.trim(), address, notes };
    if (customer) {
      updateCustomer(customer.id, input);
      onClose();
      return;
    }
    const amt = openAmt.trim() ? Number(openAmt) : 0;
    if (openAmt.trim() && (!Number.isFinite(amt) || amt <= 0 || amt > LIMITS.maxAmount)) return setErr(t('errAmount'));
    const id = addCustomer(input, amt > 0 ? { type: openType, amount: amt } : undefined);
    onSaved?.(id);
    onClose();
  };

  return (
    <Modal title={customer ? t('editCustomer') : t('addCustomer')} onClose={onClose}>
      <form onSubmit={submit} className="form" noValidate>
        <Field label={t('customerName') + ' *'}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.name} autoComplete="off" />
        </Field>
        <Field label={t('phone')}>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={LIMITS.phone} placeholder="98XXXXXXXX" autoComplete="off" />
        </Field>
        <Field label={t('address')}>
          <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={LIMITS.address} />
        </Field>
        <Field label={t('notes')}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={LIMITS.notes} rows={2} />
        </Field>
        {!customer && (
          <div className="opening">
            <span className="field-label">{t('openingBalance')}</span>
            <div className="seg" role="group" aria-label={t('openingBalance')}>
              <button type="button" className={openType === 'udhar' ? 'on red' : ''} aria-pressed={openType === 'udhar'} onClick={() => setOpenType('udhar')}>
                {t('theyOwe')}
              </button>
              <button type="button" className={openType === 'jama' ? 'on green' : ''} aria-pressed={openType === 'jama'} onClick={() => setOpenType('jama')}>
                {t('iOwe')}
              </button>
            </div>
            <input value={openAmt} onChange={(e) => setOpenAmt(e.target.value)} inputMode="decimal" placeholder="₹ 0" aria-label={t('amount')} />
          </div>
        )}
        {err && <p className="error" role="alert">{err}</p>}
        <div className="actions">
          <button type="button" className="ghost" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="primary">{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------- transaction */

export const TxForm: React.FC<{
  type?: TxType;
  customerId?: string;
  tx?: Transaction;
  onClose: () => void;
}> = ({ type: initialType = 'udhar', customerId, tx, onClose }) => {
  const { t, customers, addTx, updateTx, deleteTx } = useStore();
  const [type, setType] = useState<TxType>(tx?.type ?? initialType);
  const [cid, setCid] = useState(tx?.customerId ?? customerId ?? '');
  const [amount, setAmount] = useState(tx ? String(tx.amount) : '');
  const [date, setDate] = useState(tx?.date ?? todayISO());
  const [description, setDescription] = useState(tx?.description ?? '');
  const [bill, setBill] = useState(tx?.billNumber ?? '');
  const [mode, setMode] = useState<PayMode>(tx?.paymentMode ?? 'cash');
  const [err, setErr] = useState('');

  const sorted = useMemo(() => [...customers].sort((a, b) => a.name.localeCompare(b.name)), [customers]);
  const fixedCustomer = !!(customerId || tx);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!cid) return setErr(t('errPickCustomer'));
    if (!Number.isFinite(amt) || amt <= 0 || amt > LIMITS.maxAmount) return setErr(t('errAmount'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setErr(t('errDate'));
    const row = { customerId: cid, type, amount: amt, date, time: tx?.time ?? nowTime(), description, billNumber: bill, paymentMode: mode };
    if (tx) updateTx(tx.id, row);
    else addTx(row);
    onClose();
  };

  const remove = () => {
    if (tx && window.confirm(t('confirmDeleteEntry'))) {
      deleteTx(tx.id);
      onClose();
    }
  };

  return (
    <Modal title={tx ? t('editEntry') : type === 'udhar' ? t('giveUdhar') : t('gotJama')} onClose={onClose}>
      <form onSubmit={submit} className="form" noValidate>
        <div className="seg" role="group" aria-label={t('entryType')}>
          <button type="button" className={type === 'udhar' ? 'on red' : ''} aria-pressed={type === 'udhar'} onClick={() => setType('udhar')}>
            {t('giveUdhar')}
          </button>
          <button type="button" className={type === 'jama' ? 'on green' : ''} aria-pressed={type === 'jama'} onClick={() => setType('jama')}>
            {t('gotJama')}
          </button>
        </div>
        {!fixedCustomer && (
          <Field label={t('customer') + ' *'}>
            <select value={cid} onChange={(e) => setCid(e.target.value)}>
              <option value="">{t('selectCustomer')}</option>
              {sorted.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t('amount') + ' (₹) *'}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" autoComplete="off" className="amount-input" />
        </Field>
        <div className="row2">
          <Field label={t('date')}>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t('paymentMode')}>
            <select value={mode} onChange={(e) => setMode(e.target.value as PayMode)}>
              {PAY_MODES.map((m) => (
                <option key={m} value={m}>{t('mode_' + m)}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t('description')}>
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={LIMITS.description} autoComplete="off" />
        </Field>
        <Field label={t('billNo')}>
          <input value={bill} onChange={(e) => setBill(e.target.value)} maxLength={LIMITS.billNumber} autoComplete="off" />
        </Field>
        {err && <p className="error" role="alert">{err}</p>}
        <div className="actions">
          {tx && (
            <button type="button" className="danger" onClick={remove}>{t('delete')}</button>
          )}
          <button type="button" className="ghost" onClick={onClose}>{t('cancel')}</button>
          <button type="submit" className="primary">{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
};
