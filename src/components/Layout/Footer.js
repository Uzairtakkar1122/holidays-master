import React from 'react';
import { Instagram, Twitter, Facebook, Youtube, Linkedin } from 'lucide-react';
import { useSiteBrand } from '../../context/SiteBrandContext';
import { Link } from 'react-router-dom';

// ─── helpers ─────────────────────────────────────────────────────────────────
const loadFooter = () => {
    try { const v = localStorage.getItem('hm_footer_content'); return v ? JSON.parse(v) : null; } catch { return null; }
};

const SOCIAL_ICONS = { Instagram, Twitter, Facebook, Youtube, LinkedIn: Linkedin };

// Auto-prefix bare domains so they open externally, not as internal routes
const safeHref = (url) => {
    if (!url || url === '#') return '#';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('mailto:')) return url;
    return `https://${url}`;
};

export const FOOTER_DEFAULTS = {
    tagline: "Curating the world's most breathtaking stays for the modern traveler.",
    socials: [
        { platform: 'Instagram', url: '#' },
        { platform: 'Twitter',   url: '#' },
        { platform: 'Facebook',  url: '#' },
    ],
    columns: [
        { title: 'Company',      links: [{ label: 'About Us', url: '/about' }, { label: 'Careers', url: '#' }, { label: 'Blog', url: '#' }, { label: 'Press', url: '#' }] },
        { title: 'Support',      links: [{ label: 'Contact Us', url: '#' }, { label: 'Terms & Conditions', url: '#' }, { label: 'Privacy Policy', url: '#' }, { label: 'FAQ', url: '#' }] },
        { title: 'Destinations', links: [{ label: 'Maldives', url: '/hotels' }, { label: 'Switzerland', url: '/hotels' }, { label: 'Japan', url: '/hotels' }, { label: 'France', url: '/hotels' }] },
    ],
    bottomLinks: [
        { label: 'Privacy',  url: '#' },
        { label: 'Terms',    url: '#' },
        { label: 'Sitemap',  url: '#' },
    ],
    copyrightText: '',
};

const Footer = () => {
    const { brand } = useSiteBrand();
    const [logoError, setLogoError] = React.useState(false);
    const [data, setData] = React.useState(() => loadFooter() || FOOTER_DEFAULTS);

    React.useEffect(() => { setLogoError(false); }, [brand.logoUrl]);

    // Update when admin saves changes (cross-tab storage event + same-tab custom event)
    React.useEffect(() => {
        const refresh = () => setData(loadFooter() || FOOTER_DEFAULTS);
        window.addEventListener('storage', refresh);
        window.addEventListener('hm-footer-updated', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('hm-footer-updated', refresh);
        };
    }, []);

    const socials   = data.socials     || FOOTER_DEFAULTS.socials;
    const columns   = data.columns     || FOOTER_DEFAULTS.columns;
    const bottom    = data.bottomLinks || FOOTER_DEFAULTS.bottomLinks;
    const copyright = data.copyrightText || `© ${new Date().getFullYear()} ${brand.siteName || 'LuxStay'} Inc. All rights reserved.`;

    // Build responsive column count class dynamically
    const colCount  = columns.length + 1; // +1 for brand column
    const gridClass = colCount <= 3 ? 'md:grid-cols-3' : colCount === 4 ? 'md:grid-cols-4' : colCount === 5 ? 'md:grid-cols-5' : 'md:grid-cols-4';

    return (
        <footer
            className="pt-20 pb-10 border-t transition-colors duration-300"
            style={{ backgroundColor: 'var(--hm-footer-bg)', borderColor: 'var(--hm-footer-border)' }}
        >
            <div className="container mx-auto px-6">
                <div className={`grid grid-cols-1 ${gridClass} gap-12 mb-16`}>

                    {/* ── Brand column ── */}
                    <div className="col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            {brand.logoUrl && !logoError ? (
                                <img
                                    src={brand.logoUrl}
                                    alt={brand.siteName || 'Logo'}
                                    className="h-8 w-auto max-w-[120px] object-contain"
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-tr-xl rounded-bl-xl flex items-center justify-center transition-colors"
                                    style={{ backgroundColor: 'var(--hm-footer-heading)', color: 'var(--hm-footer-bg)' }}>
                                    <span className="font-bold text-lg">{(brand.siteName || 'L')[0].toUpperCase()}</span>
                                </div>
                            )}
                            <span className="text-2xl font-serif font-bold tracking-tight transition-colors"
                                style={{ color: 'var(--hm-footer-heading)' }}>
                                {brand.siteName || 'LuxStay'}
                            </span>
                        </Link>

                        {data.tagline && (
                            <p className="mb-6 transition-colors text-sm leading-relaxed" style={{ color: 'var(--hm-footer-text)' }}>
                                {data.tagline}
                            </p>
                        )}

                        {/* Social icons */}
                        {socials.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                                {socials.map((s, i) => {
                                    const Icon = SOCIAL_ICONS[s.platform];
                                    if (!Icon) return null;
                                    return (
                                        <a key={i} href={safeHref(s.url)}
                                            target={s.url && s.url !== '#' ? '_blank' : undefined}
                                            rel="noreferrer noopener"
                                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm hover:opacity-80"
                                            style={{ backgroundColor: 'var(--hm-card-bg)', color: 'var(--hm-footer-text)', border: '1px solid var(--hm-footer-border)' }}>
                                            <Icon className="w-5 h-5" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Nav columns ── */}
                    {columns.map((col, i) => (
                        <div key={i}>
                            <h4 className="font-bold mb-6 uppercase tracking-wider text-xs"
                                style={{ color: 'var(--hm-footer-heading)' }}>
                                {col.title}
                            </h4>
                            <ul className="space-y-4">
                                {(col.links || []).map((lk, j) => (
                                    <li key={j}>
                                        <a href={safeHref(lk.url)}
                                            target={lk.url && !lk.url.startsWith('/') && lk.url !== '#' ? '_blank' : undefined}
                                            rel="noreferrer noopener"
                                            className="text-sm font-medium transition-colors hover:opacity-80"
                                            style={{ color: 'var(--hm-footer-text)' }}>
                                            {lk.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* ── Bottom bar ── */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t text-sm transition-colors"
                    style={{ borderColor: 'var(--hm-footer-border)', color: 'var(--hm-footer-text)' }}>
                    <p>&copy; {copyright.startsWith('©') ? copyright.slice(1).trim() : copyright}</p>
                    {bottom.length > 0 && (
                        <div className="flex flex-wrap gap-6 mt-4 md:mt-0">
                            {bottom.map((l, i) => (
                                <a key={i} href={safeHref(l.url)}
                                    target={l.url && !l.url.startsWith('/') && l.url !== '#' ? '_blank' : undefined}
                                    rel="noreferrer noopener"
                                    className="transition-colors hover:opacity-80"
                                    style={{ color: 'var(--hm-footer-text)' }}>
                                    {l.label}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
