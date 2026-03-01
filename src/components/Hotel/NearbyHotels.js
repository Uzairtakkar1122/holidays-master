import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HotelCard from './HotelCard';
import FadeInSection from '../Common/FadeInSection';

import { FASTAPI_BASE } from '../../constants';

/* â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
    let currency = 'USD';
    let residency = 'gb';
    let currencySymbol = '$';
    try {
        const s = localStorage.getItem('user_currency');
        if (s) { const p = JSON.parse(s); if (p?.code) currency = p.code; if (p?.symbol) currencySymbol = p.symbol; }
    } catch (_) { }
    try {
        const s = localStorage.getItem('user_residency');
        if (s) residency = s;
    } catch (_) { }
    return { currency, residency, currencySymbol };
};

const normalizeInfoResponse = (data) => {
    const byId = {};
    const list = data?.data ?? data?.hotels ?? data ?? [];
    if (Array.isArray(list)) {
        list.forEach(h => {
            const id = String(h?.id || h?.hotel_id || '').trim();
            if (id) byId[id] = h;
        });
    } else if (list && typeof list === 'object') {
        Object.entries(list).forEach(([k, v]) => {
            if (!v || typeof v !== 'object') return;
            const id = String(v.id || v.hotel_id || k).trim();
            if (id) byId[id] = v;
        });
    }
    return byId;
};

/* â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const NearbyHotels = () => {
    const navigate = useNavigate();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [geoInfo, setGeoInfo] = useState({ lat: null, lon: null, name: '' });
    const [userPrefs, setUserPrefs] = useState(() => getUserPrefs());
    const userPrefsRef = useRef(getUserPrefs()); // always current, safe inside callbacks

    // Keep currency & residency in sync with Navbar header changes
    useEffect(() => {
        const sync = () => {
            const latest = getUserPrefs();
            userPrefsRef.current = latest;
            setUserPrefs(latest);
        };
        window.addEventListener('currencyChanged', sync);
        window.addEventListener('residencyChanged', sync);
        return () => {
            window.removeEventListener('currencyChanged', sync);
            window.removeEventListener('residencyChanged', sync);
        };
    }, []);

    const fetchNearby = useCallback(async (lat, lon) => {
        setLoading(true);
        const { checkin, checkout } = getTodayTomorrow();
        const { currency, residency } = userPrefsRef.current; // always reads header selection
        try {
            const geoRes = await fetch('/api/geo-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: lat, longitude: lon,
                    checkin, checkout, currency, residency,
                    language: 'en',
                    guests: [{ adults: 2, children: [] }],
                    radius: 6000,
                    limit: 50
                })
            });
            if (!geoRes.ok) throw new Error('Geo search failed');
            const geoData = await geoRes.json();

            const hotelIds = (geoData?.data?.hotels || []).map(h => String(h.id)).filter(Boolean);
            if (!hotelIds.length) { setLoading(false); return; }

            const infoRes = await fetch(`${FASTAPI_BASE}/get-hotels-info`, {
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

                    // Extract price from SERP rates
                    const rate = serpHotel.rates?.[0]?.payment_options?.payment_types?.[0];
                    const price = rate?.show_amount
                        ? Math.round(parseFloat(rate.show_amount))
                        : null;

                    return {
                        id,
                        name: info.name || serpHotel.name || '',
                        location: info.address || '',
                        rating: stars || '',
                        image,
                        tags: stars > 0 ? [`${stars} Star`] : [],
                        price,
                        currencySymbol: userPrefsRef.current.currencySymbol || '$',
                    };
                })
                .filter(h => h.name)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 3);

            setHotels(combined);
        } catch (err) {
            console.error('[NearbyHotels]', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFromIP = useCallback(async () => {
        try {
            const res = await fetch('http://ip-api.com/json/');
            const data = await res.json();
            if (data?.status === 'success' && data?.lat && data?.lon) {
                setGeoInfo({ lat: data.lat, lon: data.lon, name: [data.city, data.country].filter(Boolean).join(', ') });
                fetchNearby(data.lat, data.lon);
            } else {
                setLoading(false);
            }
        } catch {
            setError(true);
            setLoading(false);
        }
    }, [fetchNearby]);

    useEffect(() => {
        fetchFromIP();
    }, [fetchFromIP]);

    const handleSeeAll = () => {
        const { checkin, checkout } = getTodayTomorrow();
        const { currency, residency } = userPrefs;
        navigate(
            `/nearby?lat=${geoInfo.lat}&lon=${geoInfo.lon}` +
            `&location=${encodeURIComponent(geoInfo.name || 'Nearby Hotels')}` +
            `&checkin=${checkin}&checkout=${checkout}` +
            `&currency=${currency}&residency=${residency}`
        );
    };

    return (
        <section className="py-12 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
                <FadeInSection>
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">
                            Hotels Near You
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            {geoInfo.name
                                ? `Top-rated properties near ${geoInfo.name}, sorted by stars.`
                                : 'Top-rated properties near your current location, sorted by stars.'}
                        </p>
                    </div>
                </FadeInSection>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-transparent dark:border-slate-800 animate-pulse">
                                <div className="h-64 bg-slate-200 dark:bg-slate-800" />
                                <div className="p-6 space-y-3">
                                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />
                                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error || hotels.length === 0 ? (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-8">
                        Could not load nearby hotels right now.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {hotels.map((hotel, i) => {
                            const { checkin, checkout } = getTodayTomorrow();
                            const { currency, residency } = userPrefsRef.current;
                            const guests = JSON.stringify([{ adults: 2, children: [] }]);
                            const p = new URLSearchParams({ hotel_id: hotel.id, checkin, checkout, guests, currency, residency });
                            return (
                                <FadeInSection key={hotel.id} delay={`${i * 150}ms`}>
                                    <HotelCard
                                        {...hotel}
                                        onViewDetails={() => window.open(`/hotel-detail-data/?${p.toString()}`, '_blank')}
                                    />
                                </FadeInSection>
                            );
                        })}
                    </div>
                )}

                <div className="mt-12 text-center">
                    <button
                        onClick={handleSeeAll}
                        className="bg-transparent border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white px-8 py-3 rounded-full font-bold hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all duration-300"
                    >
                        See All Properties
                    </button>
                </div>
            </div>
        </section>
    );
};

export default NearbyHotels;
