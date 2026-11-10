import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { cleanPhone, downloadBlob, formatDate, inr, isValidPhone, reminderUrl, round2, safeFileName } from '../lib/format';
import { goto } from '../lib/nav';
import { buildStatementPdf } from '../lib/pdf';
import { Transaction, TxType } from '../lib/types';
import { CustomerForm, TxForm } from './Forms';
import { BalanceText, Empty } from './ui';
import { IconBack, IconChat, IconDownload, IconEdit, IconPhone, IconShare, IconTrash } from './Icons';

export const CustomerDetail: React.FC<{ id: string }> = ({ id }) => {
  const { t, lang, customers, txs, profile, loading, deleteCustomer, toast } = useStore();
  const customer = customers.find((c) => c.id === id);
  const [form, setForm] = useState<TxType | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const mine = txs
      .filter((x) => x.customerId === id)
      .sort((a, b) => (a.date + a.time + a.createdAt).localeCompare(b.date + b.time + b.createdAt));
    let run = 0;
    const withBal = mine.map((x) => {
      run = round2(run + (x.type === 'udhar' ? x.amount : -x.amount));
      return { x, bal: run };
    });
    return withBal.reverse(); // newest first
  }, [txs, id]);

  if (loading) return <p className="muted center pad">{t('loading')}</p>;
  if (!customer) {
    return (
      <Empty
        text={t('customerNotFound')}
        action={
          <button className="primary" onClick={() => goto('customers')}>
            {t('back')}
          </button>
        }
      />
    );
  }

  const makePdf = async (share: boolean) => {
    setBusy(true);
    try {
      const blob = await buildStatementPdf({
        customer,
        txs: rows.map((r) => r.x),
        profile,
        lang,
        modeLabel: (m) => t('mode_' + m),
      });
      const name = `${safeFileName(customer.name)}_${t('statementFile')}.pdf`;
      const file = new File([blob], name, { type: 'application/pdf' });
      const nav = navigator as any;
      if (share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: name });
          return;
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
        }
      }
      downloadBlob(name, blob);
      toast(t('pdfReady'));
    } catch {
      toast(t('errPdf'), 'err');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (window.confirm(t('confirmDeleteCustomer', { name: customer.name }))) {
      deleteCustomer(customer.id);
      goto('customers');
    }
  };

  const canSharePdf = typeof navigator !== 'undefined' && !!(navigator as any).canShare;

  return (
    <div className="stack">
      <div className="detail-head">
        <button className="icon-btn" onClick={() => history.length > 1 ? history.back() : goto('customers')} aria-label={t('back')}>
          <IconBack />
        </button>
        <div className="grow">
          <h1 className="h1">{customer.name}</h1>
          {customer.phone && <span className="sub">{customer.phone}</span>}
        </div>
        <button className="icon-btn" onClick={() => setEditing(true)} aria-label={t('editCustomer')}>
          <IconEdit />
        </button>
        <button className="icon-btn danger-text" onClick={remove} aria-label={t('delete')}>
          <IconTrash />
        </button>
      </div>

      <section className="hero small" aria-label={t('balance')}>
        <BalanceText balance={customer.balance} big />
        <div className="hero-split">
          <span>{t('totalUdhar')}: <b className="red">{inr(customer.udhar)}</b></span>
          <span>{t('totalJama')}: <b className="green">{inr(customer.jama)}</b></span>
        </div>
        {customer.notes && <p className="note">{customer.notes}</p>}
      </section>

      <div className="quick">
        <button className="big red" onClick={() => setForm('udhar')}>{t('giveUdhar')}</button>
        <button className="big green" onClick={() => setForm('jama')}>{t('gotJama')}</button>
      </div>

      <div className="chips">
        {customer.phone && isValidPhone(customer.phone) && (
          <a className="chip" href={`tel:+91${cleanPhone(customer.phone)}`}>
            <IconPhone size={16} /> {t('call')}
          </a>
        )}
        {customer.balance > 0 && (
          <a className="chip" href={reminderUrl(customer, profile, lang)} target="_blank" rel="noopener noreferrer">
            <IconChat size={16} /> {t('sendReminder')}
          </a>
        )}
        <button className="chip" onClick={() => makePdf(false)} disabled={busy}>
          <IconDownload size={16} /> {busy ? t('wait') : t('statementPdf')}
        </button>
        {canSharePdf && (
          <button className="chip" onClick={() => makePdf(true)} disabled={busy}>
            <IconShare size={16} /> {t('sharePdf')}
          </button>
        )}
      </div>
      {customer.balance > 0 && !isValidPhone(customer.phone) && <p className="hint">{t('reminderNoPhone')}</p>}

      <section>
        <h2 className="h2">{t('ledger')}</h2>
        {rows.length === 0 ? (
          <p className="muted">{t('noEntries')}</p>
        ) : (
          <ul className="list">
            {rows.map(({ x, bal }) => (
              <li key={x.id}>
                <button className="row-btn" onClick={() => setEditTx(x)} aria-label={t('editEntry')}>
                  <span className="grow">
                    <span className="title">{x.description || (x.type === 'udhar' ? t('giveUdhar') : t('gotJama'))}</span>
                    <span className="sub">
                      {formatDate(x.date, lang)} · {t('mode_' + x.paymentMode)}
                      {x.billNumber ? ` · ${t('billNo')} ${x.billNumber}` : ''}
                    </span>
                  </span>
                  <span className="right">
                    <span className={x.type === 'udhar' ? 'red amt' : 'green amt'}>
                      {x.type === 'udhar' ? '−' : '+'}
                      {inr(x.amount)}
                    </span>
                    <span className="sub">{t('balance')}: {inr(Math.abs(bal))}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {form && <TxForm type={form} customerId={customer.id} onClose={() => setForm(null)} />}
      {editTx && <TxForm tx={editTx} onClose={() => setEditTx(null)} />}
      {editing && <CustomerForm customer={customer} onClose={() => setEditing(false)} />}
    </div>
  );
};
