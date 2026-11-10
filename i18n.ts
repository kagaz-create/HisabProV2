import { Lang } from './types';

const en = {
  // navigation / common
  navHome: 'Home', navCustomers: 'Customers', navReports: 'Reports', navSettings: 'Settings',
  save: 'Save', cancel: 'Cancel', delete: 'Delete', close: 'Close', back: 'Back', search: 'Search',
  loading: 'Loading…', wait: 'Please wait…', or: 'or', notNow: 'Not now',
  saved: 'Saved', deleted: 'Deleted',

  // dashboard
  toReceive: 'To receive', toGive: 'Advance held', todayUdhar: 'Udhar today', todayJama: 'Jama today',
  fromNCustomers: 'from {n} customers', recentEntries: 'Recent entries', noEntries: 'No entries yet.',
  emptyStart: 'Add your first customer to start your khata.',

  // customers
  addCustomer: 'Add customer', editCustomer: 'Edit customer', customerName: 'Customer name',
  phone: 'Phone', address: 'Address', notes: 'Notes', noPhone: 'No phone',
  openingBalance: 'Opening balance', theyOwe: 'Customer owes me', iOwe: 'I owe customer',
  customerAdded: 'Customer added', customerNotFound: 'Customer not found.',
  searchPlaceholder: 'Search name or phone', sortBy: 'Sort by',
  sortBalance: 'Highest due first', sortName: 'Name A–Z', sortRecent: 'Recent activity',
  noCustomers: 'No customers yet.', noMatch: 'No matching customer.',
  confirmDeleteCustomer: 'Delete {name} and all their entries? This cannot be undone.',
  due: 'Due', advance: 'Advance', settled: 'Settled', balance: 'Balance',
  totalUdhar: 'Total udhar', totalJama: 'Total jama',
  call: 'Call', sendReminder: 'WhatsApp reminder', reminderNoPhone: 'Add a valid 10-digit phone number to send a reminder directly.',
  statementPdf: 'Statement PDF', sharePdf: 'Share PDF', statementFile: 'Statement', pdfReady: 'PDF downloaded', errPdf: 'Could not create the PDF.',
  ledger: 'Ledger',

  // entries
  giveUdhar: 'Gave udhar', gotJama: 'Got payment', editEntry: 'Edit entry', entryType: 'Entry type',
  customer: 'Customer', selectCustomer: 'Select customer', amount: 'Amount', date: 'Date',
  paymentMode: 'Payment mode', description: 'Details', billNo: 'Bill no.',
  mode_cash: 'Cash', mode_upi: 'UPI', mode_bank_transfer: 'Bank transfer', mode_cheque: 'Cheque',
  confirmDeleteEntry: 'Delete this entry?', udharSaved: 'Udhar recorded', jamaSaved: 'Payment recorded',

  // validation / errors
  errNameRequired: 'Please enter a name.', errPhone: 'Enter a valid 10-digit mobile number.',
  errAmount: 'Enter an amount greater than 0.', errPickCustomer: 'Please select a customer.', errDate: 'Please pick a valid date.',
  errGeneric: 'Something went wrong. Please try again.', errPermission: 'Not saved: you do not have permission. Please sign in again.',
  errInvalidEmail: 'That email address is not valid.', errEmailInUse: 'An account with this email already exists.',
  errWeakPassword: 'Password must be at least 6 characters.', errBadLogin: 'Email or password is incorrect.',
  errTooMany: 'Too many attempts. Please wait a while and try again.', errNetwork: 'No internet connection.',
  errPopupClosed: 'Sign-in was cancelled.', errUnauthorizedDomain: 'This website address is not allowed for sign-in yet (add it in Firebase → Authentication → Settings → Authorized domains).',
  errProviderOff: 'This sign-in method is turned off in Firebase.', errFillAll: 'Please fill in email and password.', errEmailFirst: 'Enter your email first.',

  // reports
  period: 'Period', period_today: 'Today', period_7d: '7 days', period_30d: '30 days', period_month: 'This month', period_all: 'All time',
  netInPeriod: 'Net in period', netHelp: 'Udhar given minus payments received', topPending: 'Highest dues', nobodyOwes: 'Nobody owes you anything right now.',
  entries: 'Entries', showing100: 'Showing the latest 100 entries. Download the CSV for everything.',

  // account / auth
  account: 'Account', signedInAs: 'Signed in as', signIn: 'Sign in', signOut: 'Sign out', signInToBackup: 'Sign in to back up',
  createAccount: 'Create account', continueGoogle: 'Continue with Google', email: 'Email', password: 'Password', yourName: 'Your name',
  forgotPassword: 'Forgot password?', resetSent: 'Password reset email sent. Check your inbox.',
  noAccount: 'New here? Create an account', haveAccount: 'Already have an account? Sign in',
  guestNote: 'You are using HisabPro without an account. Data is saved only on this phone/browser. Sign in to back it up and use it on other devices.',
  guestBanner: 'Data is saved only on this device. Sign in to back it up.',
  cloudNote: 'Your data is saved to your account and works offline; changes sync when you are online.',
  importLocalTitle: 'Data found on this phone', importLocalBody: 'There is khata data saved on this phone from before you signed in. Add it to your account?',
  importLocalBtn: 'Add to my account', importLocalDone: '{n} customers added to your account.', discardLocal: 'Delete it',
  confirmDiscardLocal: 'Delete the data saved on this phone? This cannot be undone.',

  // sync
  syncLocal: 'This device only', syncSynced: 'Synced', syncPending: 'Syncing…', syncOffline: 'Offline — will sync later', syncError: 'Sync problem',

  // settings
  language: 'Language', businessProfile: 'Business details', businessName: 'Shop / business name', ownerName: 'Owner name', upiId: 'UPI ID',
  upiHint: 'Shown in WhatsApp reminders.',
  appLock: 'App lock', appLockNote: 'A PIN hides your khata when someone else uses your phone. It is stored only on this device.',
  setPin: 'Set PIN', changePin: 'Change PIN', disablePin: 'Turn off PIN', currentPin: 'Current PIN', newPin: 'New PIN', confirmPin: 'Confirm PIN',
  pinLength: 'PIN length', autoLock: 'Lock after', immediately: 'Immediately', minutes: '{n} min',
  pinSaved: 'PIN saved', pinOff: 'PIN turned off', pinMismatch: 'The two PINs do not match.', pinLenError: 'PIN must be {n} digits.',
  backup: 'Backup', exportBackup: 'Download backup', importBackup: 'Restore from backup', backupDownloaded: 'Backup downloaded',
  backupNote: 'Restoring adds the entries in the file to your current data (nothing is overwritten).',
  importDone: 'Added {c} customers and {x} entries. Skipped: {s}.', importFail: 'This file is not a valid HisabPro backup.',
  localData: 'Data on this device', loadSample: 'Load sample data', eraseLocal: 'Erase all data', sampleLoaded: 'Sample data added',
  confirmEraseLocal: 'Erase all {n} customers and their entries from this phone? This cannot be undone.',

  // lock screen
  appLocked: 'HisabPro is locked', enterPin: 'Enter your PIN', backspace: 'Delete last digit',
  pinWrong: 'Wrong PIN. {n} tries left before a wait.', pinLockedWait: 'Too many wrong tries.', pinTryAgainIn: 'Try again in {s} seconds',
  forgotPin: 'Forgot PIN?', forgotPinPassword: 'Enter your account password to confirm it is you. Your PIN will be removed.',
  forgotPinGoogle: 'Confirm with your Google account. Your PIN will be removed.', verifyAndReset: 'Verify and remove PIN',
  forgotPinGuest: 'You are not signed in, so ownership cannot be verified. The only way to remove the PIN is to erase all data saved on this phone.',
  eraseAndReset: 'Erase data and remove PIN',
} as const;

