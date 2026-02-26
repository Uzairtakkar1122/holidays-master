import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import HotelCard from '../components/HotelCard';
import FadeInSection from '../components/FadeInSection';

const FASTAPI_BASE = 'https://fastapiratehawk.co.uk';
const PER_PAGE = 9;

const fmtDate = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};
const getTodayTomorrow = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return { checkin: fmtDate(today), checkout: fmtDate(tomorrow) };
};
const getCurrencySymbol = () => {
    try {
        const s = localStorage.getItem('user_currency');
        if (s) { const p = JSON.parse(s); if (p?.symbol) return p.symbol; }
    } catch (_) {}
    return '$';
};

const normalizeInfoResponse = (data) => {
    const byId = {};
    const list = data?.data ?? data?.hotels ?? data ?? [];
    if (Array.isArray(list)) {
        list.forEach(h => { const id = String(h?.id || h?.hotel_id || '').trim(); if (id) byId[id] = h; });
    } else if (list && typeof list === 'object') {
        Object.entries(list).forEach(([k, v]) => {
            if (!v || typeof v !== 'object') return;
            const id = String(v.id || v.hotel_id || k).trim(); if (id) byId[id] = v;
        });
    }
    return byId;
};

const CardSkeleton = () => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-transparent dark:border-slate-800 animate-pulse">
        <div className="h-64 bg-slate-200 dark:bg-slate-800" />
        <div className="p-6 space-y-3">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        </div>
    </div>
);

const NearbyHotelsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);

    const lat = parseFloat(params.get('lat'));
    const lon = parseFloat(params.get('lon'));
    const locationName = params.get('location') || 'Nearby';
    const currency = params.get('currency') || 'USD';
    const residency = params.get('residency') || 'gb';
    const checkin = params.get('checkin') || getTodayTomorrow().checkin;
    const checkout = params.get('checkout') || getTodayTomorrow().checkout;

    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visible, setVisible] = useState(PER_PAGE);
    const [currencySymbol, setCurrencySymbol] = useState(() => getCurrencySymbol());

    useEffect(() => {
        const sync = () => setCurrencySymbol(getCurrencySymbol());
        window.addEventListener('currencyChanged', sync);
        return () => window.removeEventListener('currencyChanged', sync);
    }, []);

    const fetchAll = useCallback(async () => {
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            setError('Invalid coordinates'); setLoading(false); return;
        }
        setLoading(true); setError(null);
        try {
            const geoRes = await fetch('/api/geo-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: lat, longitude: lon,
                    checkin, checkout, currency, residency,
                    language: 'en',
                    guests: [{ adults: 2, children: [] }],
                    radius: 6000, limit: 50
                })
            });
            if (!geoRes.ok) throw new Error('Search failed');
            const geoData = await geoRes.json();
            const hotelIds = (geoData?.data?.hotels || []).map(h => String(h.id)).filter(Boolean);
            if (!hotelIds.length) { setError('No hotels found near this location'); setLoading(false); return; }

            const infoRes = await fetch(FASTAPI_BASE + '/get-hotels-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotel_ids: hotelIds.slice(0, 50) })
            });
            const infoData = await infoRes.json();
            const infoById = normalizeInfoResponse(infoData);

            const combined = hotelIds
                .map(id => {
                    const info = infoById[id] || {};
                    const serpHotel = geoData.data.hotels.find(h => String(h.id) === id) || {};
                    const stars = parseInt(info.stars ?? serpHotel.star_rating ?? serpHotel.rg_ext?.class ?? 0);
                    const image = Array.isArray(info.images) && info.images[0]
                        ? info.images[0].replace('{size}', '640x400')
                        : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&q=80';
                    const rate = serpHotel.rates?.[0]?.payment_options?.payment_types?.[0];
                    const price = rate?.show_amount ? Math.round(parseFloat(rate.show_amount)) : null;
                    return {
                        id,
                        name: info.name || serpHotel.name || '',
                        location: info.address || '',
                        rating: stars || '',
                        image,
                        tags: stars > 0 ? [stars + ' Star'] : [],
                        price,
                    };
                })
                .filter(h => h.name)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0));
            setHotels(combined);
        } catch (err) {
            console.error('[NearbyHotelsPage]', err);
            setError('Unable to load hotels. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [lat, lon, checkin, checkout, currency, residency]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const shown = hotels.slice(0, visible);
    const hasMore = visible < hotels.length;

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 transition-colors duration-300 min-h-screen">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-10 px-6">
                <div className="container mx-auto max-w-6xl">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-5 text-sm font-semibold transition-colors"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">
                        Hotels near <span className="text-blue-400">{locationName}</span>
                    </h1>
                    <p className="text-slate-400 text-base">
                        {loading ? 'Loading properties...' : hotels.length + ' properties found, sorted by star rating'}
                    </p>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-6 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 9 }, (_, i) => <CardSkeleton key={i} />)}
                    </div>
                ) : error ? (
                    <div className="text-center py-24">
                        <p className="text-slate-500 font-semibold mb-4">{error}</p>
                        <button onClick={fetchAll} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {shown.map((hotel, i) => (
                                <FadeInSection key={hotel.id} delay={(i % PER_PAGE * 80) + 'ms'}>
                                    <HotelCard {...hotel} currencySymbol={currencySymbol} />
                                </FadeInSection>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-12 text-center">
                                <button
                                    onClick={() => setVisible(v => v + PER_PAGE)}
                                    className="bg-transparent border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white px-10 py-3 rounded-full font-bold hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300"
                                >
                                    Load More ({hotels.length - visible} remaining)
                                </button>
                            </div>
                        )}

                        {!hasMore && hotels.length > PER_PAGE && (
                            <p className="text-center text-slate-400 dark:text-slate-500 mt-10 text-sm">
                                All {hotels.length} properties loaded
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NearbyHotelsPage;