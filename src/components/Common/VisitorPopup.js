import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const SEEN_KEY = 'hm_popup_seen';

const load = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

const DEFAULT = {
    enabled: false,
    title: '',
    message: '',
    ctaText: 'Explore Hotels',
    ctaLink: '/hotels',
    bgColor: '#1e293b',
    textColor: '#ffffff',
    showOnce: true,
};

const VisitorPopup = () => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState(DEFAULT);

    useEffect(() => {
        const cfg = load('hm_visitor_popup', DEFAULT);
        if (!cfg.enabled) return;
        if (cfg.showOnce && sessionStorage.getItem(SEEN_KEY)) return;
        setConfig(cfg);
        // Small delay so page loads first
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
    }, []);

    const dismiss = () => {
        setVisible(false);
        if (config.showOnce) sessionStorage.setItem(SEEN_KEY, '1');
    };

    if (!visible) return null;

    const isExternal = config.ctaLink?.startsWith('http');

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
        >
            {/* Modal */}
            <div
                className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in"
                style={{ backgroundColor: config.bgColor }}
            >
                {/* Close button */}
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    style={{ color: config.textColor }}
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                {/* Content */}
                <div className="px-8 py-10 text-center">
                    {config.title && (
                        <h2
                            className="text-2xl font-black mb-3 leading-tight"
                            style={{ color: config.textColor }}
                        >
                            {config.title}
                        </h2>
                    )}
                    {config.message && (
                        <p
                            className="text-sm leading-relaxed mb-7 opacity-80"
                            style={{ color: config.textColor }}
                        >
                            {config.message}
                        </p>
                    )}
                    {config.ctaText && config.ctaLink && (
                        isExternal ? (
                            <a
                                href={config.ctaLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={dismiss}
                                className="inline-block bg-white text-slate-900 font-bold px-7 py-3 rounded-full text-sm hover:opacity-90 transition-opacity shadow-md"
                            >
                                {config.ctaText}
                            </a>
                        ) : (
                            <Link
                                to={config.ctaLink}
                                onClick={dismiss}
                                className="inline-block bg-white text-slate-900 font-bold px-7 py-3 rounded-full text-sm hover:opacity-90 transition-opacity shadow-md"
                            >
                                {config.ctaText}
                            </Link>
                        )
                    )}
                    <div className="mt-5">
                        <button
                            onClick={dismiss}
                            className="text-xs opacity-50 hover:opacity-70 transition-opacity"
                            style={{ color: config.textColor }}
                        >
                            No thanks, continue browsing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorPopup;
