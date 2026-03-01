import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DestinationCard from '../../components/Hotel/DestinationCard';
import FadeInSection from '../../components/Common/FadeInSection';
import { buildSearchUrl } from '../../utils/buildSearchUrl';

const load = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

const HARDCODED = [
    // ── Iconic World Destinations ─────────────────────────────────────────────
    { title: 'Santorini, Greece',           count: 42, image: 'https://images.unsplash.com/photo-1504814532849-cff240bbc503?auto=format&fit=crop&w=800&q=80',          region_id: '1735' },
    { title: 'Bali, Indonesia',              count: 68, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '602651' },
    { title: 'Kyoto, Japan',                count: 35, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '10323' },
    { title: 'Paris, France',               count: 51, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '2734' },
    { title: 'Amalfi Coast, Italy',         count: 29, image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',          region_id: '4922' },
    { title: 'Swiss Alps, Switzerland',     count: 47, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '' },
    { title: 'Maldives',                    count: 54, image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '2343' },
    { title: 'Maui, Hawaii',               count: 38, image: 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '180073' },
    { title: 'Bora Bora, French Polynesia', count: 22, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '602862' },
    { title: 'Cape Town, South Africa',     count: 31, image: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '910' },
    { title: 'Tulum, Mexico',               count: 27, image: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=800&q=80',          region_id: '182189' },
    { title: 'Dubrovnik, Croatia',          count: 19, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',          region_id: '986' },
    // ── Middle East & UAE ─────────────────────────────────────────────────────
    { title: 'Dubai, UAE',                  count: 92, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',          region_id: '6053839' },
    { title: 'Makkah, Saudi Arabia',        count: 44, image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',          region_id: '178043' },
    { title: 'Medina, Saudi Arabia',        count: 38, image: 'https://images.unsplash.com/photo-1564769625647-fbd7d8d5b6d8?auto=format&fit=crop&w=800&q=80',          region_id: '602705' },
    // ── Turkey ────────────────────────────────────────────────────────────────
    { title: 'Istanbul, Turkey',            count: 76, image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',          region_id: '1639' },
    { title: 'Cappadocia, Turkey',          count: 33, image: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=800&q=80',          region_id: '602183' },
    { title: 'Antalya, Turkey',             count: 58, image: 'https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?auto=format&fit=crop&w=800&q=80',          region_id: '481' },
    { title: 'Pamukkale, Turkey',           count: 21, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80',          region_id: '6054844' },
    // ── United Kingdom ────────────────────────────────────────────────────────
    { title: 'London, UK',                  count: 84, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',          region_id: '2114' },
    { title: 'Edinburgh, Scotland',         count: 41, image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=800&q=80',          region_id: '966238332' },
    { title: 'Manchester, UK',              count: 36, image: 'https://images.unsplash.com/photo-1574108816803-22c5e9b2b4f0?auto=format&fit=crop&w=800&q=80',          region_id: '2205' },
    { title: 'Liverpool, UK',               count: 28, image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=800&q=80',          region_id: '2122' },
    // ── Global Cities ─────────────────────────────────────────────────────────
    { title: 'New York, USA',               count: 97, image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=800&q=80',          region_id: '5128' },
    { title: 'Tokyo, Japan',                count: 88, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',          region_id: '3593' },
    { title: 'Sydney, Australia',           count: 62, image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',          region_id: '3341' },
    // ── Pakistan ──────────────────────────────────────────────────────────────
    { title: 'Islamabad, Pakistan',         count: 24, image: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=800&q=80',          region_id: '1633' },
    { title: 'Lahore, Pakistan',            count: 31, image: 'https://images.unsplash.com/photo-1567767292278-a1aababd2b69?auto=format&fit=crop&w=800&q=80',          region_id: '2068' },
    { title: 'Karachi, Pakistan',           count: 19, image: 'https://images.unsplash.com/photo-1589553416260-f586c8f1514f?auto=format&fit=crop&w=800&q=80',          region_id: '1809' },
];

const Destinations = () => {
    const navigate = useNavigate();

    // Use admin-saved list merged with HARDCODED so nothing is ever missing.
    // Admin deletions are respected; admin-added come first.
    const allDestinations = useMemo(() => {
        const adminList = load('hm_featured_destinations', []);
        if (!adminList.length) return HARDCODED;
        // Add any HARDCODED entry whose title isn't already in the admin list
        const adminTitles = new Set(adminList.map(d => d.title?.toLowerCase()));
        const missing = HARDCODED.filter(d => !adminTitles.has(d.title.toLowerCase()));
        return [...adminList, ...missing].map(d => ({ ...d, count: d.count ?? null }));
    }, []);

    const handleDestinationClick = (dest) => {
        const url = buildSearchUrl({ title: dest.title, regionId: dest.region_id });
        if (!url) {
            alert('Region ID is missing for this destination. Please add it to the mapping.');
            return;
        }
        navigate(url);
    };

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
                            <DestinationCard {...dest} onClick={() => handleDestinationClick(dest)} />
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
