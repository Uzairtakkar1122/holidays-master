import React from 'react';
import { Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 pt-20 pb-10 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-tr-xl rounded-bl-xl flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 transition-colors">
                                <span className="font-bold text-lg">L</span>
                            </div>
                            <span className="text-2xl font-serif font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
                                LuxStay
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 transition-colors">
                            Curating the world's most breathtaking stays for the modern traveler.
                        </p>
                        <div className="flex gap-4">
                            {[Instagram, Twitter, Facebook].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {[
                        { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press'] },
                        { title: 'Support', links: ['Contact Us', 'Terms & Conditions', 'Privacy Policy', 'FAQ'] },
                        { title: 'Destinations', links: ['Maldives', 'Switzerland', 'Japan', 'France'] },
                    ].map((col, i) => (
                        <div key={i}>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">{col.title}</h4>
                            <ul className="space-y-4">
                                {col.links.map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-400 dark:text-slate-500 transition-colors">
                    <p>&copy; 2024 LuxStay Inc. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Sitemap</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
