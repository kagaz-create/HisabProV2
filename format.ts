import { CustomerWithBalance, Lang, Profile } from './types';

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const inFmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const inr = (n: number): string => '₹' + inFmt.format(round2(n));

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in the device's LOCAL time zone (toISOString() would give the UTC date, wrong after midnight in India). */
export function todayISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function nowTime(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return todayISO(new Date(y, m - 1, d + days));
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_HI = ['जन॰', 'फ़र॰', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल॰', 'अग॰', 'सित॰', 'अक्टू॰', 'नव॰', 'दिस॰'];

export function formatDate(iso: string, lang: Lang = 'en'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const months = lang === 'hi' ? MONTHS_HI : MONTHS_EN;
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

export function uid(): string {
  const c = (globalThis as any).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && c.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- phone numbers ---------- */

/** Returns the 10-digit Indian mobile number if one can be found, otherwise the digits that were typed. */
export function cleanPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}
export const isValidPhone = (raw: string): boolean => /^[6-9]\d{9}$/.test(cleanPhone(raw));

/* ---------- WhatsApp ---------- */

function waLink(phone: string, text: string): string {
  const p = cleanPhone(phone);
  const base = isValidPhone(phone) ? `https://wa.me/91${p}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function reminderUrl(c: CustomerWithBalance, p: Profile, lang: Lang): string {
  const biz = p.businessName || (lang === 'hi' ? 'हमारी दुकान' : 'our store');
  const owner = p.ownerName || p.businessName || 'HisabPro';
  const amt = inr(Math.abs(c.balance));
  const upi = p.upiId ? (lang === 'hi' ? `\nUPI: ${p.upiId}` : `\nUPI: ${p.upiId}`) : '';
  const text =
    lang === 'hi'
      ? `नमस्ते ${c.name} जी,\n\n*${biz}* से आपका बकाया हिसाब *${amt}* है। कृपया जल्द भुगतान करें।${upi}\n\nधन्यवाद 🙏\n- ${owner}`
      : `Dear ${c.name},\n\nThis is a gentle reminder from *${biz}*. Your outstanding balance is *${amt}*. Kindly clear it at your earliest convenience.${upi}\n\nThank you 🙏\n- ${owner}`;
  return waLink(c.phone, text);
}

/* ---------- files ---------- */

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Keeps Hindi and other letters in file names, removes only characters that file systems reject. */
export function safeFileName(s: string): string {
  const cleaned = s.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, '_').slice(0, 60);
  return cleaned || 'file';
}

/** CSV cell: quotes escaped, and cells that start with = + - @ are neutralised so Excel does not run them as formulas. */
export function csvCell(v: string | number): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s) && typeof v === 'string') s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
