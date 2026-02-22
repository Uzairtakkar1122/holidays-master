import React from 'react';
import SearchWidget from './SearchWidget/SearchWidget';
import FadeInSection from './FadeInSection';

const Hero = () => {
    return (
        <div className="relative h-[50vh] min-h-[450px] flex items-center justify-center">
            {/* Background Image with Zoom Effect */}
            <div
                className="absolute inset-0 z-0 overflow-hidden"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-slate-900/90" />
            </div>

            {/* Content */}
            <div className="relative z-20 container mx-auto px-6 text-center mt-6">
                <FadeInSection delay="100ms">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight drop-shadow-lg">
                        Find Your <span className="italic text-emerald-400">Paradise</span>
                    </h1>
                    <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto font-light tracking-wide">
                        Discover a curated collection of the world's most luxurious hotels and resorts.
                    </p>
                </FadeInSection>

                {/* Search Widget */}
                <FadeInSection delay="300ms">
                    <SearchWidget />
                </FadeInSection>
            </div>

            {/* Animated Scroll Down Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-1.5 opacity-50">
                    <div className="w-1 h-2 bg-white rounded-full animate-scroll-down" />
                </div>
            </div>
        </div>
    );
};

export default Hero;
