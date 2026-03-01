import React from 'react';
import { Instagram, Twitter, Facebook } from 'lucide-react';
import { useSiteBrand } from '../../context/SiteBrandContext';
import { Link } from 'react-router-dom';

const Footer = () => {
    const { brand } = useSiteBrand();
    const [logoError, setLogoError] = React.useState(false);
    React.useEffect(() => { setLogoError(false); }, [brand.logoUrl]);

    return (
        <footer
            className="pt-20 pb-10 border-t transition-colors duration-300"
            style={{
                backgroundColor: 'var(--hm-footer-bg)',
                borderColor: 'var(--hm-footer-border)',
            }}
        >
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        {/* Brand */}
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
                        <p className="mb-6 transition-colors text-sm" style={{ color: 'var(--hm-footer-text)' }}>
                            Curating the world's most breathtaking stays for the modern traveler.
                        </p>
                        <div className="flex gap-4">
                            {[Instagram, Twitter, Facebook].map((Icon, i) => (
                                <a key={i} href="#"
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm hover:opacity-80"
                                    style={{ backgroundColor: 'var(--hm-card-bg)', color: 'var(--hm-footer-text)', border: '1px solid var(--hm-footer-border)' }}>
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {[
                        { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press'] },
                        { title: 'Support', links: ['Contact Us', 'Terms & Conditions', 'Privacy Policy', 'FAQ'] },
                        { title: 'Destinations', links: ['Maldives', 'Switzerland', 'Japan', 'France'] },
                    ].map((col, i) => (
                        <div key={i}>
                            <h4 className="font-bold mb-6 uppercase tracking-wider text-xs"
                                style={{ color: 'var(--hm-footer-heading)' }}>{col.title}</h4>
                            <ul className="space-y-4">
                                {col.links.map(link => (
                                    <li key={link}>
                                        <a href="#"
                                            className="text-sm font-medium transition-colors hover:opacity-80"
                                            style={{ color: 'var(--hm-footer-text)' }}>{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t text-sm transition-colors"
                    style={{ borderColor: 'var(--hm-footer-border)', color: 'var(--hm-footer-text)' }}>
                    <p>&copy; {new Date().getFullYear()} {brand.siteName || 'LuxStay'} Inc. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        {['Privacy', 'Terms', 'Sitemap'].map(l => (
                            <a key={l} href="#"
                                className="transition-colors hover:opacity-80"
                                style={{ color: 'var(--hm-footer-text)' }}>{l}</a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
