import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { collection, doc, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { makeT, Translate } from './lib/i18n';
import { buildBackupJson, parseBackup } from './lib/backup';
import { downloadBlob, nowTime, round2, todayISO, addDaysISO, uid } from './lib/format';
import {
  Customer,
  CustomerWithBalance,
  EMPTY_PROFILE,
  LIMITS,
  Lang,
  PAY_MODES,
  Profile,
  SyncState,
  Transaction,
  TxType,
} from './lib/types';

/* ------------------------------------------------------------------ helpers */

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function toCustomer(id: string, d: any): Customer {
  return {
    id,
    name: str(d?.name, LIMITS.name),
    phone: str(d?.phone, LIMITS.phone),
    address: str(d?.address, LIMITS.address),
    notes: str(d?.notes, LIMITS.notes),
    createdAt: num(d?.createdAt),
    updatedAt: num(d?.updatedAt),
  };
}

function toTx(id: string, d: any): Transaction | null {
  const type = d?.type === 'udhar' || d?.type === 'jama' ? (d.type as TxType) : null;
  const amount = num(d?.amount);
  if (!type || amount <= 0 || typeof d?.customerId !== 'string') return null;
  return {
    id,
    customerId: d.customerId,
    type,
    amount,
    date: str(d?.date, 20),
    time: str(d?.time, 20) || '12:00',
    description: str(d?.description, LIMITS.description),
    billNumber: str(d?.billNumber, LIMITS.billNumber),
    paymentMode: PAY_MODES.includes(d?.paymentMode) ? d.paymentMode : 'cash',
    createdAt: num(d?.createdAt),
    updatedAt: num(d?.updatedAt),
  };
}

function toProfile(d: any): Profile {
  return {
    businessName: str(d?.businessName, LIMITS.businessName),
    ownerName: str(d?.ownerName, LIMITS.ownerName),
    phone: str(d?.phone, LIMITS.phone),
    address: str(d?.address, LIMITS.address),
    upiId: str(d?.upiId, LIMITS.upiId),
  };
}

interface Data {
  customers: Customer[];
  txs: Transaction[];
  profile: Profile;
}
const EMPTY: Data = { customers: [], txs: [], profile: EMPTY_PROFILE };
const LOCAL_KEY = 'hisabpro:v2:local';
const LANG_KEY = 'hisabpro:lang';

function loadLocal(): Data {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return EMPTY;
    const d = JSON.parse(raw);
    return {
      customers: Array.isArray(d.customers) ? d.customers.map((c: any) => toCustomer(String(c.id), c)) : [],
      txs: Array.isArray(d.txs) ? (d.txs.map((t: any) => toTx(String(t.id), t)).filter(Boolean) as Transaction[]) : [],
      profile: toProfile(d.profile),
    };
  } catch {
    return EMPTY;
  }
}

/** Firestore allows 500 operations per batch; stay well below. */
async function commitInChunks(ops: Array<(b: ReturnType<typeof writeBatch>) => void>): Promise<void> {
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => op(b));
    await b.commit();
  }
}

/* ------------------------------------------------------------------ context */

export interface CustomerInput {
  name: string;
  phone: string;
  address: string;
  notes: string;
}
export type TxInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
export interface Toast {
  id: number;
  msg: string;
  kind: 'ok' | 'err' | 'info';
}

interface Store {
  user: User | null;
  authReady: boolean;
  cloud: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translate;

  customers: CustomerWithBalance[];
  txs: Transaction[];
  profile: Profile;
  loading: boolean;
  sync: SyncState;

  addCustomer: (c: CustomerInput, opening?: { type: TxType; amount: number }) => string;
  updateCustomer: (id: string, c: CustomerInput) => void;
  deleteCustomer: (id: string) => void;
  addTx: (t: TxInput) => void;
  updateTx: (id: string, t: TxInput) => void;
  deleteTx: (id: string) => void;
  saveProfile: (p: Profile) => void;

  exportBackup: () => void;
  importBackup: (text: string) => Promise<{ customers: number; txs: number; skipped: number }>;
  loadSample: () => void;
  eraseLocal: () => void;
  hasLocalData: boolean;
  importLocalToCloud: () => Promise<void>;
  discardLocal: () => void;

