import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatDate, inr, round2, todayISO } from '../lib/format';
import { goto } from '../lib/nav';
import { TxType } from '../lib/types';
import { TxForm } from './Forms';
import { Empty } from './ui';

export const Dashboard: React.FC = () => {
  const { t, lang, customers, txs, loading } = useStore();
  const [form, setForm] = useState<TxType | null>(null);

  const s = useMemo(() => {
    const today = todayISO();
    let toReceive = 0;
    let toGive = 0;
    let dueCount = 0;
    for (const c of customers) {
      if (c.balance > 0) {
        toReceive += c.balance;
        dueCount++;
      } else if (c.balance < 0) toGive += -c.balance;
    }
    let tu = 0;
    let tj = 0;
    for (const x of txs) {
      if (x.date !== today) continue;
      if (x.type === 'udhar') tu += x.amount;
      else tj += x.amount;
    }
    return { toReceive: round2(toReceive), toGive: round2(toGive), dueCount, tu: round2(tu), tj: round2(tj) };
  }, [customers, txs]);

  const nameOf = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);
  const recent = useMemo(
    () =>
      [...txs]
        .filter((x) => nameOf.has(x.customerId))
        .sort((a, b) => (b.date + b.time + b.createdAt).localeCompare(a.date + a.time + a.createdAt))
        .slice(0, 8),
    [txs, nameOf]
  );

  if (loading) return <p className="muted center pad">{t('loading')}</p>;

  return (
    <div className="stack">
      <section className="hero" aria-label={t('toReceive')}>
        <span className="hero-label">{t('toReceive')}</span>
        <strong className="hero-amt">{inr(s.toReceive)}</strong>
        <span className="hero-sub">{t('fromNCustomers', { n: s.dueCount })}</span>
      </section>

      <div className="grid2">
        <div className="stat">
          <span className="stat-label">{t('todayUdhar')}</span>
          <strong className="red">{inr(s.tu)}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">{t('todayJama')}</span>
          <strong className="green">{inr(s.tj)}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">{t('toGive')}</span>
          <strong>{inr(s.toGive)}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">{t('navCustomers')}</span>
          <strong>{customers.length}</strong>
        </div>
      </div>

      <div className="quick">
        <button className="big red" onClick={() => setForm('udhar')} disabled={customers.length === 0}>
          {t('giveUdhar')}
        </button>
        <button className="big green" onClick={() => setForm('jama')} disabled={customers.length === 0}>
          {t('gotJama')}
        </button>
      </div>

      {customers.length === 0 ? (
        <Empty
          text={t('emptyStart')}
          action={
            <button className="primary" onClick={() => goto('customers')}>
              {t('addCustomer')}
            </button>
          }
        />
      ) : (
        <section>
          <h2 className="h2">{t('recentEntries')}</h2>
          {recent.length === 0 ? (
            <p className="muted">{t('noEntries')}</p>
          ) : (
            <ul className="list">
              {recent.map((x) => (
                <li key={x.id}>
                  <button className="row-btn" onClick={() => goto('c/' + x.customerId)}>
                    <span className="grow">
                      <span className="title">{nameOf.get(x.customerId)}</span>
                      <span className="sub">
                        {formatDate(x.date, lang)}
                        {x.description ? ' · ' + x.description : ''}
                      </span>
                    </span>
                    <span className={x.type === 'udhar' ? 'red amt' : 'green amt'}>
                      {x.type === 'udhar' ? '−' : '+'}
                      {inr(x.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {form && <TxForm type={form} onClose={() => setForm(null)} />}
    </div>
  );
};
