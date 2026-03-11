import React, { createContext, useState, useContext, useEffect } from 'react';
import { es } from '../translations/es';
import { en } from '../translations/en';
import { fr } from '../translations/fr';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    // Intentar recuperar el idioma guardado, o por defecto español
    const [language, setLanguage] = useState(() => {
        const savedLang = localStorage.getItem('app_language');
        return savedLang ? savedLang : 'es';
    });

    // Guardar el idioma en localStorage cada vez que cambie
    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    // Función principal para traducir
    const t = (key) => {
        const dictionaries = {
            es: es,
            en: en,
            fr: fr
        };

        const dictionary = dictionaries[language] || dictionaries['es'];
        return dictionary[key] || key; // Si no encuentra la clave, devuelve la clave misma
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
