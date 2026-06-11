import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CONSENT_VERSION, type ConsentRecord, type ConsentType } from '@nabdh/shared';
import { getDb } from '../../services/firebase';

// i18n keys for each consent gate. The ai_cross_border copy must name the
// provider(s) and the exact data types (Apple Guideline 5.1.2(i) + PDPL).
export const CONSENT_I18N: Record<ConsentType, { titleKey: string; bodyKey: string }> = {
  pdpl_processing: { titleKey: 'consent.pdpl.title', bodyKey: 'consent.pdpl.body' },
  healthkit: { titleKey: 'consent.healthkit.title', bodyKey: 'consent.healthkit.body' },
  ai_cross_border: { titleKey: 'consent.ai.title', bodyKey: 'consent.ai.body' },
};

function consentRef(uid: string, type: ConsentType) {
  return doc(getDb(), 'users', uid, 'consents', type);
}

export async function getConsent(uid: string, type: ConsentType): Promise<ConsentRecord | null> {
  const snap = await getDoc(consentRef(uid, type));
  return snap.exists() ? (snap.data() as ConsentRecord) : null;
}

export async function setConsent(
  uid: string,
  type: ConsentType,
  granted: boolean,
): Promise<ConsentRecord> {
  const record: ConsentRecord = {
    type,
    granted,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  await setConsentRecord(uid, record);
  return record;
}

async function setConsentRecord(uid: string, record: ConsentRecord): Promise<void> {
  await setDoc(consentRef(uid, record.type), record);
}

/** Valid only if granted AND on the current consent version. */
export async function hasValidConsent(uid: string, type: ConsentType): Promise<boolean> {
  const current = await getConsent(uid, type);
  return !!current && current.granted && current.version === CONSENT_VERSION;
}