export type Key = keyof typeof en;

const hi: Record<Key, string> = {
  navHome: 'होम', navCustomers: 'ग्राहक', navReports: 'रिपोर्ट', navSettings: 'सेटिंग',
  save: 'सेव करें', cancel: 'रद्द करें', delete: 'हटाएं', close: 'बंद करें', back: 'वापस', search: 'खोजें',
  loading: 'लोड हो रहा है…', wait: 'कृपया रुकें…', or: 'या', notNow: 'अभी नहीं',
  saved: 'सेव हो गया', deleted: 'हटा दिया',

  toReceive: 'कुल मिलना है', toGive: 'अग्रिम जमा (देना है)', todayUdhar: 'आज का उधार', todayJama: 'आज की जमा',
  fromNCustomers: '{n} ग्राहकों से', recentEntries: 'हाल की प्रविष्टियाँ', noEntries: 'अभी कोई प्रविष्टि नहीं।',
  emptyStart: 'अपना खाता शुरू करने के लिए पहला ग्राहक जोड़ें।',

  addCustomer: 'ग्राहक जोड़ें', editCustomer: 'ग्राहक बदलें', customerName: 'ग्राहक का नाम',
  phone: 'फ़ोन', address: 'पता', notes: 'टिप्पणी', noPhone: 'फ़ोन नहीं',
  openingBalance: 'शुरुआती बकाया', theyOwe: 'ग्राहक को देना है', iOwe: 'मुझे ग्राहक को देना है',
  customerAdded: 'ग्राहक जुड़ गया', customerNotFound: 'ग्राहक नहीं मिला।',
  searchPlaceholder: 'नाम या फ़ोन खोजें', sortBy: 'क्रम',
  sortBalance: 'सबसे ज़्यादा बकाया पहले', sortName: 'नाम (अ–ज्ञ)', sortRecent: 'हाल की गतिविधि',
  noCustomers: 'अभी कोई ग्राहक नहीं।', noMatch: 'कोई ग्राहक नहीं मिला।',
  confirmDeleteCustomer: '{name} और उनकी सभी प्रविष्टियाँ हटाएं? यह वापस नहीं होगा।',
  due: 'बाकी', advance: 'अग्रिम', settled: 'चुकता', balance: 'शेष',
  totalUdhar: 'कुल उधार', totalJama: 'कुल जमा',
  call: 'कॉल करें', sendReminder: 'WhatsApp रिमाइंडर', reminderNoPhone: 'सीधे रिमाइंडर भेजने के लिए सही 10 अंकों का फ़ोन नंबर जोड़ें।',
  statementPdf: 'स्टेटमेंट PDF', sharePdf: 'PDF शेयर करें', statementFile: 'स्टेटमेंट', pdfReady: 'PDF डाउनलोड हो गई', errPdf: 'PDF नहीं बन सकी।',
  ledger: 'खाता',

  giveUdhar: 'उधार दिया', gotJama: 'जमा मिला', editEntry: 'प्रविष्टि बदलें', entryType: 'प्रविष्टि का प्रकार',
  customer: 'ग्राहक', selectCustomer: 'ग्राहक चुनें', amount: 'राशि', date: 'तारीख',
  paymentMode: 'भुगतान का तरीका', description: 'विवरण', billNo: 'बिल नं.',
  mode_cash: 'नकद', mode_upi: 'UPI', mode_bank_transfer: 'बैंक ट्रांसफर', mode_cheque: 'चेक',
  confirmDeleteEntry: 'यह प्रविष्टि हटाएं?', udharSaved: 'उधार दर्ज हुआ', jamaSaved: 'जमा दर्ज हुई',

  errNameRequired: 'कृपया नाम लिखें।', errPhone: 'सही 10 अंकों का मोबाइल नंबर लिखें।',
  errAmount: 'राशि 0 से ज़्यादा लिखें।', errPickCustomer: 'कृपया ग्राहक चुनें।', errDate: 'सही तारीख चुनें।',
  errGeneric: 'कुछ गड़बड़ हुई। कृपया दोबारा कोशिश करें।', errPermission: 'सेव नहीं हुआ: अनुमति नहीं है। कृपया दोबारा साइन इन करें।',
  errInvalidEmail: 'यह ईमेल सही नहीं है।', errEmailInUse: 'इस ईमेल से खाता पहले से है।',
  errWeakPassword: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए।', errBadLogin: 'ईमेल या पासवर्ड गलत है।',
  errTooMany: 'बहुत ज़्यादा कोशिशें। थोड़ी देर बाद फिर करें।', errNetwork: 'इंटरनेट नहीं है।',
  errPopupClosed: 'साइन इन रद्द हो गया।', errUnauthorizedDomain: 'इस वेबसाइट पते को अभी साइन इन की अनुमति नहीं है (Firebase → Authentication → Settings → Authorized domains में जोड़ें)।',
  errProviderOff: 'यह साइन इन तरीका Firebase में बंद है।', errFillAll: 'ईमेल और पासवर्ड भरें।', errEmailFirst: 'पहले अपना ईमेल लिखें।',

  period: 'अवधि', period_today: 'आज', period_7d: '7 दिन', period_30d: '30 दिन', period_month: 'इस महीने', period_all: 'सब',
  netInPeriod: 'अवधि का शुद्ध', netHelp: 'दिया गया उधार घटा मिली जमा', topPending: 'सबसे ज़्यादा बकाया', nobodyOwes: 'अभी किसी पर बकाया नहीं।',
  entries: 'प्रविष्टियाँ', showing100: 'सबसे नई 100 प्रविष्टियाँ दिख रही हैं। सब कुछ के लिए CSV डाउनलोड करें।',

  account: 'खाता', signedInAs: 'साइन इन:', signIn: 'साइन इन', signOut: 'साइन आउट', signInToBackup: 'बैकअप के लिए साइन इन करें',
  createAccount: 'खाता बनाएं', continueGoogle: 'Google से जारी रखें', email: 'ईमेल', password: 'पासवर्ड', yourName: 'आपका नाम',
  forgotPassword: 'पासवर्ड भूल गए?', resetSent: 'पासवर्ड रीसेट ईमेल भेज दिया गया। इनबॉक्स देखें।',
  noAccount: 'नए हैं? खाता बनाएं', haveAccount: 'पहले से खाता है? साइन इन करें',
  guestNote: 'आप बिना खाते के HisabPro चला रहे हैं। डेटा सिर्फ़ इसी फ़ोन/ब्राउज़र में सेव है। बैकअप और दूसरे फ़ोन पर चलाने के लिए साइन इन करें।',
  guestBanner: 'डेटा सिर्फ़ इसी फ़ोन में है। बैकअप के लिए साइन इन करें।',
  cloudNote: 'आपका डेटा आपके खाते में सेव है और बिना इंटरनेट भी चलता है; इंटरनेट आने पर सिंक हो जाता है।',
  importLocalTitle: 'इस फ़ोन में डेटा मिला', importLocalBody: 'साइन इन से पहले का खाता डेटा इस फ़ोन में सेव है। क्या उसे आपके खाते में जोड़ दें?',
  importLocalBtn: 'मेरे खाते में जोड़ें', importLocalDone: '{n} ग्राहक आपके खाते में जुड़ गए।', discardLocal: 'हटा दें',
  confirmDiscardLocal: 'इस फ़ोन में सेव डेटा हटाएं? यह वापस नहीं होगा।',

  syncLocal: 'सिर्फ़ इस फ़ोन में', syncSynced: 'सिंक हो गया', syncPending: 'सिंक हो रहा है…', syncOffline: 'ऑफ़लाइन — बाद में सिंक होगा', syncError: 'सिंक में समस्या',

  language: 'भाषा', businessProfile: 'दुकान की जानकारी', businessName: 'दुकान / व्यापार का नाम', ownerName: 'मालिक का नाम', upiId: 'UPI ID',
  upiHint: 'WhatsApp रिमाइंडर में दिखेगी।',
  appLock: 'ऐप लॉक', appLockNote: 'जब कोई और आपका फ़ोन इस्तेमाल करे तो PIN आपका खाता छिपा देता है। PIN सिर्फ़ इसी फ़ोन में रहता है।',
  setPin: 'PIN लगाएं', changePin: 'PIN बदलें', disablePin: 'PIN बंद करें', currentPin: 'अभी का PIN', newPin: 'नया PIN', confirmPin: 'PIN दोबारा लिखें',
  pinLength: 'PIN की लंबाई', autoLock: 'लॉक होने का समय', immediately: 'तुरंत', minutes: '{n} मिनट',
  pinSaved: 'PIN सेव हो गया', pinOff: 'PIN बंद हो गया', pinMismatch: 'दोनों PIN मेल नहीं खाते।', pinLenError: 'PIN {n} अंकों का होना चाहिए।',
  backup: 'बैकअप', exportBackup: 'बैकअप डाउनलोड करें', importBackup: 'बैकअप से वापस लाएं', backupDownloaded: 'बैकअप डाउनलोड हो गया',
  backupNote: 'वापस लाने पर फ़ाइल की प्रविष्टियाँ आपके मौजूदा डेटा में जुड़ती हैं (कुछ भी मिटता नहीं)।',
  importDone: '{c} ग्राहक और {x} प्रविष्टियाँ जुड़ीं। छोड़ी गईं: {s}।', importFail: 'यह HisabPro की सही बैकअप फ़ाइल नहीं है।',
  localData: 'इस फ़ोन का डेटा', loadSample: 'नमूना डेटा डालें', eraseLocal: 'सारा डेटा मिटाएं', sampleLoaded: 'नमूना डेटा जुड़ गया',
  confirmEraseLocal: 'इस फ़ोन से सभी {n} ग्राहक और उनकी प्रविष्टियाँ मिटाएं? यह वापस नहीं होगा।',

  appLocked: 'HisabPro लॉक है', enterPin: 'अपना PIN लिखें', backspace: 'आखिरी अंक हटाएं',
  pinWrong: 'गलत PIN। रुकना पड़े उससे पहले {n} कोशिशें बाकी।', pinLockedWait: 'बहुत ज़्यादा गलत कोशिशें।', pinTryAgainIn: '{s} सेकंड बाद फिर कोशिश करें',
  forgotPin: 'PIN भूल गए?', forgotPinPassword: 'पक्का करने के लिए अपने खाते का पासवर्ड लिखें। आपका PIN हटा दिया जाएगा।',
  forgotPinGoogle: 'अपने Google खाते से पुष्टि करें। आपका PIN हटा दिया जाएगा।', verifyAndReset: 'पुष्टि करें और PIN हटाएं',
  forgotPinGuest: 'आप साइन इन नहीं हैं, इसलिए मालिकाना हक़ जाँचा नहीं जा सकता। PIN हटाने का एक ही तरीका है: इस फ़ोन का सारा डेटा मिटाना।',
  eraseAndReset: 'डेटा मिटाएं और PIN हटाएं',
};

export type Translate = (key: Key | string, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): Translate {
  const dict: Record<string, string> = lang === 'hi' ? hi : en;
  return (key, vars) => {
    let s = dict[key] ?? (en as Record<string, string>)[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}

export const dictionaries = { en, hi };
