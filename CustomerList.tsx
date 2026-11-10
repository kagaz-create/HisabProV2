import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { cleanPhone, isValidPhone, reminderUrl } from '../lib/format';
import { goto } from '../lib/nav';
import { CustomerForm } from './Forms';
import { BalanceText, Empty } from './ui';
import { IconChat, IconPlus, IconSearch } from './Icons';

type Sort = 'balance' | 'name' | 'recent';

export const CustomerList: React.FC = () => {
  const { t, lang, customers, profile, loading } = useStore();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('balance');
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, '');
    const f = customers.filter(
      (c) => !needle || c.name.toLowerCase().includes(needle) || (digits.length >= 3 && cleanPhone(c.phone).includes(digits))
    );
    const by: Record<Sort, (a: (typeof f)[0], b: (typeof f)[0]) => number> = {
      balance: (a, b) => b.balance - a.balance || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
      recent: (a, b) => (b.lastDate || '').localeCompare(a.lastDate || '') || a.name.localeCompare(b.name),
    };
    return [...f].sort(by[sort]);
  }, [customers, q, sort]);

  if (loading) return <p className="muted center pad">{t('loading')}</p>;

  return (
    <div className="stack">
      <div className="toolbar">
        <label className="search">
          <IconSearch size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('search')} />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t('sortBy')}>
          <option value="balance">{t('sortBalance')}</option>
          <option value="name">{t('sortName')}</option>
          <option value="recent">{t('sortRecent')}</option>
        </select>
      </div>

      {customers.length === 0 ? (
        <Empty
          text={t('noCustomers')}
          action={
            <button className="primary" onClick={() => setAdding(true)}>
              {t('addCustomer')}
            </button>
          }
        />
      ) : list.length === 0 ? (
        <p className="muted center pad">{t('noMatch')}</p>
      ) : (
        <ul className="list">
          {list.map((c) => (
            <li key={c.id} className="cust-row">
              <button className="row-btn" onClick={() => goto('c/' + c.id)}>
                <span className="avatar" aria-hidden="true">{Array.from(c.name.trim())[0]?.toUpperCase() || '?'}</span>
                <span className="grow">
                  <span className="title">{c.name}</span>
                  <span className="sub">{c.phone || t('noPhone')}</span>
                </span>
                <BalanceText balance={c.balance} />
              </button>
              {c.balance > 0 && (
                <a
                  className="icon-btn wa"
                  href={reminderUrl(c, profile, lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('sendReminder') + ': ' + c.name}
                  title={isValidPhone(c.phone) ? t('sendReminder') : t('reminderNoPhone')}
                >
                  <IconChat />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <button className="fab" onClick={() => setAdding(true)} aria-label={t('addCustomer')}>
        <IconPlus size={26} />
      </button>
      {adding && <CustomerForm onClose={() => setAdding(false)} onSaved={(id) => goto('c/' + id)} />}
    </div>
  );
};
