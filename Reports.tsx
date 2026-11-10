import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { addDaysISO, downloadBlob, formatDate, inr, round2, todayISO } from '../lib/format';
import { buildCsv } from '../lib/backup';
import { goto } from '../lib/nav';
import { IconDownload } from './Icons';

type Period = 'today' | '7d' | '30d' | 'month' | 'all';

export const Reports: React.FC = () => {
  const { t, lang, customers, txs, loading } = useStore();
  const [period, setPeriod] = useState<Period>('30d');

  const nameOf = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);

  const range = useMemo(() => {
    const today = todayISO();
    switch (period) {
      case 'today':
        return { from: today, to: today };
      case '7d':
        return { from: addDaysISO(today, -6), to: today };
      case '30d':
        return { from: addDaysISO(today, -29), to: today };
      case 'month':
        return { from: today.slice(0, 8) + '01', to: today };
      default:
        return { from: '0000-01-01', to: '9999-12-31' };
    }
  }, [period]);

  const inRange = useMemo(
    () =>
      txs
        .filter((x) => nameOf.has(x.customerId) && x.date >= range.from && x.date <= range.to)
        .sort((a, b) => (b.date + b.time + b.createdAt).localeCompare(a.date + a.time + a.createdAt)),
    [txs, nameOf, range]
  );

  const totals = useMemo(() => {
    let u = 0;
    let j = 0;
    for (const x of inRange) {
      if (x.type === 'udhar') u += x.amount;
      else j += x.amount;
    }
    return { u: round2(u), j: round2(j), net: round2(u - j) };
  }, [inRange]);

  const top = useMemo(
    () => [...customers].filter((c) => c.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 10),
    [customers]
  );

  if (loading) return <p className="muted center pad">{t('loading')}</p>;

  const periods: Period[] = ['today', '7d', '30d', 'month', 'all'];

  return (
    <div className="stack">
      <div className="chips" role="group" aria-label={t('period')}>
        {periods.map((p) => (
          <button key={p} className={'chip ' + (period === p ? 'on' : '')} aria-pressed={period === p} onClick={() => setPeriod(p)}>
            {t('period_' + p)}
          </button>
        ))}
      </div>

      <div className="grid2">
        <div className="stat">
          <span className="stat-label">{t('totalUdhar')}</span>
          <strong className="red">{inr(totals.u)}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">{t('totalJama')}</span>
          <strong className="green">{inr(totals.j)}</strong>
        </div>
        <div className="stat span2">
          <span className="stat-label">{t('netInPeriod')}</span>
          <strong>
            {totals.net >= 0 ? '+' : '−'}
            {inr(Math.abs(totals.net))}
          </strong>
          <span className="sub">{t('netHelp')}</span>
        </div>
      </div>

      <section>
        <h2 className="h2">{t('topPending')}</h2>
        {top.length === 0 ? (
          <p className="muted">{t('nobodyOwes')}</p>
        ) : (
          <ol className="list ranked">
            {top.map((c, i) => (
              <li key={c.id}>
                <button className="row-btn" onClick={() => goto('c/' + c.id)}>
                  <span className="rank">{i + 1}</span>
                  <span className="grow title">{c.name}</span>
                  <span className="red amt">{inr(c.balance)}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <div className="between">
          <h2 className="h2">
            {t('entries')} ({inRange.length})
          </h2>
          <button
            className="chip"
            disabled={inRange.length === 0}
            onClick={() =>
              downloadBlob(
                `HisabPro_${todayISO()}.csv`,
                new Blob([buildCsv([...inRange].reverse(), (id) => nameOf.get(id) || '')], { type: 'text/csv;charset=utf-8' })
              )
            }
          >
            <IconDownload size={16} /> CSV
          </button>
        </div>
        {inRange.length === 0 ? (
          <p className="muted">{t('noEntries')}</p>
        ) : (
          <ul className="list">
            {inRange.slice(0, 100).map((x) => (
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
        {inRange.length > 100 && <p className="hint">{t('showing100')}</p>}
      </section>
    </div>
  );
};
