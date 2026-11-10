export type Lang = 'hi' | 'en';
export type TxType = 'udhar' | 'jama';
export type PayMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque';

export const PAY_MODES: PayMode[] = ['cash', 'upi', 'bank_transfer', 'cheque'];

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TxType;
  amount: number;
  date: string; // YYYY-MM-DD (local date)
  time: string; // HH:mm
  description: string;
  billNumber: string;
  paymentMode: PayMode;
  createdAt: number;
  updatedAt: number;
}

export interface Profile {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  upiId: string;
}

export interface CustomerWithBalance extends Customer {
  udhar: number;
  jama: number;
  /** udhar - jama. Positive: customer owes you. Negative: customer paid in advance. */
  balance: number;
  lastDate: string;
  count: number;
}

export type SyncState = 'local' | 'synced' | 'pending' | 'offline' | 'error';

export const EMPTY_PROFILE: Profile = {
  businessName: '',
  ownerName: '',
  phone: '',
  address: '',
  upiId: '',
};

/** Field limits. These mirror firestore.rules, so a write that passes here is accepted by the rules. */
export const LIMITS = {
  name: 100,
  phone: 25,
  address: 200,
  notes: 300,
  description: 250,
  billNumber: 60,
  businessName: 120,
  ownerName: 100,
  upiId: 60,
  maxAmount: 100_000_000,
};
