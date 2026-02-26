import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Flatpickr from 'react-flatpickr';
import { MapPin, Calendar, Users, Search, Minus, Plus, ChevronDown, Bed, Info } from 'lucide-react';
import { rateHawkService } from '../../api/ratehawk';
import { countries } from '../../data/geoData';
import "flatpickr/dist/themes/light.css";
import './SearchWidget.css';

const SearchWidget = ({ initialData = null }) => {
    // --- State ---
    const [destination, setDestination] = useState(initialData?.location || '');
    const [selectedLocation, setSelectedLocation] = useState(
        initialData ? { id: initialData.region_id, name: initialData.location, selectionType: 'region' } : null
    );
    const [suggestions, setSuggestions] = useState({ regions: [], hotels: [] });
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [showLocationPopup, setShowLocationPopup] = useState(false);
    const navigate = useNavigate();

    const [dateRange, setDateRange] = useState(
        initialData?.checkin && initialData?.checkout
            ? [new Date(initialData.checkin), new Date(initialData.checkout)]
            : [new Date(), new Date(new Date().setDate(new Date().getDate() + 1))]
    );

    const [adults, setAdults] = useState(initialData?.adults || 2);
    const [children, setChildren] = useState(initialData?.children_ages || []);
    const [showGuestsPopup, setShowGuestsPopup] = useState(false);
    const flatpickrRef = useRef(null);
    const seededQueryRef = useRef('');
    const isMountedRef = useRef(false);
    const prevShowLocationPopupRef = useRef(false);
    const seedInFlightRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Residency and Currency synchronized with global selection (Navbar)
    const [residency, setResidency] = useState(() => {
        const saved = localStorage.getItem('user_residency');
        return saved || 'pk';
    });

    const [currency, setCurrency] = useState(() => {
        const saved = localStorage.getItem('user_currency');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.code || 'USD';
            } catch {
                return 'USD';
            }
        }
        return 'USD';
    });

    // Listen to Navbar currency/residency changes
    useEffect(() => {
        const handleResidencyChange = (e) => {
            if (e.detail?.countryCode) {
                setResidency(e.detail.countryCode.toLowerCase());
            }
        };

        const handleCurrencyChange = (e) => {
            if (e.detail?.currencyCode) {
                setCurrency(e.detail.currencyCode);
            }
        };

        window.addEventListener('residencyChanged', handleResidencyChange);
        window.addEventListener('currencyChanged', handleCurrencyChange);

        return () => {
            window.removeEventListener('residencyChanged', handleResidencyChange);
            window.removeEventListener('currencyChanged', handleCurrencyChange);
        };
    }, []);

    const locationRef = useRef(null);
    const guestsRef = useRef(null);
    const dateOptions = useMemo(() => {
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
        return {
            mode: 'range',
            minDate: 'today',
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd M Y',
            rangeSeparator: ' — ',
            altInputClass: "w-full text-gray-900 dark:text-slate-100 font-semibold placeholder-gray-400 dark:placeholder-slate-600 outline-none bg-transparent text-base cursor-pointer p-0",
            enableTime: false,
            showMonths: isDesktop ? 2 : 1,
            disableMobile: false,
            allowInput: false,
            clickOpens: true,
            closeOnSelect: false,
            onClose: (selectedDates, dateStr, instance) => {
                if (selectedDates.length === 1) {
                    setTimeout(() => {
                        instance.open();
                    }, 0);
                }
            }
        };
    }, []);

    // --- Effects ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationRef.current && !locationRef.current.contains(event.target)) setShowLocationPopup(false);
            if (guestsRef.current && !guestsRef.current.contains(event.target)) setShowGuestsPopup(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Search Autocomplete Logic ---
    useEffect(() => {
        let cancelled = false;
        const delayDebounceFn = setTimeout(() => {
            (async () => {
                if (destination.length >= 2 && !selectedLocation) {
                    try {
                        setIsSearchingLocation(true);
                        setShowLocationPopup(true);
                        const results = await rateHawkService.autocomplete(destination);
                        if (cancelled) return;
                        setSuggestions(results);
                        seededQueryRef.current = destination;
                    } catch (e) {
                        if (cancelled) return;
                        setSuggestions({ regions: [], hotels: [] });
                    } finally {
                        if (isMountedRef.current) setIsSearchingLocation(false);
                    }
                } else if (selectedLocation) {
                    setSuggestions({ regions: [], hotels: [] });
                }
            })();
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(delayDebounceFn);
        };
    }, [destination, selectedLocation]);

    // Seed suggestions when user opens the dropdown without typing (professional UX)
    useEffect(() => {
        const wasOpen = prevShowLocationPopupRef.current;
        prevShowLocationPopupRef.current = showLocationPopup;

        // Only run seeding when the popup transitions from closed -> open.
        if (!showLocationPopup || wasOpen) return;
        if (selectedLocation) return;
        if (destination.length >= 2) return;
        if (seedInFlightRef.current) return;

        const residencyCode = (residency || 'pk').toLowerCase();
        const countryName = countries.find(c => c.code === residencyCode)?.name || '';
        const seedQuery = countryName || 'Pakistan';
        if (seededQueryRef.current === seedQuery) return;

        let cancelled = false;
        (async () => {
            try {
                seedInFlightRef.current = true;
                setIsSearchingLocation(true);
                const results = await rateHawkService.autocomplete(seedQuery);
                if (cancelled) return;
                setSuggestions(results);
                seededQueryRef.current = seedQuery;
            } finally {
                seedInFlightRef.current = false;
                if (isMountedRef.current) setIsSearchingLocation(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [showLocationPopup, destination.length, selectedLocation, residency]);

    const handleLocationSelect = (item, type) => {
        setDestination(item.name);

        // IMPORTANT:
        // RateHawk pricing search is REGION-based and requires a numeric region_id.
        // Hotel suggestions from multicomplete have a string hotel id (e.g. "best_western_...")
        // and usually also include a numeric region_id. If the user selects a hotel, we must
        // navigate/search by its region_id, not the hotel id.
        if (type === 'hotel') {
            const regionId = item?.region_id ?? item?.regionId ?? item?.region?.id;
            setSelectedLocation({
                ...item,
                id: regionId ?? item?.id,
                selectionType: type
            });
        } else {
            // Keep RateHawk's region.type (City / Province (State) / etc). Store our selection kind separately.
            setSelectedLocation({ ...item, selectionType: type });
        }

        setShowLocationPopup(false);
    };

    const handleLocationInput = (e) => {
        setDestination(e.target.value);
        setSelectedLocation(null);
    };

    const handleGuestChange = (type, action) => {
        if (type === 'adults') {
            if (action === 'increment' && adults < 6) setAdults(adults + 1);
            if (action === 'decrement' && adults > 1) setAdults(adults - 1);
        } else if (type === 'children') {
            if (action === 'increment' && children.length < 4) {
                setChildren([...children, 0]);
            }
            if (action === 'decrement' && children.length > 0) {
                setChildren(children.slice(0, -1));
            }
        }
    };

    const handleChildAgeChange = (index, age) => {
        const newChildren = [...children];
        newChildren[index] = parseInt(age);
        setChildren(newChildren);
    };

    const handleDateChange = (dates, dateStr, instance) => {
        setDateRange(dates);
        if (dates.length === 2) {
            setTimeout(() => {
                instance.close();
            }, 150);
            return;
        }
        if (!instance.isOpen) {
            instance.open();
        }
    };

    const handleSearch = () => {
        if (!selectedLocation) {
            alert('Please select a destination from the list.');
            return;
        }

        const regionId = selectedLocation?.region_id ?? selectedLocation?.regionId ?? selectedLocation?.id;
        const regionIdNumber = parseInt(String(regionId), 10);
        if (!Number.isFinite(regionIdNumber)) {
            alert('Please select a destination region (City/State) from the list.');
            return;
        }

        const params = new URLSearchParams({
            location: destination,
            region_id: String(regionIdNumber),
            checkin: dateRange[0] ? dateRange[0].toISOString().split('T')[0] : '',
            checkout: dateRange[1] ? dateRange[1].toISOString().split('T')[0] : '',
            adults: adults.toString(),
            children_ages: JSON.stringify(children),
            residency: residency, // Use current residency state from Navbar
            currency: currency // Pass currency for price display
        });

        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 relative z-[60] text-left">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-gray-200/60 dark:border-slate-800 p-3 flex flex-col md:flex-row items-stretch gap-2 relative z-50 transition-colors duration-300">

                {/* Destination Input Section */}
                <div className="flex-1 min-w-0 relative" ref={locationRef}>
                    <div
                        className="h-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-text group border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                        onClick={() => setShowLocationPopup(true)}
                    >
                        <MapPin className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" size={22} />
                        <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-1">Where</label>
                            <input
                                type="text"
                                placeholder="Search destinations"
                                className="w-full text-gray-900 dark:text-slate-100 font-semibold placeholder-gray-400 dark:placeholder-slate-600 outline-none bg-transparent text-base p-0"
                                value={destination}
                                onChange={handleLocationInput}
                                onFocus={() => setShowLocationPopup(true)}
                            />
                        </div>
                    </div>

                    {/* Results Dropdown */}
                    {showLocationPopup && (
                        <div className="absolute top-[calc(100%+8px)] left-0 w-full md:w-[480px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-slate-800 overflow-hidden z-[100] animate-slide-down text-left transition-colors duration-300">
                            <div className="max-h-[420px] overflow-y-auto custom-scrollbar p-3">
                                {isSearchingLocation && (
                                    <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
                                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm font-medium">Searching...</span>
                                    </div>
                                )}

                                {!isSearchingLocation && destination.length < 2 && (suggestions.regions?.length || 0) === 0 && (suggestions.hotels?.length || 0) === 0 && (
                                    <div className="px-4 py-10 text-center text-sm text-gray-500 font-medium">
                                        Start typing to search cities and states.
                                    </div>
                                )}

                                {(() => {
                                    const regions = suggestions.regions || [];
                                    const cities = [];
                                    const states = [];
                                    const otherRegions = [];
                                    for (const r of regions) {
                                        const t = String(r.type || '').toLowerCase();
                                        if (t.includes('city')) cities.push(r);
                                        else if (t.includes('province') || t.includes('state')) states.push(r);
                                        else otherRegions.push(r);
                                    }

                                    const renderRegionRow = (region) => (
                                        <div
                                            key={region.id}
                                            className="search-result-item flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition-all group"
                                            onClick={() => handleLocationSelect(region, 'region')}
                                        >
                                            <div className="icon-box w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-all shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
                                                <MapPin size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[15px] font-semibold text-gray-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{region.name}</div>
                                                <div className="text-[13px] text-gray-500 dark:text-slate-500 font-medium flex items-center gap-2">
                                                    <span>{region.type || 'Region'}</span>
                                                    <span className="text-gray-300 dark:text-slate-700">•</span>
                                                    <span>{region.country_code?.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <>
                                            {cities.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="px-4 py-2.5 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cities</div>
                                                    {cities.map(renderRegionRow)}
                                                </div>
                                            )}

                                            {states.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="px-4 py-2.5 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">States / Provinces</div>
                                                    {states.map(renderRegionRow)}
                                                </div>
                                            )}

                                            {otherRegions.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="px-4 py-2.5 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Regions</div>
                                                    {otherRegions.map(renderRegionRow)}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}

                                {suggestions.hotels?.length > 0 && (
                                    <div className="mb-3 mt-4">
                                        <div className="px-4 py-2.5 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hotels</div>
                                        {suggestions.hotels.map(hotel => (
                                            <div
                                                key={hotel.id}
                                                className="search-result-item flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition-all group"
                                                onClick={() => handleLocationSelect(hotel, 'hotel')}
                                            >
                                                <div className="icon-box w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-all shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
                                                    <Bed size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[15px] font-semibold text-gray-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{hotel.name}</div>
                                                    <div className="text-[13px] text-gray-500 font-medium">{hotel.region_name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden md:block w-[1px] bg-gray-200/60 dark:bg-slate-800/60 my-3"></div>

                {/* Dates Section */}
                <div className="flex-1 relative">
                    <div className="h-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-slate-700">
                        <Calendar className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" size={22} />
                        <div className="flex-1 text-left overflow-hidden">
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-1">Check in - Check out</label>
                            <Flatpickr
                                ref={flatpickrRef}
                                className="hidden"
                                options={dateOptions}
                                value={dateRange}
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="hidden md:block w-[1px] bg-gray-200/60 my-3"></div>

                {/* Guests Selection Section */}
                <div className="flex-1 relative" ref={guestsRef}>
                    <div
                        className="h-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                        onClick={() => setShowGuestsPopup(!showGuestsPopup)}
                    >
                        <Users className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" size={22} />
                        <div className="flex-1 text-left">
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-1">Who</label>
                            <div className="text-gray-900 dark:text-slate-100 font-semibold text-base truncate">
                                {adults + children.length} {adults + children.length === 1 ? 'Guest' : 'Guests'}
                            </div>
                        </div>
                        <ChevronDown className={`text-gray-400 dark:text-slate-500 transition-transform ${showGuestsPopup ? 'rotate-180' : ''}`} size={18} />
                    </div>

                    {/* Guest Popup */}
                    {showGuestsPopup && (
                        <div className="absolute top-[calc(100%+8px)] right-0 w-full md:w-[360px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-slate-800 p-7 z-[100] animate-slide-down text-left transition-colors duration-300" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-7">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-[15px] font-semibold text-gray-800 dark:text-slate-100">Adults</div>
                                        <div className="text-[13px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">Age 18+</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="w-9 h-9 rounded-full border-2 border-gray-300 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-400 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600"
                                            onClick={() => handleGuestChange('adults', 'decrement')}
                                            disabled={adults <= 1}
                                        >
                                            <Minus size={16} strokeWidth={2.5} />
                                        </button>
                                        <span className="w-8 text-center text-base font-semibold text-gray-800 dark:text-slate-100">{adults}</span>
                                        <button
                                            className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all disabled:opacity-30"
                                            onClick={() => handleGuestChange('adults', 'increment')}
                                            disabled={adults >= 6}
                                        >
                                            <Plus size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-gray-100 dark:bg-slate-800"></div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-[15px] font-semibold text-gray-800 dark:text-slate-100">Children</div>
                                        <div className="text-[13px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">Age 0-17</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600"
                                            onClick={() => handleGuestChange('children', 'decrement')}
                                            disabled={children.length === 0}
                                        >
                                            <Minus size={16} strokeWidth={2.5} />
                                        </button>
                                        <span className="w-8 text-center text-base font-semibold text-gray-800 dark:text-slate-100">{children.length}</span>
                                        <button
                                            className="w-9 h-9 rounded-full border-2 border-gray-300 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-400 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-30"
                                            onClick={() => handleGuestChange('children', 'increment')}
                                            disabled={children.length >= 4}
                                        >
                                            <Plus size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>

                                {children.length > 0 && (
                                    <>
                                        <div className="h-[1px] bg-gray-100 dark:bg-slate-800"></div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                                                <Info size={14} className="text-blue-600" />
                                                Children's Ages
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {children.map((age, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <select
                                                            className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer appearance-none hover:border-gray-300 dark:hover:border-slate-600"
                                                            value={age}
                                                            onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                                                        >
                                                            {[...Array(18).keys()].map(a => (
                                                                <option key={a} value={a}>Age {a}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Button */}
                <div className="flex items-center justify-center shrink-0">
                    <button
                        className="w-full md:w-14 lg:w-32 h-14 md:h-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-[15px] transition-all active:scale-95 shadow-lg shadow-blue-600/25 group disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSearch}
                        disabled={isSearchingLocation}
                    >
                        <Search size={20} className="group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="md:hidden lg:inline">Search</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SearchWidget;
