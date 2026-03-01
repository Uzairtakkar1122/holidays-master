import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Hero from '../../components/Common/Hero';
import DestinationCard from '../../components/Hotel/DestinationCard';
import HotelCard from '../../components/Hotel/HotelCard';
import FeatureSection from '../../components/Common/FeatureSection';
import FadeInSection from '../../components/Common/FadeInSection';
import NearbyHotels from '../../components/Hotel/NearbyHotels';
import { buildSearchUrl } from '../../utils/buildSearchUrl';

const Home = () => {
    const navigate = useNavigate();
    const destinations = [
        { title: 'Santorini, Greece', count: 42, image: 'https://images.unsplash.com/photo-1504814532849-cff240bbc503?auto=format&fit=crop&w=800&q=80' },
        { title: 'Bali, Indonesia', count: 68, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Kyoto, Japan', count: 35, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
        { title: 'Paris, France', count: 51, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    ];

    const handleDestinationClick = (dest) => {
        const url = buildSearchUrl({ title: dest.title, regionId: dest.region_id });
        if (!url) {
            alert('Region ID is missing for this destination. Please add it to the mapping.');
            return;
        }
        navigate(url);
    };

    const hotels = [
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
        }
    ];

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-page-bg selection:bg-accent/20 transition-colors duration-300">

            <Hero />

            {/* Popular Destinations */}
            <section className="py-12 container mx-auto px-6" id="destinations">
                <FadeInSection>
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2">Trending Destinations</h2>
                            <p className="text-slate-500 dark:text-slate-400">Explore the most visited places this season.</p>
                        </div>
                        <Link to="/destinations" className="hidden md:flex items-center gap-2 text-accent font-bold hover:gap-3 transition-all">
                            View All <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </FadeInSection>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {destinations.map((dest, i) => (
                        <FadeInSection key={i} delay={`${i * 100}ms`}>
                            <DestinationCard {...dest} onClick={() => handleDestinationClick(dest)} />
                        </FadeInSection>
                    ))}
                </div>
            </section>

            {/* Nearby Hotels Carousel */}
            <NearbyHotels />

            {/* Featured Hotels */}
            <section className="py-12 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden transition-colors" id="hotels">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-accent/10 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                    <FadeInSection>
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">Featured Properties</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg">Handpicked for their unique character, comfort, and outstanding service.</p>
                        </div>
                    </FadeInSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {hotels.map((hotel, i) => (
                            <FadeInSection key={i} delay={`${i * 150}ms`}>
                                <HotelCard {...hotel} />
                            </FadeInSection>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <button className="bg-transparent border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white px-8 py-3 rounded-full font-bold hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300">
                            Show All Properties
                        </button>
                    </div>
                </div>
            </section>

            <FeatureSection />

            {/* Newsletter / CTA */}
            <section className="py-12 container mx-auto px-6">
                <FadeInSection>
                    <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">Unlock Exclusive Deals</h2>
                            <p className="text-slate-300 mb-10 text-lg">Sign up for our newsletter to receive up to 50% off your first booking and access to secret offers.</p>

                            <div className="bg-white/10 backdrop-blur-md p-2 rounded-full flex flex-col sm:flex-row gap-2 max-w-xl mx-auto border border-white/20">
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    className="flex-1 bg-transparent text-white placeholder-slate-400 px-6 py-3 outline-none rounded-full"
                                />
                                <button className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-emerald-400 hover:text-white transition-colors">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                </FadeInSection>
            </section>

        </div>
    );
};

export default Home;
