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
        { name: 'Alex Rahman', role: 'CEO & Founder',        photo: '' },
        { name: 'Sara Malik',  role: 'Head of Partnerships', photo: '' },
    ],
    ctaText: 'Browse Hotels',
    ctaLink: '/hotels',
};

const STATS = [
    { value: '10,000+', label: 'Hotels Worldwide' },
    { value: '150+',    label: 'Destinations' },
    { value: '500K+',   label: 'Happy Travellers' },
    { value: '4.9★',    label: 'Average Rating' },
];

const VALUES = [
    {
        icon: '✦',
        title: 'Curated Quality',
        desc: 'Every property is hand-selected and verified for exceptional standards so you never compromise on comfort.',
    },
    {
        icon: '◈',
        title: 'Best Price Guarantee',
        desc: 'We scan thousands of rates in real time to ensure you always get the most competitive deal available.',
    },
    {
        icon: '⬡',
        title: 'Expert Support',
        desc: 'Our dedicated travel specialists are available around the clock to assist you before, during and after your stay.',
    },
];

const About = () => {
    const data = useMemo(() => load('hm_about_page', DEFAULT), []);
    const paragraphs = (data.body || '').split('\n\n').filter(Boolean);

    return (
        <div className="font-sans text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 transition-colors duration-300 overflow-x-hidden">

            {/* ── HERO ───────────────────────────────────────────────────── */}
            <section className="relative h-[90vh] min-h-[540px] flex items-end overflow-hidden">
                {/* Background image */}
                {data.heroImage
                    ? <img src={data.heroImage} alt="About hero" className="absolute inset-0 w-full h-full object-cover scale-105" style={{ transformOrigin: 'center 30%' }} />
                    : <div className="absolute inset-0 bg-slate-900" />
                }
                {/* Layered gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-900/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 to-transparent" />

                {/* Content */}
                <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 pb-20 md:pb-28">
                    <FadeInSection delay="0ms">
                        <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-emerald-400 mb-5 border border-emerald-400/30 px-3 py-1 rounded-full">
                            About Us
                        </span>
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold text-white leading-[0.95] mb-6 max-w-3xl">
                            {data.heroTitle}
                        </h1>
                        <p className="text-lg md:text-xl text-white/70 max-w-xl leading-relaxed font-light">
                            {data.heroSubtitle}
                        </p>
                    </FadeInSection>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 right-8 md:right-12 hidden md:flex flex-col items-center gap-2 opacity-40">
                    <span className="text-[10px] uppercase tracking-widest text-white rotate-90 mb-2">Scroll</span>
                    <div className="w-px h-12 bg-white/50" />
                </div>
            </section>

            {/* ── STATS BAR ──────────────────────────────────────────────── */}
            <FadeInSection>
                <section className="bg-slate-950 border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
                        {STATS.map((s, i) => (
                            <div key={i} className="py-8 md:py-10 px-6 md:px-10 text-center">
                                <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </FadeInSection>

            {/* ── MISSION / STORY SPLIT ──────────────────────────────────── */}
            <FadeInSection>
                <section className="py-24 md:py-32 max-w-6xl mx-auto px-6 md:px-12">
                    <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
                        {/* Left — label + headline */}
                        <div>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-4 block">Our Story</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white leading-tight mb-8">
                                {data.mission}
                            </h2>
                            <Link
                                to={data.ctaLink || '/hotels'}
                                className="inline-flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm px-7 py-3.5 rounded-full hover:opacity-80 transition-opacity">
                                {data.ctaText || 'Browse Hotels'}
                                <span className="text-lg leading-none">→</span>
                            </Link>
                        </div>

                        {/* Right — paragraphs */}
                        <div className="space-y-6 border-l-2 border-slate-100 dark:border-slate-800 pl-8">
                            {paragraphs.map((para, i) => (
                                <p key={i} className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">{para}</p>
                            ))}
                        </div>
                    </div>
                </section>
            </FadeInSection>

            {/* ── VALUES ─────────────────────────────────────────────────── */}
            <FadeInSection>
                <section className="py-24 bg-slate-50 dark:bg-slate-900/60">
                    <div className="max-w-6xl mx-auto px-6 md:px-12">
                        <div className="text-center mb-16">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 block mb-3">What Drives Us</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">Our Core Values</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {VALUES.map((v, i) => (
                                <div key={i} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 md:p-10 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl transition-all duration-300">
                                    <div className="text-3xl text-blue-500 mb-6 group-hover:scale-110 transition-transform duration-300 inline-block">{v.icon}</div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{v.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </FadeInSection>

            {/* ── TEAM ───────────────────────────────────────────────────── */}
            {data.teamMembers?.length > 0 && (
                <FadeInSection>
                    <section className="py-24 md:py-32 max-w-6xl mx-auto px-6 md:px-12">
                        <div className="text-center mb-16">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 block mb-3">The People</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">Meet Our Team</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {data.teamMembers.map((m, i) => (
                                <div key={i} className="group relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-2xl transition-all duration-500">
                                    {/* Photo area */}
                                    <div className="h-56 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 relative overflow-hidden">
                                        {m.photo ? (
                                            <img
                                                src={m.photo} alt={m.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                            />
                                        ) : null}
                                        <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center text-white text-5xl font-black ${m.photo ? 'hidden' : 'flex'}`}>
                                            {m.name?.[0] || '?'}
                                        </div>
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                    {/* Info */}
                                    <div className="p-6">
                                        <h3 className="font-black text-slate-900 dark:text-white text-lg">{m.name}</h3>
                                        <p className="text-sm text-blue-500 font-semibold mt-1">{m.role}</p>
                                    </div>
                                    {/* Accent line */}
                                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-blue-500 group-hover:w-full transition-all duration-500" />
                                </div>
                            ))}
                        </div>
                    </section>
                </FadeInSection>
            )}

            {/* ── FULL-WIDTH CTA ─────────────────────────────────────────── */}
            <FadeInSection>
                <section className="relative overflow-hidden bg-slate-900 py-24 md:py-32">
                    {/* Background texture */}
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    {/* Glow blobs */}
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 block mb-5">Start Your Journey</span>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight mb-6">
                            Your perfect stay<br />
                            <span className="italic text-emerald-400">is waiting.</span>
                        </h2>
                        <p className="text-white/60 text-lg mb-10 max-w-lg mx-auto">
                            Search thousands of hotels worldwide and book with confidence.
                        </p>
                        <Link
                            to={data.ctaLink || '/hotels'}
                            className="inline-flex items-center gap-3 bg-white text-slate-900 font-black text-base px-10 py-4 rounded-full hover:bg-emerald-400 hover:text-slate-900 transition-all duration-300 shadow-2xl shadow-black/30 group">
                            {data.ctaText || 'Browse Hotels'}
                            <span className="group-hover:translate-x-1 transition-transform duration-200 text-xl leading-none">→</span>
                        </Link>
                    </div>
                </section>
            </FadeInSection>

        </div>
    );
};

export default About;