  signInEmail: (email: string, pw: string) => Promise<void>;
  signUpEmail: (email: string, pw: string, name: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  reauthenticate: (password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  authMessage: (e: unknown) => string;

  toasts: Toast[];
  toast: (msg: string, kind?: Toast['kind']) => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'hi';
    } catch {
      return 'hi';
    }
  });
  const t = useMemo(() => makeT(lang), [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /* ---- toasts ---- */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const toast = useCallback((msg: string, kind: Toast['kind'] = 'ok') => {
    const id = ++toastId.current;
    setToasts((p) => [...p.slice(-2), { id, msg, kind }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3500);
  }, []);

  /* ---- auth ---- */
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    getRedirectResult(auth).catch(() => {});
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);
  const uidNow = user?.uid ?? null;
  const cloud = !!user;

  /* ---- local (guest) data ---- */
  const [local, setLocal] = useState<Data>(() => loadLocal());
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
    } catch {
      /* storage full or blocked */
    }
  }, [local]);

  /* ---- cloud data ---- */
  const [cCustomers, setCCustomers] = useState<Customer[]>([]);
  const [cTxs, setCTxs] = useState<Transaction[]>([]);
  const [cProfile, setCProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ready, setReady] = useState({ c: false, t: false, p: false });
  const [pending, setPending] = useState({ c: false, t: false });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  const ensured = useRef<string | null>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    setCCustomers([]);
    setCTxs([]);
    setCProfile(EMPTY_PROFILE);
    setReady({ c: false, t: false, p: false });
    setSyncError(null);
    if (!user) return;
    const owner = user.uid;
    const onErr = (e: any) => setSyncError(e?.message || 'sync error');

    const u1 = onSnapshot(
      query(collection(db, 'customers'), where('ownerId', '==', owner)),
      (snap) => {
        setCCustomers(snap.docs.map((d) => toCustomer(d.id, d.data())));
        setPending((p) => ({ ...p, c: snap.metadata.hasPendingWrites }));
        setReady((r) => ({ ...r, c: true }));
        setSyncError(null);
      },
      onErr
    );
    const u2 = onSnapshot(
      query(collection(db, 'transactions'), where('ownerId', '==', owner)),
      (snap) => {
        setCTxs(snap.docs.map((d) => toTx(d.id, d.data())).filter(Boolean) as Transaction[]);
        setPending((p) => ({ ...p, t: snap.metadata.hasPendingWrites }));
        setReady((r) => ({ ...r, t: true }));
      },
      onErr
    );
    const u3 = onSnapshot(
      doc(db, 'businessSettings', owner),
      (snap) => {
        if (snap.exists()) {
          setCProfile(toProfile(snap.data()));
        } else if (ensured.current !== owner && !snap.metadata.fromCache) {
          // first sign-in: create the profile documents the security rules expect
          ensured.current = owner;
          const now = Date.now();
          const b = writeBatch(db);
          b.set(doc(db, 'businessSettings', owner), { ownerId: owner, ownerName: str(user.displayName, LIMITS.ownerName), updatedAt: now });
          b.set(
            doc(db, 'users', owner),
            { ownerId: owner, email: str(user.email, 120), ownerName: str(user.displayName, LIMITS.ownerName), createdAt: now, updatedAt: now },
            { merge: true }
          );
          b.commit().catch(onErr);
        }
        setReady((r) => ({ ...r, p: true }));
      },
      onErr
    );
    return () => {
      u1();
      u2();
      u3();
    };
  }, [uidNow]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- what the UI sees ---- */
  const data: Data = cloud ? { customers: cCustomers, txs: cTxs, profile: cProfile } : local;
  const loading = cloud && !(ready.c && ready.t && ready.p);
  const live = useRef({ data, cloud, uid: uidNow, local });
  live.current = { data, cloud, uid: uidNow, local };

  const sync: SyncState = !cloud
    ? 'local'
    : syncError
    ? 'error'
    : !online
    ? 'offline'
    : pending.c || pending.t
    ? 'pending'
    : 'synced';

  const customers: CustomerWithBalance[] = useMemo(() => {
    const agg = new Map<string, { u: number; j: number; last: string; n: number }>();
    for (const x of data.txs) {
      const a = agg.get(x.customerId) || { u: 0, j: 0, last: '', n: 0 };
      if (x.type === 'udhar') a.u += x.amount;
      else a.j += x.amount;
      if (x.date > a.last) a.last = x.date;
      a.n++;
      agg.set(x.customerId, a);
    }
    return data.customers.map((c) => {
      const a = agg.get(c.id);
      const udhar = round2(a?.u ?? 0);
      const jama = round2(a?.j ?? 0);
      return { ...c, udhar, jama, balance: round2(udhar - jama), lastDate: a?.last ?? '', count: a?.n ?? 0 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.customers, data.txs]);

  const fail = useCallback(
    (e: any) => {
      const code = String(e?.code || '');
      toast(code.includes('permission') ? t('errPermission') : t('errGeneric'), 'err');
    },
    [toast, t]
  );

  /* ---- writes ---- */
  const cleanCustomer = (c: CustomerInput): CustomerInput => ({
    name: c.name.trim().slice(0, LIMITS.name),
    phone: c.phone.trim().slice(0, LIMITS.phone),
    address: c.address.trim().slice(0, LIMITS.address),
    notes: c.notes.trim().slice(0, LIMITS.notes),
  });
  const cleanTx = (x: TxInput): TxInput => ({
    customerId: x.customerId,
    type: x.type,
    amount: round2(x.amount),
    date: x.date,
    time: x.time || '12:00',
    description: x.description.trim().slice(0, LIMITS.description),
    billNumber: x.billNumber.trim().slice(0, LIMITS.billNumber),
    paymentMode: PAY_MODES.includes(x.paymentMode) ? x.paymentMode : 'cash',
  });

  const addTxInternal = (x: TxInput): void => {
    const { cloud: isCloud, uid: owner } = live.current;
    const now = Date.now();
    const row = cleanTx(x);
    const id = uid();
    if (isCloud && owner) {
      setDoc(doc(db, 'transactions', id), { id, ownerId: owner, ...row, createdAt: now, updatedAt: now }).catch(fail);
    } else {
      setLocal((p) => ({ ...p, txs: [{ id, ...row, createdAt: now, updatedAt: now }, ...p.txs] }));
    }
  };

  const addCustomer: Store['addCustomer'] = (input, opening) => {
    const { cloud: isCloud, uid: owner } = live.current;
    const now = Date.now();
    const c = cleanCustomer(input);
    const id = uid();
    if (isCloud && owner) {
      setDoc(doc(db, 'customers', id), { id, ownerId: owner, ...c, createdAt: now, updatedAt: now }).catch(fail);
    } else {
      setLocal((p) => ({ ...p, customers: [{ id, ...c, createdAt: now, updatedAt: now }, ...p.customers] }));
    }
    if (opening && opening.amount > 0) {
      addTxInternal({
        customerId: id,
        type: opening.type,
        amount: opening.amount,
        date: todayISO(),
        time: nowTime(),
        description: t('openingBalance'),
        billNumber: '',
        paymentMode: 'cash',
      });
    }
    toast(t('customerAdded'));
    return id;
  };

  const updateCustomer: Store['updateCustomer'] = (id, input) => {
    const { cloud: isCloud, uid: owner } = live.current;
    const c = cleanCustomer(input);
    const now = Date.now();
    if (isCloud && owner) {
      updateDoc(doc(db, 'customers', id), { ...c, updatedAt: now }).catch(fail);
    } else {
      setLocal((p) => ({ ...p, customers: p.customers.map((x) => (x.id === id ? { ...x, ...c, updatedAt: now } : x)) }));
    }
    toast(t('saved'));
  };

  const deleteCustomer: Store['deleteCustomer'] = (id) => {
    const { cloud: isCloud, uid: owner, data: d } = live.current;
    if (isCloud && owner) {
      const txIds = d.txs.filter((x) => x.customerId === id).map((x) => x.id);
      const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [
        (b) => b.delete(doc(db, 'customers', id)),
        ...txIds.map((tid) => (b: ReturnType<typeof writeBatch>) => b.delete(doc(db, 'transactions', tid))),
      ];
      commitInChunks(ops).catch(fail);
    } else {
      setLocal((p) => ({
        ...p,
        customers: p.customers.filter((x) => x.id !== id),
        txs: p.txs.filter((x) => x.customerId !== id),
      }));
    }
    toast(t('deleted'), 'info');
  };

  const addTx: Store['addTx'] = (x) => {
    addTxInternal(x);
    toast(x.type === 'udhar' ? t('udharSaved') : t('jamaSaved'));
  };

  const updateTx: Store['updateTx'] = (id, x) => {
    const { cloud: isCloud, uid: owner } = live.current;
    const row = cleanTx(x);
    const now = Date.now();
    if (isCloud && owner) {
      updateDoc(doc(db, 'transactions', id), { ...row, updatedAt: now }).catch(fail);
    } else {
      setLocal((p) => ({ ...p, txs: p.txs.map((y) => (y.id === id ? { ...y, ...row, updatedAt: now } : y)) }));
    }
    toast(t('saved'));
  };

  const deleteTx: Store['deleteTx'] = (id) => {
    const { cloud: isCloud, uid: owner } = live.current;
    if (isCloud && owner) {
      const b = writeBatch(db);
      b.delete(doc(db, 'transactions', id));
      b.commit().catch(fail);
    } else {
      setLocal((p) => ({ ...p, txs: p.txs.filter((y) => y.id !== id) }));
    }
    toast(t('deleted'), 'info');
  };

  const saveProfile: Store['saveProfile'] = (p) => {
    const { cloud: isCloud, uid: owner } = live.current;
    const clean: Profile = {
      businessName: p.businessName.trim().slice(0, LIMITS.businessName),
      ownerName: p.ownerName.trim().slice(0, LIMITS.ownerName),
      phone: p.phone.trim().slice(0, LIMITS.phone),
      address: p.address.trim().slice(0, LIMITS.address),
      upiId: p.upiId.trim().slice(0, LIMITS.upiId),
    };
    if (isCloud && owner) {
      const now = Date.now();
      const b = writeBatch(db);
      b.set(doc(db, 'businessSettings', owner), { ownerId: owner, ...clean, updatedAt: now }, { merge: true });
      b.set(
        doc(db, 'users', owner),
        { ownerId: owner, email: str(user?.email, 120), businessName: clean.businessName, ownerName: clean.ownerName, updatedAt: now },
        { merge: true }
      );
      b.commit().catch(fail);
    } else {
      setLocal((s) => ({ ...s, profile: clean }));
    }
    toast(t('saved'));
  };

  /* ---- bulk: backup import, guest -> account ---- */
  const bulkAdd = async (cs: Customer[], xs: Transaction[]): Promise<void> => {
    const { cloud: isCloud, uid: owner } = live.current;
    if (isCloud && owner) {
      const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [
        ...cs.map((c) => (b: ReturnType<typeof writeBatch>) => b.set(doc(db, 'customers', c.id), { ...c, ownerId: owner })),
        ...xs.map((x) => (b: ReturnType<typeof writeBatch>) => b.set(doc(db, 'transactions', x.id), { ...x, ownerId: owner })),
      ];
      await commitInChunks(ops);
    } else {
      setLocal((p) => ({ ...p, customers: [...cs, ...p.customers], txs: [...xs, ...p.txs] }));
    }
  };

  const importBackup: Store['importBackup'] = async (text) => {
    const parsed = parseBackup(text);
    await bulkAdd(parsed.customers, parsed.txs);
    return { customers: parsed.customers.length, txs: parsed.txs.length, skipped: parsed.skippedCustomers + parsed.skippedTxs };
  };

  const exportBackup = () => {
    const d = live.current.data;
    downloadBlob(
      `HisabPro_Backup_${todayISO()}.json`,
      new Blob([buildBackupJson(d.profile, d.customers, d.txs)], { type: 'application/json' })
    );
    toast(t('backupDownloaded'));
  };

  const loadSample = () => {
    if (live.current.cloud) return;
    const now = Date.now();
    const mk = (name: string, phone: string, notes: string): Customer => ({ id: uid(), name, phone, address: '', notes, createdAt: now, updatedAt: now });
    const cs = [
      mk('रमेश कुमार (Ramesh Kumar)', '9823456781', 'नियमित मासिक राशन'),
      mk('विजय शर्मा (Vijay Sharma)', '9891234567', ''),
      mk('अनीता वर्मा (Anita Verma)', '9711223344', ''),
      mk('सुरेश सिंह (Suresh Singh)', '9845012345', ''),
    ];
    const tx = (ci: number, type: TxType, amount: number, daysAgo: number, description: string): Transaction => ({
      id: uid(), customerId: cs[ci].id, type, amount, date: addDaysISO(todayISO(), -daysAgo), time: '11:00',
      description, billNumber: '', paymentMode: 'cash', createdAt: now - daysAgo, updatedAt: now - daysAgo,
    });
    const xs = [
      tx(0, 'udhar', 2450, 12, 'मासिक राशन'),
      tx(0, 'jama', 1000, 6, 'नकद'),
      tx(0, 'udhar', 780, 2, 'दूध और तेल'),
      tx(1, 'udhar', 5200, 20, 'चीनी और मैदा'),
      tx(1, 'jama', 5200, 3, 'पूरा हिसाब चुकता'),
      tx(2, 'udhar', 1320, 9, 'किराना'),
      tx(3, 'jama', 3000, 15, 'अग्रिम'),
      tx(3, 'udhar', 1100, 1, 'राशन'),
    ];
    setLocal((p) => ({ ...p, customers: [...cs, ...p.customers], txs: [...xs, ...p.txs] }));
    toast(t('sampleLoaded'), 'info');
  };

  const eraseLocal = () => {
    setLocal(EMPTY);
    toast(t('deleted'), 'info');
  };
  const discardLocal = () => setLocal((p) => ({ ...EMPTY, profile: p.profile }));

  const importLocalToCloud = async () => {
    const { uid: owner, local: l } = live.current;
    if (!owner) return;
    const idMap = new Map<string, string>();
    const cs = l.customers.map((c) => {
      const id = uid();
      idMap.set(c.id, id);
      return { ...c, id };
    });
    const xs = l.txs
      .filter((x) => idMap.has(x.customerId))
      .map((x) => ({ ...x, id: uid(), customerId: idMap.get(x.customerId)! }));
    const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [
      ...cs.map((c) => (b: ReturnType<typeof writeBatch>) => b.set(doc(db, 'customers', c.id), { ...c, ownerId: owner })),
      ...xs.map((x) => (b: ReturnType<typeof writeBatch>) => b.set(doc(db, 'transactions', x.id), { ...x, ownerId: owner })),
    ];
    await commitInChunks(ops);
    setLocal((p) => ({ ...EMPTY, profile: p.profile }));
    toast(t('importLocalDone', { n: cs.length }));
  };

  /* ---- auth actions ---- */
  const signInEmail = async (email: string, pw: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pw);
  };
  const signUpEmail = async (email: string, pw: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim().slice(0, 100) });
  };
  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw e;
    }
  };
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };
  /** Proves the person holding the phone owns the signed-in account (used before removing a forgotten PIN). */
  const reauthenticate = async (password?: string) => {
    const u = auth.currentUser;
    if (!u) throw new Error('not-signed-in');
    const usesPassword = u.providerData.some((p) => p.providerId === 'password');
    if (usesPassword) {
      if (!password || !u.email) throw Object.assign(new Error('password-required'), { code: 'auth/missing-password' });
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
    } else {
      await reauthenticateWithPopup(u, new GoogleAuthProvider());
    }
  };
  const signOut = async () => {
    await fbSignOut(auth);
  };

  const authMessage = (e: unknown): string => {
    const code = String((e as any)?.code || '');
    switch (code) {
      case 'auth/invalid-email':
        return t('errInvalidEmail');
      case 'auth/email-already-in-use':
        return t('errEmailInUse');
      case 'auth/weak-password':
        return t('errWeakPassword');
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/missing-password':
        return t('errBadLogin');
      case 'auth/too-many-requests':
        return t('errTooMany');
      case 'auth/network-request-failed':
        return t('errNetwork');
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return t('errPopupClosed');
      case 'auth/unauthorized-domain':
        return t('errUnauthorizedDomain');
      case 'auth/operation-not-allowed':
        return t('errProviderOff');
      default:
        return t('errGeneric');
    }
  };

  const value: Store = {
    user, authReady, cloud, lang, setLang, t,
    customers, txs: data.txs, profile: data.profile, loading, sync,
    addCustomer, updateCustomer, deleteCustomer, addTx, updateTx, deleteTx, saveProfile,
    exportBackup, importBackup, loadSample, eraseLocal,
    hasLocalData: local.customers.length > 0 || local.txs.length > 0,
    importLocalToCloud, discardLocal,
    signInEmail, signUpEmail, signInGoogle, resetPassword, reauthenticate, signOut, authMessage,
    toasts, toast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
