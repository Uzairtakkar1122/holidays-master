import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Globe, ChevronDown, Check, Moon, Sun, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { currencies, countries } from '../../data/geoData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSiteBrand } from '../../context/SiteBrandContext';
import { isAllowedUser } from '../../config/allowedUsers';
import { useGoogleLogin } from '@react-oauth/google';
import GlobalSelectorModal from '../Common/GlobalSelectorModal';

const Navbar = () => {
    const { isDark, toggleTheme } = useTheme();
    const { user, signIn, signOut } = useAuth();
    const { brand } = useSiteBrand();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const loginDropdownRef = useRef(null);
    const profileDropdownRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target)) {
                setLoginDropdownOpen(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
                setProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setAuthLoading(true);
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                signIn(profile);
                setLoginDropdownOpen(false);
            } catch (err) {
                console.error('Failed to fetch Google profile:', err);
            } finally {
                setAuthLoading(false);
            }
        },
        onError: () => {
            setAuthLoading(false);
            console.error('Google login failed');
        },
    });

    // Unified Modal State
    const [selectorModal, setSelectorModal] = useState({ isOpen: false, type: 'residency' });

    const [currency, setCurrency] = useState(() => {
        const saved = localStorage.getItem('user_currency');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migration: If flag is an emoji or not a simple ISO code, reset to default or find match
            if (parsed.flag && parsed.flag.length > 2) {
                const match = currencies.find(c => c.code === parsed.code);
                return match || currencies[0];
            }
            return parsed;
        }
        return currencies[0];
    });
    const [residency, setResidency] = useState(() => {
        const saved = localStorage.getItem('user_residency');
        if (saved) {
            // Migration: Check if saved is an emoji/invalid code
            if (saved.length > 2) return countries[0];
            return countries.find(c => c.code === saved) || countries[0];
        }
        return countries[0];
    });

    const updateResidency = (country) => {
        setResidency(country);
        localStorage.setItem('user_residency', country.code);
        window.dispatchEvent(new CustomEvent('residencyChanged', { detail: { countryCode: country.code } }));
    };

    const updateCurrency = (curr) => {
        setCurrency(curr);
        localStorage.setItem('user_currency', JSON.stringify(curr));
        window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currencyCode: curr.code } }));
    };

    const handleGlobalSelect = (type, item) => {
        if (type === 'currency') updateCurrency(item);
        else updateResidency(item);
        setSelectorModal({ ...selectorModal, isOpen: false });
    };

    const location = useLocation();
    const isSearchPage = location.pathname.includes('/search') || location.pathname.includes('/hotel-detail');

    // IP-based Detection
    useEffect(() => {
        if (localStorage.getItem('user_residency')) return;

        const detectLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.country_code) {
                    const country = countries.find(c => c.code.toLowerCase() === data.country_code.toLowerCase());
                    if (country) updateResidency(country);

                    const curr = currencies.find(c => c.code === data.currency);
                    if (curr) updateCurrency(curr);
                }
            } catch (err) {
                console.error("Location detection failed:", err);
            }
        };
        detectLocation();
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${isSearchPage || isScrolled
                    ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg py-4'
                    : 'bg-transparent py-6'
                    }`}
            >
                <div className="container mx-auto px-6 flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        {brand.logoUrl ? (
                            <img
                                src={brand.logoUrl}
                                alt={brand.siteName || 'Logo'}
                                className="w-8 h-8 object-contain rounded"
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className={`w-8 h-8 rounded-tr-xl rounded-bl-xl flex items-center justify-center transition-colors ${isSearchPage || isScrolled
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                : 'bg-white text-slate-900 group-hover:bg-emerald-400'
                                }`}>
                                <span className="font-bold text-lg">{(brand.siteName || 'L')[0]}</span>
                            </div>
                        )}
                        <span className={`text-2xl font-serif font-bold tracking-tight ${isSearchPage || isScrolled ? 'text-slate-900 dark:text-white' : 'text-white'
                            }`}>
                            {brand.siteName || 'LuxStay'}
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Currency Chip */}
                        <button
                            onClick={() => setSelectorModal({ isOpen: true, type: 'currency' })}
                            className={`flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${isSearchPage || isScrolled
                                ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-white/20 bg-slate-800 flex items-center justify-center">
                                <img
                                    src={`https://flagcdn.com/w40/${currency.flag.toLowerCase()}.png`}
                                    alt={currency.code}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>{currency.code}</span>
                                <span className="opacity-60">{currency.symbol}</span>
                            </div>
                        </button>

                        {/* Residency Chip */}
                        <button
                            onClick={() => setSelectorModal({ isOpen: true, type: 'residency' })}
                            className={`flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${isSearchPage || isScrolled
                                ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-white/20 bg-slate-800 flex items-center justify-center">
                                <img
                                    src={`https://flagcdn.com/w40/${residency.flag.toLowerCase()}.png`}
                                    alt={residency.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="uppercase tracking-tight">{residency.code}</span>
                                <ChevronDown size={14} className="opacity-60" />
                            </div>
                        </button>

                        <div className={`w-[1px] h-6 bg-slate-200/20 mx-1`}></div>

                        {[
                            { name: 'Destinations', path: '/destinations' },
                            { name: 'About', path: '/about' },
                            { name: 'Experiences', path: '/experiences' },
                            ...(user && isAllowedUser(user.email) ? [{ name: 'Dashboard', path: '/private' }] : []),
                        ].map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`text-sm font-semibold tracking-wide hover:opacity-70 transition-opacity ${isScrolled || isSearchPage ? 'text-slate-800 dark:text-slate-200' : 'text-white/90'}`}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition-all ${isSearchPage || isScrolled
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        {/* Auth Button — desktop */}
                        {user ? (
                            /* ── Signed-in avatar + dropdown ── */
                            <div className="relative" ref={profileDropdownRef}>
                                <button
                                    onClick={() => setProfileDropdownOpen(o => !o)}
                                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all"
                                >
                                    {user.picture ? (
                                        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                            {user.given_name?.[0] || user.name?.[0] || '?'}
                                        </div>
                                    )}
                                    <span className="text-sm font-semibold text-slate-800 dark:text-white max-w-[100px] truncate">{user.given_name || user.name}</span>
                                    <ChevronDown size={14} className={`text-slate-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {profileDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-fade-in-down">
                                        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                                            {user.picture ? (
                                                <img src={user.picture} alt={user.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                    {user.given_name?.[0] || user.name?.[0] || '?'}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{user.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="py-2 px-2">
                                            <button
                                                onClick={() => { signOut(); setProfileDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium transition-colors"
                                            >
                                                <LogOut size={15} />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ── Sign In button + dropdown ── */
                            <div className="relative" ref={loginDropdownRef}>
                                <button
                                    onClick={() => setLoginDropdownOpen(o => !o)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30 flex items-center gap-1.5"
                                >
                                    Sign In
                                    <ChevronDown size={14} className={`transition-transform ${loginDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {loginDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-fade-in-down">
                                        <div className="px-5 pt-5 pb-3">
                                            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">Welcome back</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to manage your bookings and preferences.</p>
                                        </div>
                                        <div className="px-4 pb-5">
                                            <button
                                                onClick={() => { setAuthLoading(true); googleLogin(); }}
                                                disabled={authLoading}
                                                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold text-slate-700 dark:text-slate-200 text-sm shadow-sm disabled:opacity-60"
                                            >
                                                {authLoading ? (
                                                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                                ) : (
                                                    <svg width="18" height="18" viewBox="0 0 48 48">
                                                        <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.1-6.1C34.46 3.19 29.52 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.1 5.52C12.5 13.67 17.8 9.5 24 9.5z"/>
                                                        <path fill="#4285F4" d="M46.52 24.5c0-1.56-.14-3.07-.4-4.5H24v8.5h12.67c-.55 2.95-2.2 5.44-4.68 7.12l7.14 5.54C43.37 37.19 46.52 31.36 46.52 24.5z"/>
                                                        <path fill="#FBBC05" d="M10.74 28.26A14.53 14.53 0 0 1 9.5 24c0-1.48.25-2.91.74-4.26l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.86.92 7.5 2.55 10.72l8.19-6.46z"/>
                                                        <path fill="#34A853" d="M24 47c5.52 0 10.15-1.83 13.54-4.96l-7.14-5.54C28.5 38.07 26.36 38.5 24 38.5c-6.2 0-11.5-4.17-13.26-9.74l-8.19 6.46C6.07 42.48 14.48 47 24 47z"/>
                                                    </svg>
                                                )}
                                                {authLoading ? 'Signing in…' : 'Continue with Google'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <div className="flex items-center gap-4 md:hidden">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full ${isSearchPage || isScrolled
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400'
                                : 'bg-white/10 text-white'
                                }`}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            className="text-2xl"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <X className={isScrolled || isSearchPage ? 'text-slate-900 dark:text-white' : 'text-white'} />
                            ) : (
                                <Menu className={isScrolled || isSearchPage ? 'text-slate-900 dark:text-white' : 'text-white'} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 shadow-xl py-6 px-6 flex flex-col gap-4 md:hidden animate-fade-in-down border-t dark:border-slate-800 transition-colors duration-300">
                        {[
                            { name: 'Destinations', path: '/destinations' },
                            { name: 'About', path: '/about' },
                            { name: 'Experiences', path: '/experiences' },
                            ...(user && isAllowedUser(user.email) ? [{ name: 'Dashboard', path: '/private' }] : []),
                        ].map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="text-slate-800 dark:text-slate-200 font-medium text-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        {user ? (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                                {user.picture ? (
                                    <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                                        {user.given_name?.[0] || '?'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                                <button
                                    onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { googleLogin(); setIsMobileMenuOpen(false); }}
                                disabled={authLoading}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-lg font-medium disabled:opacity-60"
                            >
                                <svg width="16" height="16" viewBox="0 0 48 48">
                                    <path fill="#fff" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.1-6.1C34.46 3.19 29.52 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.1 5.52C12.5 13.67 17.8 9.5 24 9.5z"/>
                                    <path fill="#fff" d="M46.52 24.5c0-1.56-.14-3.07-.4-4.5H24v8.5h12.67c-.55 2.95-2.2 5.44-4.68 7.12l7.14 5.54C43.37 37.19 46.52 31.36 46.52 24.5z"/>
                                    <path fill="#fff" d="M10.74 28.26A14.53 14.53 0 0 1 9.5 24c0-1.48.25-2.91.74-4.26l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.86.92 7.5 2.55 10.72l8.19-6.46z"/>
                                    <path fill="#fff" d="M24 47c5.52 0 10.15-1.83 13.54-4.96l-7.14-5.54C28.5 38.07 26.36 38.5 24 38.5c-6.2 0-11.5-4.17-13.26-9.74l-8.19 6.46C6.07 42.48 14.48 47 24 47z"/>
                                </svg>
                                Sign in with Google
                            </button>
                        )}
                    </div>
                )}
            </nav>

            <GlobalSelectorModal
                isOpen={selectorModal.isOpen}
                onClose={() => setSelectorModal({ ...selectorModal, isOpen: false })}
                currentType={selectorModal.type}
                onSelect={handleGlobalSelect}
                currentCurrency={currency}
                currentResidency={residency}
            />
        </>
    );
};

export default Navbar;
