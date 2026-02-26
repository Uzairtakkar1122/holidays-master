import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchWidget from '../SearchWidget/SearchWidget';
import {
    MapPin,
    Star,
    Calendar,
    Users,
    Wifi,
    ParkingCircle,
    Waves,
    Dumbbell,
    Utensils,
    Coffee,
    GlassWater,
    Sparkles,
    Flame,
    Bell,
    Plane,
    Accessibility,
    BriefcaseBusiness,
    Presentation,
    Droplets,
    PawPrint,
    ChevronLeft,
    ChevronRight,
    Search,
    SlidersHorizontal,
    Info,
    ArrowUpDown,
    CreditCard,
    Ban,
    Bed,
    Heart,
    Snowflake,
    Zap
} from 'lucide-react';
import './SearchResults.css';

const normalizeAmenityText = (value) => {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
};

const AMENITY_FILTER_OPTIONS = [
    { label: 'WiFi', icon: <Wifi size={16} /> },
    { label: 'Parking', icon: <ParkingCircle size={16} /> },
    { label: 'Pool', icon: <Waves size={16} /> },
    { label: 'Gym', icon: <Dumbbell size={16} /> },
    { label: 'Breakfast', icon: <Coffee size={16} /> },
    { label: 'Restaurant', icon: <Utensils size={16} /> },
    { label: 'Bar', icon: <GlassWater size={16} /> },
    { label: 'Spa', icon: <Sparkles size={16} /> },
    { label: 'Sauna', icon: <Flame size={16} /> },
    { label: 'Room Service', icon: <Bell size={16} /> },
    { label: 'Airport Transfer', icon: <Plane size={16} /> },
    { label: 'Wheelchair Accessible', icon: <Accessibility size={16} /> },
    { label: 'Family Room', icon: <Users size={16} /> },
    { label: 'Business Center', icon: <BriefcaseBusiness size={16} /> },
    { label: 'Conference Hall', icon: <Presentation size={16} /> },
    { label: 'Laundry', icon: <Droplets size={16} /> },
    { label: 'Pets Allowed', icon: <PawPrint size={16} /> }
];

const mapAmenityToIcon = (amenity) => {
    const a = normalizeAmenityText(amenity);

    if (a.includes('wifi') || a.includes('internet')) return <Wifi size={16} />;
    if (a.includes('parking')) return <ParkingCircle size={16} />;
    if (a.includes('pool')) return <Waves size={16} />;
    if (a.includes('gym') || a.includes('fitness')) return <Dumbbell size={16} />;
    if (a.includes('breakfast')) return <Coffee size={16} />;
    if (a.includes('restaurant') || a.includes('dining') || a.includes('snackbar')) return <Utensils size={16} />;
    if (a === 'bar' || a.includes('barbeque') || a.includes('barbecue') || a.includes('coffee') || a.includes('tea')) return <GlassWater size={16} />;
    if (a.includes('spa') || a.includes('steamroom') || a.includes('spatub')) return <Sparkles size={16} />;
    if (a.includes('sauna')) return <Flame size={16} />;
    if (a.includes('roomservice') || a.includes('wakeupservice') || a.includes('concierge')) return <Bell size={16} />;
    if (a.includes('airport') || a.includes('transfer')) return <Plane size={16} />;
    if (a.includes('wheelchair') || a.includes('accessible')) return <Accessibility size={16} />;
    if (a.includes('familyroom') || a.includes('familykidfriendly')) return <Users size={16} />;
    if (a.includes('businesscenter')) return <BriefcaseBusiness size={16} />;
    if (a.includes('conference') || a.includes('meeting') || a.includes('presentation') || a.includes('event')) return <Presentation size={16} />;
    if (a.includes('laundry') || a.includes('drycleaning') || a.includes('ironing')) return <Droplets size={16} />;
    if (a.includes('petsallowed')) return <PawPrint size={16} />;

    return <Zap size={16} />;
};

const getAmenityCategoryForDisplay = (amenity) => {
    const raw = String(amenity || '').trim();
    const a = normalizeAmenityText(raw);

    if (!a) return null;

    if (a.includes('wifi') || a.includes('internet')) return { key: 'wifi', label: 'Free Wi-Fi', title: raw };
    if (a.includes('parking')) return { key: 'parking', label: 'Parking', title: raw };
    if (a.includes('pool')) return { key: 'pool', label: 'Pool', title: raw };
    if (a.includes('gym') || a.includes('fitness')) return { key: 'gym', label: 'Gym', title: raw };
    if (a.includes('breakfast')) return { key: 'breakfast', label: 'Breakfast', title: raw };
    if (a.includes('restaurant') || a.includes('dining') || a.includes('snackbar')) return { key: 'restaurant', label: 'Restaurant', title: raw };
    if (a === 'bar' || a.includes('barbeque') || a.includes('barbecue') || a.includes('coffee') || a.includes('tea')) return { key: 'bar', label: 'Bar', title: raw };
    if (a.includes('spa') || a.includes('steamroom') || a.includes('spatub')) return { key: 'spa', label: 'Spa', title: raw };
    if (a.includes('sauna')) return { key: 'sauna', label: 'Sauna', title: raw };
    if (a.includes('roomservice') || a.includes('wakeupservice') || a.includes('concierge')) return { key: 'roomservice', label: 'Room Service', title: raw };
    if (a.includes('airport') || a.includes('transfer')) return { key: 'airporttransfer', label: 'Airport Transfer', title: raw };
    if (a.includes('wheelchair') || a.includes('accessible')) return { key: 'accessible', label: 'Accessible', title: raw };
    if (a.includes('familyroom') || a.includes('familykidfriendly')) return { key: 'family', label: 'Family Room', title: raw };
    if (a.includes('businesscenter')) return { key: 'business', label: 'Business Center', title: raw };
    if (a.includes('conference') || a.includes('meeting') || a.includes('presentation') || a.includes('event')) return { key: 'conference', label: 'Conference Hall', title: raw };
    if (a.includes('laundry') || a.includes('drycleaning') || a.includes('ironing')) return { key: 'laundry', label: 'Laundry', title: raw };
    if (a.includes('petsallowed')) return { key: 'pets', label: 'Pets Allowed', title: raw };

    // Fallback: de-dupe by normalized string, but display original text.
    return { key: a, label: raw, title: raw };
};

