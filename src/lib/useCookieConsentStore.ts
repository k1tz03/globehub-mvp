'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export interface CookieConsent {
  necessary: boolean; // Always true, cannot be disabled
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

interface CookieConsentState {
  consent: CookieConsent | null;
  showBanner: boolean;
  showPreferences: boolean;

  // Actions
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (preferences: Partial<CookieConsent>) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  closeBanner: () => void;
  resetConsent: () => void;
  hasConsent: () => boolean;
  isConsentValid: () => boolean;
  getConsentForCategory: (category: ConsentCategory) => boolean;
}

const CONSENT_VERSION = '1.0';
const CONSENT_EXPIRY_DAYS = 365;

export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set, get) => ({
      consent: null,
      showBanner: true,
      showPreferences: false,

      acceptAll: () => {
        const newConsent: CookieConsent = {
          necessary: true,
          functional: true,
          analytics: true,
          marketing: true,
          timestamp: new Date().toISOString(),
          version: CONSENT_VERSION,
        };
        set({ consent: newConsent, showBanner: false, showPreferences: false });
      },

      rejectAll: () => {
        const newConsent: CookieConsent = {
          necessary: true, // Always required
          functional: false,
          analytics: false,
          marketing: false,
          timestamp: new Date().toISOString(),
          version: CONSENT_VERSION,
        };
        set({ consent: newConsent, showBanner: false, showPreferences: false });
      },

      savePreferences: (preferences) => {
        const newConsent: CookieConsent = {
          necessary: true, // Always required
          functional: preferences.functional ?? false,
          analytics: preferences.analytics ?? false,
          marketing: preferences.marketing ?? false,
          timestamp: new Date().toISOString(),
          version: CONSENT_VERSION,
        };
        set({ consent: newConsent, showBanner: false, showPreferences: false });
      },

      openPreferences: () => set({ showPreferences: true }),
      closePreferences: () => set({ showPreferences: false }),
      closeBanner: () => set({ showBanner: false }),

      resetConsent: () => {
        set({ consent: null, showBanner: true, showPreferences: false });
      },

      hasConsent: () => {
        return get().consent !== null;
      },

      isConsentValid: () => {
        const { consent } = get();
        if (!consent) return false;

        // Check version
        if (consent.version !== CONSENT_VERSION) return false;

        // Check expiry
        const consentDate = new Date(consent.timestamp);
        const expiryDate = new Date(consentDate);
        expiryDate.setDate(expiryDate.getDate() + CONSENT_EXPIRY_DAYS);

        return new Date() < expiryDate;
      },

      getConsentForCategory: (category) => {
        const { consent } = get();
        if (!consent) return category === 'necessary';
        return consent[category] ?? false;
      },
    }),
    {
      name: 'globup-cookie-consent',
      partialize: (state) => ({ consent: state.consent }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Show banner if no consent or consent is invalid
          const hasValidConsent = state.consent && state.isConsentValid();
          state.showBanner = !hasValidConsent;
        }
      },
    }
  )
);
