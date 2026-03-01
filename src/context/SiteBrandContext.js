import React, { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_BRAND = {
    siteName: 'LuxStay',
    logoUrl: '',
};

const SiteBrandContext = createContext();

export const useSiteBrand = () => {
    const ctx = useContext(SiteBrandContext);
    if (!ctx) throw new Error('useSiteBrand must be used within a SiteBrandProvider');
    return ctx;
};

export const SiteBrandProvider = ({ children }) => {
    const [brand, setBrand] = useState(() => {
        try {
            const saved = localStorage.getItem('hm_site_brand');
            return saved ? { ...DEFAULT_BRAND, ...JSON.parse(saved) } : DEFAULT_BRAND;
        } catch {
            return DEFAULT_BRAND;
        }
    });

    const updateBrand = (updates) => {
        setBrand(prev => {
            const next = { ...prev, ...updates };
            try { localStorage.setItem('hm_site_brand', JSON.stringify(next)); } catch {}
            return next;
        });
    };

    // Update browser tab title when name changes
    useEffect(() => {
        if (brand.siteName) document.title = brand.siteName;
    }, [brand.siteName]);

    // Keep in sync across tabs
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'hm_site_brand' && e.newValue) {
                try { setBrand({ ...DEFAULT_BRAND, ...JSON.parse(e.newValue) }); } catch {}
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return (
        <SiteBrandContext.Provider value={{ brand, updateBrand }}>
            {children}
        </SiteBrandContext.Provider>
    );
};
