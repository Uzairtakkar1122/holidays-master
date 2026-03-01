import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const load = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

const DEFAULT = {
    enabled: false,
    text: '',
    bgColor: '#1d4ed8',
    textColor: '#ffffff',
    link: '',
    linkText: 'View Deals',
};

const NoticeBar = () => {
    const [config, setConfig] = useState(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const cfg = load('hm_notice_bar', DEFAULT);
        if (cfg.enabled && cfg.text) setConfig(cfg);
    }, []);

    if (!config || dismissed) return null;

    const isExternal = config.link?.startsWith('http');

    return (
        <div
            className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm font-semibold z-[60] relative"
            style={{ backgroundColor: config.bgColor, color: config.textColor }}
        >
            {/* Spacer to centre the text when there's a close button */}
            <div className="w-6 flex-shrink-0" />

            <div className="flex items-center gap-3 flex-1 justify-center flex-wrap">
                <span className="text-center leading-snug">{config.text}</span>
                {config.link && config.linkText && (
                    isExternal ? (
                        <a
                            href={config.link}
                            target="_blank"
                            rel="noreferrer"
                            className="underline font-black whitespace-nowrap hover:opacity-80 transition-opacity"
                            style={{ color: config.textColor }}
                        >
                            {config.linkText} →
                        </a>
                    ) : (
                        <a
                            href={config.link}
                            className="underline font-black whitespace-nowrap hover:opacity-80 transition-opacity"
                            style={{ color: config.textColor }}
                        >
                            {config.linkText} →
                        </a>
                    )
                )}
            </div>

            <button
                onClick={() => setDismissed(true)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
                aria-label="Dismiss"
                style={{ color: config.textColor }}
            >
                <X size={13} />
            </button>
        </div>
    );
};

export default NoticeBar;
