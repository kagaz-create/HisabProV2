# HisabPro v2 — डिजिटल खाता

React + Vite + Firebase. कोई server नहीं है, इसलिए Netlify / Cloudflare Pages / Firebase Hosting जैसी free hosting पर चलता है।

- हिन्दी + English, बिना अकाउंट के (सिर्फ़ फ़ोन में) या Google/Email अकाउंट के साथ (cloud + offline)
- उधार / जमा, ग्राहक खाता, रिपोर्ट, CSV, JSON बैकअप
- स्टेटमेंट PDF (हिन्दी नाम सही दिखते हैं) + WhatsApp रिमाइंडर
- PIN लॉक (PBKDF2, गलत कोशिशों पर इंतज़ार)

## Deploy (Netlify)

1. यह folder GitHub repo में डालें (Private रखें)।
2. Netlify → Add new site → Import from Git → वही repo। Build settings `netlify.toml` से अपने आप आ जाती हैं
   (`npm run build`, publish `dist`)।
3. Deploy होने के बाद जो पता मिले (जैसे `abc.netlify.app`) उसे **Firebase Console → Authentication → Settings →
   Authorized domains** में जोड़ें, वरना Google साइन-इन नहीं चलेगा।
4. **Firebase Console → Firestore Database → (आपका database) → Rules** में `firestore.rules` की पूरी फ़ाइल paste करके Publish करें।

## Local चलाना

```
npm install
npm run dev
```

`npm run typecheck` TypeScript जाँचता है (build इस पर निर्भर नहीं है)।

## ध्यान रखें

- पुराने HisabPro का Firestore data (customers, transactions, businessSettings) बिना बदलाव इसी के साथ चलता है।
- पुराना Passkey / Face ID लॉक इसमें नहीं है (उसके लिए server चाहिए था)। उसकी जगह PIN लॉक है।
- PIN सिर्फ़ privacy screen है: जब कोई और आपका फ़ोन इस्तेमाल करे। यह data को encrypt नहीं करता।
- PDF हर पन्ना image बनाकर डालता है, इसलिए PDF में text select/copy नहीं होता।
- Firebase config में दिखने वाली API key public identifier है, secret नहीं। असली सुरक्षा `firestore.rules` से है।
