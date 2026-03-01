import React, { useState } from 'react';
import HotelCard from '../../components/Hotel/HotelCard';
import FadeInSection from '../../components/Common/FadeInSection';

const Hotels = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const featuredHotels = [
        {
            name: 'The Azure Escape',
            location: 'Maldives',
            price: 850,
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            tags: ['Beachfront', 'Spa']
        },
        {
            name: 'Highland Retreat',
            location: 'Swiss Alps',
            price: 620,
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            tags: ['Mountain View', 'Cozy']
        },
        {
            name: 'Urban Oasis',
            location: 'Tokyo, Japan',
            price: 450,
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            tags: ['City Center', 'Modern']
        },
        {
            name: 'Mediterranean Villa',
            location: 'Amalfi, Italy',
            price: 540,
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1533333534819-3997e54e147d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            tags: ['Ocean View', 'Luxury']
        },
        {
            name: 'Sands of Arabia',
            location: 'Dubai, UAE',
            price: 480,
            rating: 4.6,
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            tags: ['Desert Resort', 'Spa']
        },
        {
            name: 'Forest Haven',
            location: 'Oregon, USA',
            price: 320,
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1449156001437-3a166aaef675?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            tags: ['Nature', 'Hiking']
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen transition-colors duration-300">
            {/* Header / Hero */}
            <div className="bg-slate-900 pt-32 pb-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="container mx-auto relative z-10">
                    <FadeInSection>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 italic text-emerald-400">Curated Properties</h1>
                        <p className="text-slate-400 text-lg max-w-2xl">
                            Explore our selection of extraordinary hotels and resorts from around the world.
                        </p>
                    </FadeInSection>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-20 z-40 shadow-sm transition-colors">
                <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by name or location..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full px-12 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                            <Star size={16} /> 5 Stars
                        </button>
                        <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                            <SlidersHorizontal size={16} /> Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Hotel Grid */}
            <div className="container mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-widest transition-colors">
                        {featuredHotels.length} <span className="text-slate-400 dark:text-slate-500">Properties</span>
                    </h2>
                    <select className="bg-transparent border-none text-emerald-600 dark:text-emerald-400 font-bold text-sm focus:ring-0 cursor-pointer">
                        <option>Sort by: Recommended</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {featuredHotels
                        .filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()) || h.location.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((hotel, i) => (
                            <FadeInSection key={i} delay={`${(i % 3) * 150}ms`}>
                                <HotelCard {...hotel} />
                            </FadeInSection>
                        ))}
                </div>

                {featuredHotels.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
                        <Info className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">No properties found</h3>
                        <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters or search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Hotels;