// Helper function to get currency symbol
const getCurrencySymbol = (code) => {
    const symbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'PKR': '₨',
        'AED': 'د.إ', 'SAR': '﷼', 'INR': '₹', 'JPY': '¥',
        'CNY': '¥', 'AUD': 'A$', 'CAD': 'C$'
    };
    return symbols[code?.toUpperCase()] || code || '$';
};

const SearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);

    // Search Params
    const searchParams = useMemo(() => ({
        location: queryParams.get('location') || '',
        region_id: queryParams.get('region_id') || '',
        checkin: queryParams.get('checkin') || '',
        checkout: queryParams.get('checkout') || '',
        adults: parseInt(queryParams.get('adults')) || 2,
        children_ages: JSON.parse(queryParams.get('children_ages') || '[]'),
        residency: queryParams.get('residency') || 'pk',
        currency: queryParams.get('currency') || 'USD'
    }), [location.search]);

    // State for current currency and residency (can change from Navbar)
    const [currentCurrency, setCurrentCurrency] = useState(() => {
        // First, try to get from URL params (highest priority)
        const urlCurrency = queryParams.get('currency');
        if (urlCurrency) {
            // Get the symbol from localStorage if available, otherwise use default
            const saved = localStorage.getItem('user_currency');
            try {
                const parsed = saved ? JSON.parse(saved) : null;
                // Use URL currency code but try to get the symbol from localStorage
                return {
                    code: urlCurrency.toUpperCase(),
                    symbol: (parsed?.code === urlCurrency ? parsed.symbol : getCurrencySymbol(urlCurrency))
                };
            } catch {
                return { code: urlCurrency.toUpperCase(), symbol: getCurrencySymbol(urlCurrency) };
            }
        }

        // Fallback to localStorage
        const saved = localStorage.getItem('user_currency');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { code: parsed.code || 'USD', symbol: parsed.symbol || '$' };
            } catch {
                return { code: 'USD', symbol: '$' };
            }
        }
        return { code: 'USD', symbol: '$' };
    });

    const [currentResidency, setCurrentResidency] = useState(() => {
        const saved = localStorage.getItem('user_residency');
        return saved || searchParams.residency;
    });

    // State
    const [allAvailableHotels, setAllAvailableHotels] = useState([]); // Source of truth: only available ones
    const [first10Hotels, setFirst10Hotels] = useState([]); // First 10 hotels (may include sold out) - only for page 1
    const [loading, setLoading] = useState(true);
    const [metaLoading, setMetaLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const resultsPerPage = 10;

    // Filter State
    const [filters, setFilters] = useState({
        stars: [],
        priceRange: [0, 100000],
        amenities: [],
        mealPlans: []
    });
    const [sortOrder, setSortOrder] = useState('recommended');

    const searchRunIdRef = useRef(0);
    const hotelInfoCacheRef = useRef({});
    const didMountRef = useRef(false);

    // Calculate dynamic price range from available hotels
    const priceStats = useMemo(() => {
        const hotelsWithPricing = allAvailableHotels.filter(h => h.hasPricing && h.rates?.[0]);
        if (hotelsWithPricing.length === 0) {
            return { min: 0, max: 100000, hasData: false };
        }

        const prices = hotelsWithPricing.map(h =>
            h.rates[0]?.payment_options?.payment_types?.[0]?.show_amount || 0
        ).filter(p => p > 0);

        if (prices.length === 0) {
            return { min: 0, max: 100000, hasData: false };
        }

        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));

        // Round max to nearest sensible value
        const roundedMax = maxPrice < 1000 ? Math.ceil(maxPrice / 100) * 100 : Math.ceil(maxPrice / 1000) * 1000;

        return { min: minPrice, max: roundedMax, hasData: true };
    }, [allAvailableHotels]);

    // Update filter max when price stats change
    useEffect(() => {
        if (priceStats.hasData && filters.priceRange[1] === 100000) {
            setFilters(prev => ({ ...prev, priceRange: [0, priceStats.max] }));
        }
    }, [priceStats.max, priceStats.hasData]);

    // Sync currentCurrency with URL params when currency changes
    useEffect(() => {
        if (searchParams.currency && searchParams.currency !== currentCurrency?.code) {
            console.log('🔄 Syncing currency display from URL:', searchParams.currency);
            setCurrentCurrency({
                code: searchParams.currency.toUpperCase(),
                symbol: getCurrencySymbol(searchParams.currency)
            });
        }
    }, [searchParams.currency]);

    useEffect(() => {
        if (searchParams.region_id) {
            initiateSearch();
        }
    }, [searchParams]);

    useEffect(() => {
        if (loading) return;
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, loading]);

    // Listen to Navbar currency/residency changes and re-fetch results
    useEffect(() => {
        const handleResidencyChange = (e) => {
            if (e.detail?.countryCode) {
                const newResidency = e.detail.countryCode.toLowerCase();
                console.log('🌍 Residency changed to:', newResidency);
                setCurrentResidency(newResidency);

                // Re-fetch with new residency
                if (searchParams.region_id && newResidency !== currentResidency) {
                    console.log('♻️ Re-fetching results with new residency...');
                    // Update URL with new residency
                    const newParams = new URLSearchParams(location.search);
                    newParams.set('residency', newResidency);
                    navigate(`?${newParams.toString()}`, { replace: true });
                }
            }
        };

        const handleCurrencyChange = (e) => {
            if (e.detail?.currencyCode) {
                console.log('💱 Currency changed to:', e.detail.currencyCode);
                const saved = localStorage.getItem('user_currency');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const newCurrencyCode = parsed.code || 'USD';

                        // Update currency state
                        setCurrentCurrency({
                            code: newCurrencyCode,
                            symbol: parsed.symbol || '$'
                        });

                        // Re-fetch with new currency if it's different
                        if (searchParams.region_id && newCurrencyCode !== currentCurrency?.code) {
                            console.log('♻️ Re-fetching results with new currency:', newCurrencyCode);
                            // Update URL with new currency
                            const newParams = new URLSearchParams(location.search);
                            newParams.set('currency', newCurrencyCode);
                            navigate(`?${newParams.toString()}`, { replace: true });
                        }
                    } catch (err) {
                        console.error('Error parsing currency:', err);
                    }
                }
            }
        };

        window.addEventListener('residencyChanged', handleResidencyChange);
        window.addEventListener('currencyChanged', handleCurrencyChange);

        return () => {
            window.removeEventListener('residencyChanged', handleResidencyChange);
            window.removeEventListener('currencyChanged', handleCurrencyChange);
        };
    }, [searchParams.region_id, currentResidency, location.search, navigate]);

    const normalizeGetHotelsInfoResponse = (json) => {
        const root = (json && typeof json === 'object') ? json : null;
        const candidate = root?.data ?? root;
        const byId = {};

        if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
            for (const [k, v] of Object.entries(candidate)) {
                if (!v || typeof v !== 'object') continue;
                const id = String(v.id ?? v.hotel_id ?? v.hid ?? v.hotelId ?? k).trim();
                if (!id) continue;
                byId[id] = v;
            }
            return byId;
        }

        if (Array.isArray(candidate)) {
            for (const item of candidate) {
                if (!item || typeof item !== 'object') continue;
                const id = String(item.id ?? item.hotel_id ?? item.hid ?? item.hotelId ?? '').trim();
                if (!id) continue;
                byId[id] = item;
            }
        }

        return byId;
    };

    const INFO_BATCH_SIZE = 500;

    const fetchHotelsInfoChunk = async (hotelIds) => {
        const ids = Array.from(new Set(hotelIds.filter(Boolean)));
        if (!ids.length) return {};

        try {
            const res = await fetch('https://fastapiratehawk.co.uk/get-hotels-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hotel_ids: ids })
            });
            if (!res.ok) throw new Error(`FastAPI /get-hotels-info returned ${res.status}`);
            const json = await res.json();
            return normalizeGetHotelsInfoResponse(json);
        } catch (err) {
            console.error('Hotel-info chunk fetch failed:', err);
            return {};
        }
    };

    const fetchHotelsInfoBatched = async (hotelIds, batchSize = INFO_BATCH_SIZE) => {
        const uniqueIds = Array.from(new Set(hotelIds.filter(Boolean).map(id => String(id).trim())));
        if (uniqueIds.length === 0) return {};

        const missing = uniqueIds.filter(id => !hotelInfoCacheRef.current[id]);
        if (missing.length === 0) return {};

        const result = {};
        for (let i = 0; i < missing.length; i += batchSize) {
            const chunkIds = missing.slice(i, i + batchSize);
            const infoById = await fetchHotelsInfoChunk(chunkIds);
            Object.assign(result, infoById);
        }

        if (Object.keys(result).length > 0) {
            hotelInfoCacheRef.current = { ...hotelInfoCacheRef.current, ...result };
        }

        return result;
    };

    const enrichHotelsWithBulkInfo = (hotelsList, infoById) => {
        return hotelsList.map(h => {
            const info = infoById[h.id];
            if (!info) return h;

            return {
                ...h,
                name: info.name || h.name,
                address: info.address || h.address,
                star_rating: parseInt(info.stars || h.star_rating || 0),
                images: Array.isArray(info.images) ? info.images.slice(0, 10).map(img => img.replace('{size}', '640x400')) : [],
                amenities: Array.isArray(info.amenities) ? info.amenities : [],
                description: info.description_struct?.[0]?.paragraphs?.[0] || info.description || "",
                check_in_time: info.check_in_time || "",
                check_out_time: info.check_out_time || ""
            };
        });
    };

    const composePricedHotel = (pricingHotel, info = null, fallback = {}) => {
        const normalizedId = String(pricingHotel.id).trim();
        const infoImages = Array.isArray(info?.images)
            ? info.images.slice(0, 10).map(img => img.replace('{size}', '640x400'))
            : null;

        return {
            ...fallback,
            id: pricingHotel.id,
            _id: normalizedId,
            name: info?.name || fallback.name || pricingHotel.name || 'Hotel',
            address: info?.address || fallback.address || '',
            star_rating: parseInt(info?.stars || fallback.star_rating || pricingHotel.rg_ext?.class || 0),
            images: infoImages || fallback.images || [],
            amenities: Array.isArray(info?.amenities) ? info.amenities : (fallback.amenities || []),
            description: info?.description_struct?.[0]?.paragraphs?.[0] || info?.description || fallback.description || '',
            check_in_time: info?.check_in_time || fallback.check_in_time || '',
            check_out_time: info?.check_out_time || fallback.check_out_time || '',
            rates: pricingHotel.rates || [],
            hasPricing: true,
            loadingPrice: false,
            soldOut: false,
            meal_plans: pricingHotel.rates?.map(r => r.meal) || [],
            serp_filters: pricingHotel.serp_filters || []
        };
    };

    const initiateSearch = async () => {
        const runId = ++searchRunIdRef.current;
        setMetaLoading(true);
        setLoading(true);
        setError(null);
        setCurrentPage(1);
        setFilters({
            stars: [],
            priceRange: [0, 100000],
            amenities: [],
            mealPlans: []
        });
        setSortOrder('recommended');
        // Clear previous results so loader/skeleton shows on new searches.
        setAllAvailableHotels([]);
        setFirst10Hotels([]);
        hotelInfoCacheRef.current = {};

        // Use current residency from state (may have changed from Navbar)
        const activeResidency = currentResidency || searchParams.residency;
        console.log('🔍 Starting search for region:', searchParams.region_id, 'with residency:', activeResidency);

        const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 30000) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, { ...options, signal: controller.signal });
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(`Request failed (${res.status}) for ${url}: ${text.slice(0, 200)}`);
                }
                return await res.json();
            } finally {
                clearTimeout(timeoutId);
            }
        };

        try {
            let rawCandidates = [];
            let candidateById = {};
            let first10Enriched = [];
            let infoById = {};

            // Step 1: Fetch candidate IDs from FastAPI
            console.log('📡 Step 1: Fetching hotels from FastAPI...');
            try {
                const metadata = await fetchJsonWithTimeout(
                    `https://fastapiratehawk.co.uk/hotels/search?region_id=${searchParams.region_id}&limit=200`,
                    {},
                    20000
                );
                rawCandidates = metadata.data?.hotels || [];
                candidateById = {};
                rawCandidates.forEach(h => {
                    candidateById[String(h.id).trim()] = h;
                });
                console.log(`✅ FastAPI returned ${rawCandidates.length} hotels`);
            } catch (e) {
                console.warn('⚠️ FastAPI candidate fetch failed, continuing with pricing-only flow:', e);
                rawCandidates = [];
                candidateById = {};
            }

            // Step 2: If FastAPI gave candidates, enrich first 10 for instant paint
            if (rawCandidates.length > 0) {
                console.log('📡 Step 2: Fetching details for first 10 hotels...');
                const first10Ids = rawCandidates.slice(0, 10).map(h => h.id);
                infoById = await fetchHotelsInfoBatched(first10Ids);
                first10Enriched = enrichHotelsWithBulkInfo(
                    rawCandidates.slice(0, 10).map(h => ({ ...h, rates: [], hasPricing: false, loadingPrice: true })),
                    infoById
                );
                console.log(`✅ Enriched first 10 hotels, showing with skeleton loaders`);

                // Show first 10 hotels immediately with skeleton price loaders
                if (runId !== searchRunIdRef.current) return;
                setFirst10Hotels(first10Enriched);
                setAllAvailableHotels(first10Enriched);
                setMetaLoading(false);
            } else {
                // Province/State IDs often return 0 from FastAPI — still continue to pricing.
                console.log('ℹ️ FastAPI returned 0 candidates; continuing with pricing-only flow (common for Province/State regions).');
            }

            // Step 3: Fetch Pricing from RateHawk Proxy in background
            console.log('🔍 Currency Debug:', {
                'currentCurrency.code': currentCurrency?.code,
                'searchParams.currency': searchParams.currency,
                'fallback': 'USD'
            });
            const activeCurrency = currentCurrency?.code || searchParams.currency || 'USD';
            console.log('💰 Step 3: Fetching pricing from RateHawk with residency:', activeResidency, 'and currency:', activeCurrency);
            const pricingData = await fetchJsonWithTimeout(
                '/api/search',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        checkin: searchParams.checkin,
                        checkout: searchParams.checkout,
                        residency: activeResidency, // Use active residency
                        language: 'en',
                        currency: activeCurrency, // Pass currency to API
                        guests: [
                            {
                                adults: searchParams.adults,
                                children: searchParams.children_ages
                            }
                        ],
                        region_id: searchParams.region_id
                    })
                },
                60000
            );
            console.log(`✅ RateHawk returned pricing for ${pricingData.data?.hotels?.length || 0} hotels`);

            if (pricingData.data?.hotels && pricingData.data.hotels.length > 0) {
                const pricingHotels = pricingData.data.hotels
                    .filter(h => h?.id !== undefined && h?.id !== null)
                    .map(h => ({ ...h, _id: String(h.id).trim() }));
                const pricingById = {};
                pricingHotels.forEach(h => {
                    pricingById[h._id] = h;
                });

                // Price API is the final source for hotel IDs/order/pagination
                const pricedList = pricingHotels.map(ph =>
                    composePricedHotel(ph, null, candidateById[ph._id] || {})
                );

                // Build first 10 from FAST initial list, then mark each as priced/sold-out (only when we have the fast list)
                const first10Final = (first10Enriched.length > 0)
                    ? first10Enriched.map(fastHotel => {
                        const fastId = String(fastHotel.id).trim();
                        const pricingHotel = pricingById[fastId];

                        if (!pricingHotel) {
                            return {
                                ...fastHotel,
                                rates: [],
                                hasPricing: false,
                                loadingPrice: false,
                                soldOut: true,
                                meal_plans: [],
                                serp_filters: []
                            };
                        }

                        return composePricedHotel(pricingHotel, infoById[fastId], candidateById[fastId] || fastHotel);
                    })
                    : [];

                // Enrich only first page immediately (fast UX), lazy-load next pages later
                const firstPagePricing = pricingHotels.slice(0, resultsPerPage);
                const firstPageIds = firstPagePricing.map(h => h.id);
                const firstPageInfo = await fetchHotelsInfoBatched(firstPageIds);
                const firstPageHotels = firstPagePricing.map(ph =>
                    composePricedHotel(ph, firstPageInfo[ph._id], candidateById[ph._id] || {})
                );

                const firstPageById = {};
                firstPageHotels.forEach(h => {
                    firstPageById[String(h.id).trim()] = h;
                });

                const hydratedPricedList = pricedList.map(h => firstPageById[String(h.id).trim()] || h);

                console.log(`✅ Price API hotels: ${hydratedPricedList.length} (initial page hydrated: ${firstPageHotels.length})`);

                if (runId !== searchRunIdRef.current) return;
                setFirst10Hotels(first10Final);
                setAllAvailableHotels(hydratedPricedList);
                setMetaLoading(false);

                // Background prefetch: pull hotel info for ALL priced hotels in big batches (500 IDs/request)
                // This prevents lots of small calls when paginating.
                (async () => {
                    const allPricedIds = pricingHotels.map(h => h.id);
                    const allInfoById = await fetchHotelsInfoBatched(allPricedIds, INFO_BATCH_SIZE);
                    if (runId !== searchRunIdRef.current) return;
                    if (Object.keys(allInfoById).length === 0) return;
                    setAllAvailableHotels(prev => enrichHotelsWithBulkInfo(prev, allInfoById));
                    setFirst10Hotels(prev => enrichHotelsWithBulkInfo(prev, allInfoById));
                })();
            } else {
                // No priced hotels from search API
                console.log('⚠️ No hotels available from RateHawk search response');
                const soldOutFirst10 = (first10Enriched.length > 0)
                    ? first10Enriched.map(h => ({
                        ...h,
                        rates: [],
                        hasPricing: false,
                        loadingPrice: false,
                        soldOut: true,
                        meal_plans: [],
                        serp_filters: []
                    }))
                    : [];
                setFirst10Hotels(soldOutFirst10);
                setAllAvailableHotels([]);
                setMetaLoading(false);
            }

        } catch (err) {
            console.error('❌ Search failed:', err);
            setError('Failed to load results. Please try again.');
        } finally {
            if (runId === searchRunIdRef.current) {
                setLoading(false);
            }
            console.log('✅ Search complete');
        }
    };

    const handleFilterChange = (type, value) => {
        setFilters(prev => {
            if (type === 'priceRange') return { ...prev, [type]: value };
            const current = prev[type];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [type]: updated };
        });
        setCurrentPage(1);
    };

    const sortedAndFilteredHotels = useMemo(() => {
        let result = [...allAvailableHotels];
        console.log(`🔍 Filtering ${result.length} hotels, filters:`, filters, 'sortOrder:', sortOrder);

        // Check if user has applied any filters
        const hasActiveFilters =
            filters.stars.length > 0 ||
            filters.amenities.length > 0 ||
            filters.mealPlans.length > 0 ||
            filters.priceRange[0] > 0 ||
            (priceStats.hasData && filters.priceRange[1] < priceStats.max);

        console.log('Has active filters:', hasActiveFilters);

        // If no filters are active, show all hotels (including loading/soldout)
        // If filters are active, only apply filters to hotels with pricing
        if (hasActiveFilters) {
            result = result.filter(h => h.hasPricing && !h.loadingPrice && !h.soldOut);
            console.log(`After removing loading/soldout: ${result.length} hotels`);
        }

        // Apply Star Filters
        if (filters.stars.length > 0) {
            result = result.filter(h => {
                const starRating = Math.round(h.star_rating || 0);
                return filters.stars.includes(starRating);
            });
        }

        // Price Filter
        if (filters.priceRange[0] > 0 || (priceStats.hasData && filters.priceRange[1] < priceStats.max)) {
            result = result.filter(h => {
                if (!h.rates || !h.rates[0]) return false;
                const hotelPrice = h.rates[0]?.payment_options?.payment_types?.[0]?.show_amount || 0;
                const inRange = hotelPrice >= filters.priceRange[0] && hotelPrice <= filters.priceRange[1];
                console.log(`Hotel ${h.name}: Price ${hotelPrice}, Range [${filters.priceRange[0]}, ${filters.priceRange[1]}], Included: ${inRange}`);
                return inRange;
            });
        }

        // Amenity Filter
        if (filters.amenities.length > 0) {
            result = result.filter(h => {
                const hotelAmenities = Array.isArray(h.amenities) ? h.amenities : [];
                const serpFilters = Array.isArray(h.serp_filters) ? h.serp_filters : [];
                const normalizedAmenities = hotelAmenities.map(normalizeAmenityText);

                const matchesAmenity = (filterLabel) => {
                    const f = normalizeAmenityText(filterLabel);

                    // Special cases where a straight "includes" is too strict.
                    if (f === 'wifi') {
                        const inAmenities = normalizedAmenities.some(a => a.includes('wifi') || a.includes('internet'));
                        const inSerp = serpFilters.includes('has_internet');
                        return inAmenities || inSerp;
                    }

                    if (f === 'airporttransfer') {
                        const inAmenities = normalizedAmenities.some(a => a.includes('airport') && (a.includes('transfer') || a.includes('transport')));
                        const inSerp = serpFilters.includes('has_transfer') || serpFilters.includes('has_airport_transfer');
                        return inAmenities || inSerp;
                    }

                    if (f === 'petsallowed') {
                        const inAmenities = normalizedAmenities.some(a => a.includes('petsallowed') || (a.includes('pets') && a.includes('allowed') && !a.includes('notallowed')));
                        const inSerp = serpFilters.includes('pets_allowed') || serpFilters.includes('has_pets');
                        return inAmenities || inSerp;
                    }

                    // Generic matching for the rest.
                    const inAmenities = normalizedAmenities.some(a => a.includes(f));

                    // Known serp_filters keys for popular amenities
                    const serpKeyMap = {
                        parking: 'has_parking',
                        pool: 'has_pool',
                        gym: 'has_fitness',
                        spa: 'has_spa',
                        breakfast: 'has_breakfast'
                    };
                    const serpKey = serpKeyMap[f];
                    const inSerp = serpKey ? serpFilters.includes(serpKey) : false;

                    return inAmenities || inSerp;
                };

                return filters.amenities.every(matchesAmenity);
            });
        }

        // Meal Plan Filter
        if (filters.mealPlans.length > 0) {
            result = result.filter(h => {
                if (!h.meal_plans || !Array.isArray(h.meal_plans)) return false;
                return filters.mealPlans.some(m =>
                    h.meal_plans.includes(m.toLowerCase().replace(' ', '_'))
                );
            });
        }

        // Sort - only for hotels with pricing
        const hotelsWithPricing = result.filter(h => h.hasPricing && h.rates && h.rates[0]);
        const hotelsWithoutPricing = result.filter(h => !h.hasPricing || !h.rates || !h.rates[0]);

        if (sortOrder === 'price-low') {
            hotelsWithPricing.sort((a, b) => {
                const priceA = a.rates?.[0]?.payment_options?.payment_types?.[0]?.show_amount || 0;
                const priceB = b.rates?.[0]?.payment_options?.payment_types?.[0]?.show_amount || 0;
                return priceA - priceB;
            });
        } else if (sortOrder === 'price-high') {
            hotelsWithPricing.sort((a, b) => {
                const priceA = a.rates?.[0]?.payment_options?.payment_types?.[0]?.show_amount || 0;
                const priceB = b.rates?.[0]?.payment_options?.payment_types?.[0]?.show_amount || 0;
                return priceB - priceA;
            });
        }

        // Return sorted hotels with pricing first, then others
        const finalResult = [...hotelsWithPricing, ...hotelsWithoutPricing];
        console.log(`✅ Final filtered result: ${finalResult.length} hotels`);
        return finalResult;
    }, [allAvailableHotels, filters, sortOrder]);

    // Special logic for page 1: Show first 10 hotels (including sold out) if no filters active
    const hasActiveFilters =
        filters.stars.length > 0 ||
        filters.amenities.length > 0 ||
        filters.mealPlans.length > 0 ||
        filters.priceRange[0] > 0 ||
        (priceStats.hasData && filters.priceRange[1] < priceStats.max);

    const remainingPricedHotelsAfterFirstPage = useMemo(() => {
        if (hasActiveFilters || first10Hotels.length === 0) return sortedAndFilteredHotels;

        const firstPagePricedIds = new Set(
            first10Hotels
                .filter(h => h.hasPricing)
                .map(h => String(h.id).trim())
        );

        if (firstPagePricedIds.size === 0) return sortedAndFilteredHotels;

        return sortedAndFilteredHotels.filter(h => !firstPagePricedIds.has(String(h.id).trim()));
    }, [hasActiveFilters, first10Hotels, sortedAndFilteredHotels]);

    const paginatedHotels = (() => {
        // Page 1 with no filters: Show first10Hotels (may include sold out)
        if (currentPage === 1 && !hasActiveFilters && first10Hotels.length > 0) {
            return first10Hotels;
        }

        // Other pages or with filters: Use filtered/sorted available hotels
        if (!hasActiveFilters && first10Hotels.length > 0) {
            // For pages 2+, show remaining priced hotels excluding those already shown on page 1
            const startIndex = (currentPage - 2) * resultsPerPage; // -2 because page 2 should start at index 0
            const endIndex = startIndex + resultsPerPage;
            return remainingPricedHotelsAfterFirstPage.slice(startIndex, endIndex);
        }

        // With filters active: normal pagination
        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = currentPage * resultsPerPage;
        return sortedAndFilteredHotels.slice(startIndex, endIndex);
    })();

    // Total pages calculation
    const totalPages = (() => {
        if (!hasActiveFilters && first10Hotels.length > 0) {
            // First page shows first10Hotels, remaining pages show unseen priced hotels
            const remainingHotels = remainingPricedHotelsAfterFirstPage.length;
            return 1 + Math.ceil(remainingHotels / resultsPerPage);
        }
        return Math.ceil(sortedAndFilteredHotels.length / resultsPerPage);
    })();

    const paginationItems = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages];
        }

        if (currentPage >= totalPages - 3) {
            return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }

        return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages];
    }, [currentPage, totalPages]);

    useEffect(() => {
        if (loading || paginatedHotels.length === 0) return;

        const idsNeedingInfo = paginatedHotels
            .filter(h => !h.name || !h.address || !Array.isArray(h.images) || h.images.length === 0)
            .map(h => h.id);

        if (idsNeedingInfo.length === 0) return;

        let cancelled = false;

        const hydrateVisibleHotels = async () => {
            const infoById = await fetchHotelsInfoBatched(idsNeedingInfo);
            if (cancelled || Object.keys(infoById).length === 0) return;

            setAllAvailableHotels(prev => enrichHotelsWithBulkInfo(prev, infoById));
            setFirst10Hotels(prev => enrichHotelsWithBulkInfo(prev, infoById));
        };

        hydrateVisibleHotels();

        return () => {
            cancelled = true;
        };
    }, [paginatedHotels, loading]);

    if (metaLoading && allAvailableHotels.length === 0) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-bold animate-pulse">Finding the best available hotels in {searchParams.location}...</p>
        </div>
    );

    return (
        <div className="search-results-page">
            {/* Search Widget Section - Scrollable */}
            <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <div className="container mx-auto px-4 py-6 pt-24">
                    <SearchWidget initialData={searchParams} />
                </div>
            </div>

            {/* Main Results Container */}
            <div className="bg-gradient-to-br from-slate-50/50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen transition-colors duration-300">
                <div className="container mx-auto px-4 max-w-7xl py-6">
                    <div className="results-layout">
                        {/* Sidebar Filters */}
                        <aside className="filter-sidebar">
                            <div className="filter-header">
                                <h3 className="dark:text-white"><SlidersHorizontal size={20} /> Filters</h3>
                            </div>
                            <div className="filter-content">
                                <div className="filter-section">
                                    <div className="filter-section-title dark:text-slate-200"><Star size={16} /> Star Rating</div>
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <div key={star} className="filter-option hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleFilterChange('stars', star)}>
                                            <input type="checkbox" checked={filters.stars.includes(star)} readOnly className="dark:bg-slate-800 dark:border-slate-700" />
                                            <label className="flex gap-1 dark:text-slate-300">
                                                {[...Array(star)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="filter-section">
                                    <div className="filter-section-title dark:text-slate-200"><CreditCard size={16} /> Price Range</div>
                                    <div className="px-2">
                                        {priceStats.hasData ? (
                                            <>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={priceStats.max}
                                                    step={priceStats.max > 10000 ? 1000 : 50}
                                                    value={filters.priceRange[1]}
                                                    onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
                                                    className="w-full accent-blue-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <div className="flex justify-between mt-3 text-xs font-bold text-blue-600 dark:text-blue-400">
                                                    <span>{currentCurrency?.code || 'USD'} 0</span>
                                                    <span>Up to {currentCurrency?.code || 'USD'} {filters.priceRange[1].toLocaleString()}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-xs text-slate-400 py-2">Loading prices...</div>
                                        )}
                                    </div>
                                </div>

                                <div className="filter-section">
                                    <div className="filter-section-title dark:text-slate-200"><Wifi size={16} /> Amenities</div>
                                    {AMENITY_FILTER_OPTIONS.map(({ label, icon }) => (
                                        <div key={label} className="filter-option hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleFilterChange('amenities', label)}>
                                            <input type="checkbox" checked={filters.amenities.includes(label)} readOnly className="dark:bg-slate-800 dark:border-slate-700" />
                                            <label className="dark:text-slate-300 flex items-center gap-2">
                                                <span className="text-slate-500 dark:text-slate-300">{icon}</span>
                                                <span>{label}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="filter-section">
                                    <div className="filter-section-title dark:text-slate-200"><Utensils size={16} /> Meal Plan</div>
                                    {['Breakfast', 'Half Board', 'All Inclusive'].map(m => (
                                        <div key={m} className="filter-option hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleFilterChange('mealPlans', m)}>
                                            <input type="checkbox" checked={filters.mealPlans.includes(m)} readOnly className="dark:bg-slate-800 dark:border-slate-700" />
                                            <label className="dark:text-slate-300">{m}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Results Main Section */}
                        <div className="results-container">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300">
                                <div>
                                    <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                        Hotels in <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-100 dark:decoration-blue-900 underline-offset-4">{searchParams.location}</span>
                                    </h1>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                        {loading
                                            ? 'Loading prices...'
                                            : allAvailableHotels.some(h => h.loadingPrice)
                                                ? 'Loading prices...'
                                                : `${sortedAndFilteredHotels.length} available properties found`
                                        }
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sort:</span>
                                    <select
                                        className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                    >
                                        <option value="recommended">Recommended</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {paginatedHotels.length > 0 ? (
                                    paginatedHotels.map((hotel, index) => (
                                        <HotelResultCard
                                            key={hotel.id}
                                            hotel={hotel}
                                            index={index}
                                            searchParams={searchParams}
                                            currentCurrency={currentCurrency}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Search className="text-slate-300" size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">No hotels match your filters</h3>
                                        <p className="text-slate-500 mt-2">Try clearing your filters to see more available options.</p>
                                        <button
                                            className="mt-8 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline"
                                            onClick={() => setFilters({ stars: [], priceRange: [0, priceStats.max || 100000], amenities: [], mealPlans: [] })}
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination-container">
                                    <button
                                        className="page-btn"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    {paginationItems.map((item, i) => (
                                        typeof item === 'number' ? (
                                            <button
                                                key={item}
                                                className={`page-btn ${currentPage === item ? 'active' : ''}`}
                                                onClick={() => setCurrentPage(item)}
                                            >
                                                {item}
                                            </button>
                                        ) : (
                                            <span key={`${item}-${i}`} className="page-ellipsis" aria-hidden="true">...</span>
                                        )
                                    ))}
                                    <button
                                        className="page-btn"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HotelResultCard = ({ hotel, searchParams, currentCurrency, index = 0 }) => {
    const [currentImg, setCurrentImg] = useState(0);

    const displayAmenities = useMemo(() => {
        const rawAmenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];
        const map = new Map();

        for (const a of rawAmenities) {
            const categorized = getAmenityCategoryForDisplay(a);
            if (!categorized) continue;

            const existing = map.get(categorized.key);
            if (!existing) {
                map.set(categorized.key, {
                    key: categorized.key,
                    label: categorized.label,
                    titles: [categorized.title]
                });
            } else {
                existing.titles.push(categorized.title);
            }
        }

        return Array.from(map.values()).slice(0, 4);
    }, [hotel.amenities]);
    const images = hotel.images || [];

    const bestRate = hotel.rates?.[0] || null;
    const price = bestRate?.payment_options?.payment_types?.[0]?.show_amount || 0;
    const currency = currentCurrency?.code || 'USD';

    return (
        <div
            className="hotel-card card-enter"
            style={{ display: 'flex', flexDirection: 'column', animationDelay: `${index * 0.07}s` }}
        >
            {/* Favorite Icon */}
            <div className="favorite-icon" onClick={(e) => {
                e.stopPropagation();
                const icon = e.currentTarget.querySelector('i, svg');
                if (icon) {
                    if (icon.classList && icon.classList.contains('fill-rose-500')) {
                        icon.classList.remove('fill-rose-500');
                        icon.classList.add('text-slate-400');
                    } else if (icon.classList) {
                        icon.classList.add('fill-rose-500');
                        icon.classList.remove('text-slate-400');
                    }
                }
            }}>
                <Heart size={18} className="text-slate-400" />
            </div>

            {/* Star Rating Badge */}
            {hotel.star_rating > 0 && (
                <div className="star-rating-badge">
                    <Star size={14} className="fill-yellow-400 text-yellow-400 star-icon" />
                    <span>{hotel.star_rating} Star{hotel.star_rating !== 1 ? 's' : ''}</span>
                </div>
            )}

            <div className="row g-0" style={{ flex: 1, height: '100%' }}>
                {/* Image Section - 30% width */}
                <div className="col-md-4" style={{ flex: '0 0 30%', maxWidth: '30%', padding: 0 }}>
                    <div className="image-slider" style={{ height: '100%', minHeight: '220px' }}>
                        {/* Room Type Badge */}
                        {bestRate?.room_data_trans?.main_room_type && (
                            <div className="room-type-badge">
                                <Bed size={12} />
                                <span>{bestRate.room_data_trans.main_room_type}</span>
                            </div>
                        )}

                        {/* Image Slider */}
                        <div className="slider" style={{ transform: `translateX(-${currentImg * 100}%)` }}>
                            {images.length > 0 ? images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={hotel.name}
                                    className="hotel-image"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                    <Info size={40} className="text-slate-300" />
                                </div>
                            )}
                        </div>

                        {/* Slider Navigation */}
                        {images.length > 1 && (
                            <>
                                <button
                                    className="slider-button prev-btn"
                                    onClick={() => setCurrentImg(p => Math.max(0, p - 1))}
                                    style={{ left: '12px' }}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    className="slider-button next-btn"
                                    onClick={() => setCurrentImg(p => Math.min(images.length - 1, p + 1))}
                                    style={{ right: '12px' }}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content Section - 70% width */}
                <div className="col-md-8" style={{ flex: '0 0 70%', maxWidth: '70%' }}>
                    <div className="card-body" style={{ padding: '1.5rem' }}>
                        {/* Hotel Name */}
                        <h5 className="hotel-name">{hotel.name}</h5>

                        {/* Location */}
                        <div className="location-text">
                            <MapPin size={14} className="text-blue-600" />
                            <span>{hotel.address || 'Location Not Available'}</span>
                        </div>

                        {/* Description */}
                        {hotel.description && (
                            <div className="hotel-description">
                                {hotel.description}
                            </div>
                        )}

                        {/* Check-in/out Times */}
                        {(hotel.check_in_time || hotel.check_out_time) && (
                            <div className="check-times">
                                {hotel.check_in_time && (
                                    <div className="check-time">
                                        <Zap size={12} className="text-emerald-500" />
                                        <span>Check-in: {hotel.check_in_time}</span>
                                    </div>
                                )}
                                {hotel.check_out_time && (
                                    <div className="check-time">
                                        <Zap size={12} className="text-rose-500" />
                                        <span>Check-out: {hotel.check_out_time}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Amenities List */}
                        <div className="amenities-list">
                            {displayAmenities.map((amenity) => (
                                <div
                                    key={amenity.key}
                                    className="amenity-item"
                                    title={amenity.titles.length > 1 ? amenity.titles.join(' / ') : amenity.titles[0]}
                                >
                                    {mapAmenityToIcon(amenity.label)}
                                    <span>{amenity.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Footer - Price and Button */}
                        <div
                            className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mt-3 pt-3"
                            style={{ borderTop: '1px solid var(--border-color)' }}
                        >
                            {hotel.loadingPrice ? (
                                /* Skeleton Loader for Price */
                                <div className="price-section mb-3 mb-md-0">
                                    <div style={{
                                        height: '28px',
                                        width: '140px',
                                        background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.5s infinite',
                                        borderRadius: '6px',
                                        marginBottom: '8px'
                                    }}></div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--light-text)', marginTop: '2px' }}>
                                        Loading price...
                                    </div>
                                </div>
                            ) : hotel.soldOut ? (
                                /* Sold Out Badge */
                                <div className="price-section mb-3 mb-md-0">
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.5) 0%, #fecaca 100%)',
                                        border: '1.5px solid #fca5a5',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#dc2626',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.3px'
                                    }}>
                                        <Ban size={11} />
                                        <span>Sold Out</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                        Not available for these dates
                                    </div>
                                </div>
                            ) : (
                                /* Show Price */
                                <div className="price-section mb-3 mb-md-0">
                                    <div className="price-tag">
                                        <span style={{ fontSize: '0.75rem', color: 'var(--light-text)', fontWeight: 400 }}>
                                            {currency}
                                        </span>
                                        <span>{Math.round(price).toLocaleString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--light-text)', marginTop: '2px' }}>
                                        Total for selected nights
                                    </div>
                                </div>
                            )}

                            <button
                                className="btn-view-details"
                                onClick={() => window.open(`/hotel/${hotel.id}?checkin=${searchParams.checkin}&checkout=${searchParams.checkout}&residency=${searchParams.residency}&adults=${searchParams.adults}&children_ages=${JSON.stringify(searchParams.children_ages)}`, '_blank')}
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchResults;
