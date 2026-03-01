import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Default values ───────────────────────────────────────────────────────────
export const THEME_DEFAULTS = {
    // Brand / accent
    primary:            '#2563eb',   // blue-600  – buttons, active states, links
    accent:             '#10b981',   // emerald-500 – hover highlights, CTAs

    // Navbar  (scrolled / opaque state)
    navBgLight:         '#ffffff',
    navBgDark:          '#0f172a',   // slate-900
    navTextLight:       '#1e293b',   // slate-800
    navTextDark:        '#f1f5f9',   // slate-100

    // Footer
    footerBgLight:      '#ffffff',
    footerBgDark:       '#0f172a',
    footerTextLight:    '#64748b',   // slate-500
    footerTextDark:     '#94a3b8',   // slate-400
    footerHeadingLight: '#0f172a',
    footerHeadingDark:  '#f1f5f9',
    footerBorderLight:  '#f1f5f9',   // slate-100
    footerBorderDark:   '#1e293b',   // slate-800

    // Page background (the root wrapper)
    pageBgLight:        '#f5f0eb',   // warm light beige
    pageBgDark:         '#020617',   // slate-950

    // Card / panel backgrounds
    cardBgLight:        '#ffffff',
    cardBgDark:         '#0f172a',   // slate-900
    cardBorderLight:    '#e8e0d8',   // warm beige border
    cardBorderDark:     '#1e293b',   // slate-800

    // Sidebar (admin panel)
    sidebarBgLight:     '#ffffff',
    sidebarBgDark:      '#0f172a',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Convert a hex colour (#rrggbb or #rgb) to "r g b" channel string for CSS rgb() */
const hexToRgbChannels = (hex) => {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '37 99 235'; // fallback blue-600
    return `${r} ${g} ${b}`;
};

// ─── Build the injected CSS string ───────────────────────────────────────────
const buildCss = (t) => `
/* ── HolidaysMaster custom theme ───────────────────────── */
:root {
    --hm-primary:          ${t.primary};
    --hm-primary-rgb:      ${hexToRgbChannels(t.primary)};
    --hm-accent:           ${t.accent};
    --hm-accent-rgb:       ${hexToRgbChannels(t.accent)};

    --hm-nav-bg:           ${t.navBgLight};
    --hm-nav-text:         ${t.navTextLight};

    --hm-footer-bg:        ${t.footerBgLight};
    --hm-footer-text:      ${t.footerTextLight};
    --hm-footer-heading:   ${t.footerHeadingLight};
    --hm-footer-border:    ${t.footerBorderLight};

    --hm-page-bg:          ${t.pageBgLight};

    --hm-card-bg:          ${t.cardBgLight};
    --hm-card-border:      ${t.cardBorderLight};

    --hm-sidebar-bg:       ${t.sidebarBgLight};

    /* keep index.css body var in sync */
    --background:          ${t.pageBgLight};
    --foreground:          ${t.navTextLight};
    --card-bg:             ${t.cardBgLight};
    --card-border:         ${t.cardBorderLight};
}
.dark {
    --hm-nav-bg:           ${t.navBgDark};
    --hm-nav-text:         ${t.navTextDark};

    --hm-footer-bg:        ${t.footerBgDark};
    --hm-footer-text:      ${t.footerTextDark};
    --hm-footer-heading:   ${t.footerHeadingDark};
    --hm-footer-border:    ${t.footerBorderDark};

    --hm-page-bg:          ${t.pageBgDark};

    --hm-card-bg:          ${t.cardBgDark};
    --hm-card-border:      ${t.cardBorderDark};

    --hm-sidebar-bg:       ${t.sidebarBgDark};

    /* keep index.css body var in sync */
    --background:          ${t.pageBgDark};
    --foreground:          ${t.navTextDark};
    --card-bg:             ${t.cardBgDark};
    --card-border:         ${t.cardBorderDark};
}

/* ── Global: page background ─────────────────────────── */
body {
    background-color: var(--background) !important;
    color: var(--foreground);
}

/* ── Primary colour overrides ─────────────────────────── */
.hm-btn-primary {
    background-color: var(--hm-primary) !important;
}
.hm-btn-primary:hover {
    filter: brightness(0.88);
}
.hm-accent-bg {
    background-color: var(--hm-accent) !important;
}
.hm-accent-text {
    color: var(--hm-accent) !important;
}

/* ── Card backgrounds ─────────────────────────────────── */
.hm-card {
    background-color: var(--hm-card-bg) !important;
    border-color: var(--hm-card-border) !important;
}
`;

// ─── Inject / update the <style> tag ─────────────────────────────────────────
const STYLE_ID = 'hm-theme-custom';
const injectCss = (css) => {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
        el = document.createElement('style');
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = css;
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeCustomContext = createContext();

export const useThemeCustom = () => {
    const ctx = useContext(ThemeCustomContext);
    if (!ctx) throw new Error('useThemeCustom must be used within ThemeCustomProvider');
    return ctx;
};

export const ThemeCustomProvider = ({ children }) => {
    const [custom, setCustom] = useState(() => {
        try {
            const saved = localStorage.getItem('hm_theme_custom');
            const initial = saved ? { ...THEME_DEFAULTS, ...JSON.parse(saved) } : { ...THEME_DEFAULTS };
            // Inject synchronously so CSS vars exist before the first render
            injectCss(buildCss(initial));
            return initial;
        } catch {
            injectCss(buildCss(THEME_DEFAULTS));
            return { ...THEME_DEFAULTS };
        }
    });

    // Keep CSS in sync whenever custom changes after mount
    useEffect(() => {
        injectCss(buildCss(custom));
    }, [custom]);

    const updateCustom = (updates) => {
        setCustom(prev => {
            const next = { ...prev, ...updates };
            try { localStorage.setItem('hm_theme_custom', JSON.stringify(next)); } catch {}
            return next;
        });
    };

    const resetCustom = () => {
        setCustom({ ...THEME_DEFAULTS });
        try { localStorage.removeItem('hm_theme_custom'); } catch {}
    };

    // Sync across tabs
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'hm_theme_custom') {
                try {
                    const v = e.newValue ? { ...THEME_DEFAULTS, ...JSON.parse(e.newValue) } : { ...THEME_DEFAULTS };
                    setCustom(v);
                } catch {}
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    return (
        <ThemeCustomContext.Provider value={{ custom, updateCustom, resetCustom }}>
            {children}
        </ThemeCustomContext.Provider>
    );
};
