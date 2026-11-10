import { csvCell, formatDate, round2, uid } from './format';
import { Customer, LIMITS, PAY_MODES, PayMode, Profile, Transaction, TxType } from './types';

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');
const finite = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export interface ParsedBackup {
  customers: Customer[];
  txs: Transaction[];
  skippedCustomers: number;
  skippedTxs: number;
}

/**
 * Validates an imported backup file strictly and returns brand-new records with fresh IDs
 * (so an import can never overwrite or collide with existing documents).
 * Accepts the format written by this app and by the older HisabPro versions.
 */
export function parseBackup(text: string): ParsedBackup {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('not-json');
  }
  if (!data || !Array.isArray(data.customers) || !Array.isArray(data.transactions)) throw new Error('bad-shape');
  if (data.customers.length > 5000 || data.transactions.length > 50000) throw new Error('too-big');

  const now = Date.now();
  const idMap = new Map<string, string>();
  const customers: Customer[] = [];
  let skippedCustomers = 0;

  for (const c of data.customers) {
    const name = str(c?.name, LIMITS.name).trim();
    if (!name || typeof c?.id !== 'string') {
      skippedCustomers++;
      continue;
    }
    const id = uid();
    idMap.set(c.id, id);
    customers.push({
      id,
      name,
      phone: str(c.phone, LIMITS.phone),
      address: str(c.address, LIMITS.address),
      notes: str(c.notes, LIMITS.notes),
      createdAt: finite(c.createdAt) || now,
      updatedAt: finite(c.updatedAt) || now,
    });
  }

  const txs: Transaction[] = [];
  let skippedTxs = 0;
  for (const t of data.transactions) {
    const customerId = typeof t?.customerId === 'string' ? idMap.get(t.customerId) : undefined;
    const amount = round2(finite(t?.amount));
    const type: TxType | null = t?.type === 'udhar' || t?.type === 'jama' ? t.type : null;
    const date = typeof t?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : '';
    if (!customerId || !type || !date || amount <= 0 || amount > LIMITS.maxAmount) {
      skippedTxs++;
      continue;
    }
    const mode: PayMode = PAY_MODES.includes(t.paymentMode) ? t.paymentMode : 'cash';
    txs.push({
      id: uid(),
      customerId,
      type,
      amount,
      date,
      time: typeof t.time === 'string' && /^\d{2}:\d{2}$/.test(t.time) ? t.time : '12:00',
      description: str(t.description, LIMITS.description),
      billNumber: str(t.billNumber, LIMITS.billNumber),
      paymentMode: mode,
      createdAt: finite(t.createdAt) || now,
      updatedAt: finite(t.updatedAt) || now,
    });
  }
  return { customers, txs, skippedCustomers, skippedTxs };
}

export function buildBackupJson(profile: Profile, customers: Customer[], txs: Transaction[]): string {
  return JSON.stringify(
    {
      app: 'HisabPro',
      version: 2,
      exportedAt: new Date().toISOString(),
      profile,
      customers: customers.map(({ id, name, phone, address, notes, createdAt, updatedAt }) => ({
        id, name, phone, address, notes, createdAt, updatedAt,
      })),
      transactions: txs,
    },
    null,
    2
  );
}

export function buildCsv(txs: Transaction[], nameOf: (id: string) => string): string {
  const head = ['Date', 'Time', 'Customer', 'Type', 'Amount', 'Payment mode', 'Bill no', 'Details'];
  const rows = txs.map((t) =>
    [
      formatDate(t.date, 'en'),
      t.time,
      nameOf(t.customerId),
      t.type === 'udhar' ? 'Udhar (given)' : 'Jama (received)',
      t.amount,
      t.paymentMode,
      t.billNumber,
      t.description,
    ]
      .map(csvCell)
      .join(',')
  );
  // BOM so Excel opens Hindi text correctly
  return '﻿' + [head.map(csvCell).join(','), ...rows].join('\r\n');
}
