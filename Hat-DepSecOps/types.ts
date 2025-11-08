
export type PanelType = 'encryption' | 'decryption';

export type EncryptionMethod = 'password' | 'publicKey';

export type Sodium = any;

export type Language = 'en' | 'es';

// Extend the Window interface for libsodium and zxcvbn
declare global {
  interface Window {
    _sodium: any;
    zxcvbn: (password: string, user_inputs?: string[]) => ZxcvbnResult;
  }
}

export interface ZxcvbnResult {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crack_times_display: {
    offline_slow_hashing_1e4_per_second: string;
  };
}
