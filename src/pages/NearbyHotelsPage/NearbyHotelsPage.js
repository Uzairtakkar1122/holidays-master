import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Flatpickr from 'react-flatpickr';
import { Calendar } from 'lucide-react';
import 'flatpickr/dist/themes/light.css';
import HotelCard from '../../components/Hotel/HotelCard';
import FadeInSection from '../../components/Common/FadeInSection';

const FASTAPI_BASE = 'https://fastapiratehawk.co.uk';
const PER_PAGE = 9;

const fmtDate = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const getTodayTomorrow = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return { checkin: fmtDate(today), checkout: fmtDate(tomorrow) };
};
const getUserPrefs = () => {
    try {
        const s = localStorage.getItem('user_currency');
        const r = localStorage.getItem('user_residency');
        if (s) {
            const p = JSON.parse(s);
            return { currency: p.code || 'USD', currencySymbol: p.symbol || '$', residency: r || 'gb' };
        }
    } catch (_) { }
    return { currency: 'USD', currencySymbol: '$', residency: 'gb' };
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
    const params = new URLSearchParams(location.search);

    const lat = parseFloat(params.get('lat'));
    const lon = parseFloat(params.get('lon'));
    const locationName = params.get('location') || 'Nearby';

    const initCheckin = params.get('checkin') || getTodayTomorrow().checkin;
    const initCheckout = params.get('checkout') || getTodayTomorrow().checkout;

    // dateRange drives the calendar display; datesRef is the source of truth for API calls
    const [dateRange, setDateRange] = useState([new Date(initCheckin), new Date(initCheckout)]);
    const datesRef = useRef({ checkin: initCheckin, checkout: initCheckout });

    // Live currency/residency — initialised from localStorage (Navbar selections override URL params)
    const userPrefsRef = useRef(getUserPrefs());
    const [currencySymbol, setCurrencySymbol] = useState(() => userPrefsRef.current.currencySymbol);

    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pricesLoading, setPricesLoading] = useState(false);
    const [error, setError] = useState(null);
    const [visible, setVisible] = useState(PER_PAGE);
    const [sortBy, setSortBy] = useState('stars');

    // Keep a ref to hotel IDs so refreshPrices can re-use them without a full re-fetch
    const hotelIdsRef = useRef([]);

    // Sync prefs ref whenever Navbar fires events, then refresh prices
    useEffect(() => {
        const onCurrency = () => {
            const p = getUserPrefs();
            userPrefsRef.current = p;
            setCurrencySymbol(p.currencySymbol);
            refreshPrices();
        };
        const onResidency = () => {
            userPrefsRef.current = getUserPrefs();
            refreshPrices();
        };
        window.addEventListener('currencyChanged', onCurrency);
        window.addEventListener('residencyChanged', onResidency);
        return () => {
            window.removeEventListener('currencyChanged', onCurrency);
            window.removeEventListener('residencyChanged', onResidency);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lat, lon]);

    // Re-fetch only prices for already-loaded hotels with the current currency/residency/dates
    const refreshPrices = useCallback(async () => {
        if (!hotelIdsRef.current.length) return;
        const { currency, residency } = userPrefsRef.current;
        const { checkin, checkout } = datesRef.current;
        setPricesLoading(true);
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
            if (!geoRes.ok) return;
            const geoData = await geoRes.json();
            const serpHotels = geoData?.data?.hotels || [];
            setHotels(prev => prev.map(h => {
                const serp = serpHotels.find(s => String(s.id) === h.id);
                const rate = serp?.rates?.[0]?.payment_options?.payment_types?.[0];
                const price = rate?.show_amount ? Math.round(parseFloat(rate.show_amount)) : null;
                return { ...h, price };
            }));
        } catch (err) {
            console.error('[NearbyHotelsPage] refreshPrices', err);
        } finally {
            setPricesLoading(false);
        }
    }, [lat, lon]);

    // Full initial load: geo-search + hotel metadata
    const fetchAll = useCallback(async () => {
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            setError('Invalid coordinates'); setLoading(false); return;
        }
        const { currency, residency } = userPrefsRef.current;
        const { checkin, checkout } = datesRef.current;
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
            hotelIdsRef.current = hotelIds;

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
    }, [lat, lon]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const dateOptions = useMemo(() => ({
        mode: 'range',
        minDate: 'today',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'd M Y',
        rangeSeparator: ' — ',
        altInputClass: 'bg-transparent outline-none text-white text-sm font-semibold cursor-pointer w-full placeholder-slate-400 min-w-[160px]',
        showMonths: typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1,
        closeOnSelect: false,
        onChange: (dates, _, instance) => { if (dates.length === 2) instance.close(); },
        onClose: (dates, _, instance) => { if (dates.length === 1) setTimeout(() => instance.open(), 0); }
    }), []);

    const handleDateChange = (dates) => {
        if (dates.length === 2) {
            const c = fmtDate(dates[0]);
            const co = fmtDate(dates[1]);
            datesRef.current = { checkin: c, checkout: co };
            setDateRange(dates);
            refreshPrices();
        }
    };

    const sortedHotels = [...hotels].sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price ?? Infinity) - (b.price ?? Infinity);
        if (sortBy === 'price-desc') return (b.price ?? -1) - (a.price ?? -1);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.rating || 0) - (a.rating || 0); // default: stars
    });
    const shown = sortedHotels.slice(0, visible);
    const hasMore = visible < hotels.length;

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 transition-colors duration-300 min-h-screen">
            <section className="relative pt-32 pb-12 bg-slate-900 overflow-hidden px-6">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="container mx-auto max-w-6xl relative z-10">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Nearby Hotels</p>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1">
                        Hotels near <span className="italic text-emerald-400">{locationName}</span>
                    </h1>
                    <p className="text-slate-400 text-sm mb-5">
                        {loading
                            ? 'Loading properties...'
                            : pricesLoading
                                ? <span>{hotels.length} properties &mdash; <span className="text-emerald-400 animate-pulse">refreshing prices…</span></span>
                                : hotels.length + ' properties found'
                        }
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date picker pill */}
                        <label className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 cursor-pointer hover:border-emerald-500 transition-colors">
                            <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                            <Flatpickr
                                options={dateOptions}
                                value={dateRange}
                                onChange={handleDateChange}
                                className="hidden"
                            />
                        </label>
                        {/* Sort */}
                        {!loading && !error && hotels.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm font-medium whitespace-nowrap">Sort by:</span>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                    <option value="stars">Stars (High to Low)</option>
                                    <option value="price-asc">Price (Low to High)</option>
                                    <option value="price-desc">Price (High to Low)</option>
                                    <option value="name">Name (A–Z)</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </section>

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
                            {shown.map((hotel, i) => {
                                const { checkin, checkout } = datesRef.current;
                                const { currency, residency } = userPrefsRef.current;
                                const guests = JSON.stringify([{ adults: 2, children: [] }]);
                                const p = new URLSearchParams({ hotel_id: hotel.id, checkin, checkout, guests, currency, residency });
                                const detailUrl = `/hotel-detail-data/?${p.toString()}`;
                                return (
                                    <FadeInSection key={hotel.id} delay={(i % PER_PAGE * 80) + 'ms'}>
                                        <div className="h-[500px]">
                                            <HotelCard
                                                {...hotel}
                                                currencySymbol={currencySymbol}
                                                onViewDetails={() => window.open(detailUrl, '_blank')}
                                            />
                                        </div>
                                    </FadeInSection>
                                );
                            })}
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