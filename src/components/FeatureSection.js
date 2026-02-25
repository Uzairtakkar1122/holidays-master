import React from 'react';
import { CheckCircle, Star } from 'lucide-react';
import FadeInSection from './FadeInSection';

const FeatureSection = () => (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <FadeInSection direction="left">
                    <div className="relative">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-200/50 rounded-full blur-3xl" />
                        <img
                            src="https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                            alt="Interior"
                            className="rounded-3xl shadow-2xl relative z-10 w-full"
                        />
                        <div className="absolute -bottom-10 -right-10 w-64 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl z-20 hidden md:block animate-float border border-transparent dark:border-slate-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                    <CheckCircle className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Verified Stays</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Only the best for you</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                                    <div className="h-full w-[90%] bg-emerald-500 rounded-full" />
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <span>Satisfaction</span>
                                    <span>98%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeInSection>

                <FadeInSection direction="right">
                    <div>
                        <h4 className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mb-2">Why Choose Us</h4>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight transition-colors">
                            We redefine the art of <br /> <span className="italic text-slate-400 dark:text-slate-500">luxury living</span>.
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed transition-colors">
                            Experience the pinnacle of hospitality. From private islands to urban sanctuaries, we curate unique stays that go beyond accommodation to create unforgettable memories.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { title: 'Best Price Guarantee', desc: 'We match any price you find online.' },
                                { title: '24/7 Concierge', desc: 'Personalized support anytime.' },
                                { title: 'Exclusive Perks', desc: 'Room upgrades and late checkouts.' },
                                { title: 'Curated Collections', desc: 'Hand-picked by travel experts.' },
                            ].map((feature, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-900 shadow-md dark:shadow-none dark:border dark:border-slate-800 rounded-xl flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 transition-all">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900 dark:text-white">{feature.title}</h5>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeInSection>
            </div>
        </div>
    </section>
);

export default FeatureSection;
