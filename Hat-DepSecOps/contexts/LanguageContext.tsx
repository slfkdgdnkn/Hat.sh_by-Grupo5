
import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { translations } from '../translations';
import type { Language } from '../types';

type LanguageContextType = {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: keyof typeof translations, ...args: any[]) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'es') {
            setLanguage('es');
        }
    }, []);

    const t = useMemo(() => (key: keyof typeof translations): string => {
        return translations[key]?.[language] || translations[key]?.['en'] || key;
    }, [language]);
    
    const value = { language, setLanguage, t };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
