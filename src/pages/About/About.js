import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import FadeInSection from '../../components/Common/FadeInSection';

const load = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

const DEFAULT = {
    heroImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80',
    heroTitle: 'We Are LuxStay',
    heroSubtitle: 'Curating unforgettable travel experiences since 2020.',
    mission: "Our mission is to connect travellers with the world's finest hotels at the best prices.",
    body: "LuxStay was founded by a team of passionate travellers who believed great accommodation should be easy to find.\n\nWe partner with thousands of hotels across the globe and use cutting-edge technology to surface the perfect stay.",
    teamMembers: [
        { name: 'Alex Rahman', role: 'CEO & Founder', photo: '' },
        { name: 'Sara Malik',  role: 'Head of Partnerships', photo: '' },
    ],
    ctaText: 'Browse Hotels',
    ctaLink: '/hotels',
};

const About = () => {
    const data = useMemo(() => load('hm_about_page', DEFAULT), []);
    const paragraphs = (data.body || '').split('\n\n').filter(Boolean);

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 transition-colors duration-300">

            {/* ── Hero ── */}
            <section className="relative h-[55vh] min-h-[380px] flex items-center justify-center overflow-hidden">
                {data.heroImage
                    ? <img src={data.heroImage} alt="About hero" className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0 bg-slate-900" />
                }
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/50 to-slate-900/80" />
                <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">{data.heroTitle}</h1>
                    <p className="text-lg md:text-xl text-white/80 font-medium">{data.heroSubtitle}</p>
                </div>
            </section>

            {/* ── Mission ── */}
            <FadeInSection>
                <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
                    <div className="max-w-3xl mx-auto">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-200 mb-4">Our Mission</p>
                        <p className="text-xl md:text-2xl font-semibold leading-relaxed">{data.mission}</p>
                    </div>
                </section>
            </FadeInSection>

            {/* ── Body ── */}
            <FadeInSection>
                <section className="py-20 px-6 max-w-3xl mx-auto">
                    <div className="space-y-6">
                        {paragraphs.map((para, i) => (
                            <p key={i} className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{para}</p>
                        ))}
                    </div>
                </section>
            </FadeInSection>

            {/* ── Team ── */}
            {data.teamMembers?.length > 0 && (
                <FadeInSection>
                    <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
                        <div className="max-w-5xl mx-auto">
                            <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 text-center mb-3">The Team</p>
                            <h2 className="text-3xl font-black text-center text-slate-800 dark:text-white mb-12">Meet the People Behind LuxStay</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                                {data.teamMembers.map((m, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 text-center p-8">
                                        {m.photo
                                            ? <img src={m.photo} alt={m.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-blue-100" onError={e => e.target.style.display='none'} />
                                            : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">{m.name?.[0] || '?'}</div>
                                        }
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg">{m.name}</h3>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">{m.role}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </FadeInSection>
            )}

            {/* ── CTA ── */}
            <FadeInSection>
                <section className="py-20 px-6 text-center">
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Ready to explore?</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Start searching for your perfect hotel today.</p>
                    <Link to={data.ctaLink || '/hotels'}
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30">
                        {data.ctaText || 'Browse Hotels'}
                    </Link>
                </section>
            </FadeInSection>

        </div>
    );
};

export default About;
