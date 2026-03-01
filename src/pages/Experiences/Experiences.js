import React from 'react';
import { Compass, Map, Camera, Wind, Mountain, Waves } from 'lucide-react';
import FadeInSection from '../../components/Common/FadeInSection';

const Experiences = () => {
    const experiences = [
        {
            title: "Hot Air Ballooning",
            location: "Cappadocia, Turkey",
            image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            category: "Adventure",
            price: "$250"
        },
        {
            title: "Desert Safari & Dinner",
            location: "Dubai, UAE",
            image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            category: "Culture",
            price: "$180"
        },
        {
            title: "Private Northern Lights Tour",
            location: "Reykjavik, Iceland",
            image: "https://images.unsplash.com/photo-1531366930499-41f53c17ad33?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            category: "Nature",
            price: "$320"
        },
        {
            title: "Zen Garden Meditation",
            location: "Kyoto, Japan",
            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            category: "Wellness",
            price: "$120"
        },
        {
            title: "Wine Tasting Tour",
            location: "Tuscany, Italy",
            image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            category: "Luxury",
            price: "$150"
        },
        {
            title: "Great Barrier Reef Diving",
            location: "Queensland, Australia",
            image: "https://images.unsplash.com/photo-1544551763-47a184117db7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            category: "Adventure",
            price: "$290"
        }
    ];

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 selection:bg-emerald-200 transition-colors duration-300">

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="container mx-auto px-6 relative z-10">
                    <FadeInSection>
                        <div className="max-w-3xl">
                            <h4 className="text-emerald-400 font-bold uppercase tracking-widest mb-4">Curated Experiences</h4>
                            <h1 className="text-4xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
                                Live stories worth <br /> <span className="italic text-emerald-400">telling</span>.
                            </h1>
                            <p className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed">
                                Immerse yourself in unique activities designed to connect you with the heart of every destination. From high-altitude adventures to mindful retreats.
                            </p>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Categories Bar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-20 z-40 transition-colors">
                <div className="container mx-auto px-6 overflow-x-auto">
                    <div className="flex items-center gap-8 py-4 whitespace-nowrap min-w-max">
                        {['All Experiences', 'Adventure', 'Nature', 'Wellness', 'Culture', 'Luxury'].map((cat, i) => (
                            <button
                                key={i}
                                className={`text-sm font-bold tracking-wide transition-colors ${i === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/50 transition-colors">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {experiences.map((exp, i) => (
                            <FadeInSection key={i} delay={`${(i % 3) * 150}ms`}>
                                <div className="group cursor-pointer">
                                    <div className="relative overflow-hidden rounded-[2rem] aspect-[4/5] mb-6 shadow-2xl">
                                        <img
                                            src={exp.image}
                                            alt={exp.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                                        <div className="absolute top-6 left-6">
                                            <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
                                                {exp.category}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-8 left-8 right-8">
                                            <p className="text-white/80 text-sm mb-1">{exp.location}</p>
                                            <h3 className="text-2xl font-bold text-white leading-tight">{exp.title}</h3>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-slate-400 dark:text-slate-500 font-medium transition-colors">Starting from <span className="text-slate-900 dark:text-white font-bold">{exp.price}</span>/person</span>
                                        <button className="w-10 h-10 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-full flex items-center justify-center group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                            →
                                        </button>
                                    </div>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white dark:bg-slate-950 transition-colors">
                <div className="container mx-auto px-6 text-center">
                    <FadeInSection>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-[3rem] p-12 md:p-20 relative overflow-hidden transition-colors">
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-200/50 dark:bg-emerald-800/10 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6">Want a tailored <br /> discovery?</h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg max-w-xl mx-auto">
                                    Our travel experts can create a custom itinerary of experiences just for you, based on your passions and pace.
                                </p>
                                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-emerald-600 dark:hover:bg-emerald-400 transition-all shadow-xl shadow-slate-900/20 dark:shadow-none">
                                    Talk to a Specialist
                                </button>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>

        </div>
    );
};

export default Experiences;
