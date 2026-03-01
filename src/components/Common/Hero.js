import React, { useMemo } from 'react';
import SearchWidget from '../Search/SearchWidget/SearchWidget';
import FadeInSection from './FadeInSection';
import HeroParticlesBackground from './HeroParticlesBackground';

const load = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

const DEFAULT_HERO = {
    headline: '',
    subheadline: '',
    bgImage: '',
    overlayOpacity: 60,
};

const Hero = () => {
    const cfg = useMemo(() => load('hm_hero_banner', DEFAULT_HERO), []);

    const headline   = cfg.headline    || 'Find Your Paradise';
    const subheadline = cfg.subheadline || "Discover a curated collection of the world's most luxurious hotels and resorts.";
    const overlayStyle = cfg.bgImage
        ? { backgroundColor: `rgba(0,0,0,${(cfg.overlayOpacity ?? 60) / 100})` }
        : {};

    return (
        <div className="relative h-[50vh] min-h-[450px] flex items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900 dark:bg-slate-950">
                {cfg.bgImage ? (
                    <img
                        src={cfg.bgImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <HeroParticlesBackground />
                )}
                {/* Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={cfg.bgImage
                        ? overlayStyle
                        : undefined}
                >
                    {!cfg.bgImage && (
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/25 via-slate-900/55 to-slate-950/95" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-20 container mx-auto px-6 text-center mt-6">
                <FadeInSection delay="100ms">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight drop-shadow-lg">
                        {headline}
                    </h1>
                    <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto font-light tracking-wide">
                        {subheadline}
                    </p>
                </FadeInSection>

                {/* Search Widget */}
                <FadeInSection delay="300ms">
                    <SearchWidget />
                </FadeInSection>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-1.5 opacity-50">
                    <div className="w-1 h-2 bg-white rounded-full animate-scroll-down" />
                </div>
            </div>
        </div>
    );
};

export default Hero;
