import React from 'react';
import DestinationCard from '../components/DestinationCard';
import FadeInSection from '../components/FadeInSection';

const Destinations = () => {
    const allDestinations = [
        { title: 'Santorini, Greece', count: 42, image: 'https://images.unsplash.com/photo-1613395877344-13d4c79e42d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Bali, Indonesia', count: 68, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Kyoto, Japan', count: 35, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Paris, France', count: 51, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Amalfi Coast, Italy', count: 29, image: 'https://images.unsplash.com/photo-1633321088392-892f38d56baa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Swiss Alps, Switzerland', count: 47, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Maldives', count: 54, image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Maui, Hawaii', count: 38, image: 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Bora Bora, French Polynesia', count: 22, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Cape Town, South Africa', count: 31, image: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Tulum, Mexico', count: 27, image: 'https://images.unsplash.com/photo-1512100356956-c1c47ce1002c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Dubrovnik, Croatia', count: 19, image: 'https://images.unsplash.com/photo-1555990539-78648831032b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    ];

    return (
        <div className="font-sans text-slate-800 bg-white selection:bg-emerald-200">

            {/* Destinations Hero */}
            <section className="relative pt-32 pb-20 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <FadeInSection>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">Explore the <span className="italic text-emerald-400">World</span></h1>
                        <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                            From pristine beaches to majestic mountains, discover our curated collection of extraordinary destinations.
                        </p>
                    </FadeInSection>
                </div>
            </section>

            {/* Grid of Destinations */}
            <section className="py-24 container mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {allDestinations.map((dest, i) => (
                        <FadeInSection key={i} delay={`${(i % 4) * 100}ms`}>
                            <DestinationCard {...dest} />
                        </FadeInSection>
                    ))}
                </div>
            </section>

            {/* Travel Inspiration Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-6 text-center">
                    <FadeInSection>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-8">Need inspiration?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            {[
                                { title: 'Honeymoon Escapes', desc: 'The most romantic spots for your special journey.' },
                                { title: 'Adventure seeker', desc: 'Thrill-seeking destinations for the brave.' },
                                { title: 'Family Fun', desc: 'Places that both kids and parents will love.' }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                    <p className="text-slate-500 mb-4">{item.desc}</p>
                                    <button className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                        Explore Guide <span className="text-lg">→</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </FadeInSection>
                </div>
            </section>

        </div>
    );
};

export default Destinations;
