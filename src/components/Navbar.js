import React, { useState, useEffect } from 'react';
import { Menu, X, Globe, ChevronDown, Check, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { currencies, countries } from '../data/geoData';
import { useTheme } from '../context/ThemeContext';
import GlobalSelectorModal from './GlobalSelectorModal';

const Navbar = () => {
    const { isDark, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                        <div className={`w-8 h-8 rounded-tr-xl rounded-bl-xl flex items-center justify-center transition-colors ${isSearchPage || isScrolled
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'bg-white text-slate-900 group-hover:bg-emerald-400'
                            }`}>
                            <span className="font-bold text-lg">L</span>
                        </div>
                        <span className={`text-2xl font-serif font-bold tracking-tight ${isSearchPage || isScrolled ? 'text-slate-900 dark:text-white' : 'text-white'
                            }`}>
                            LuxStay
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
                            { name: 'Hotels', path: '/hotels' },
                            { name: 'Experiences', path: '/experiences' },
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
                        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30">
                            Sign In
                        </button>
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
                            { name: 'Hotels', path: '/hotels' },
                            { name: 'Experiences', path: '/experiences' },
                            { name: 'About', path: '#' },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="text-slate-800 dark:text-slate-200 font-medium text-lg"
                            >
                                {item.name}
                            </Link>
                        ))}
                        <button className="bg-emerald-500 text-white py-3 rounded-lg w-full font-medium">
                            Sign In
                        </button>
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
