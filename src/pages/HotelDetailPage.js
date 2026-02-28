import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Flatpickr from 'react-flatpickr';
import { Calendar, Users, Minus, Plus, ChevronDown, ChevronLeft, ChevronRight, Info, Check, X, Utensils, Bed, Search, MapPin, Lock, Wifi, Tv, Wind, Coffee, ShieldCheck } from 'lucide-react';
import "flatpickr/dist/themes/light.css";
import './HotelDetailPage.css';

/* --- helpers --- */
const imgUrl = (tpl, size) => {
    if (!tpl) return '';
    if (tpl.includes('{size}')) return tpl.replace('{size}', size);
    return tpl; // already a direct URL
};

const formatTime12 = (t) => {
    if (!t) return '-';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatDateDisplay = (d) => {
    if (!d) return '-';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* --- helpers --- */
const sortObject = o =>
    Array.isArray(o) ? o.map(sortObject)
    : (o && typeof o === 'object') ? Object.keys(o).sort().reduce((acc, k) => { acc[k] = sortObject(o[k]); return acc; }, {})
    : o;

const safeKey = v =>
    typeof v === 'string' ? v.trim().toLowerCase()
    : (v && typeof v === 'object') ? JSON.stringify(sortObject(v))
    : '';

const getRoomRgExt = room =>
    room?.rg_ext_code ?? room?.rg_ext_id ?? room?.rg_ext?.code ?? room?.rg_ext?.rg_ext ?? room?.rg_ext ?? null;

const getRateRgExt = rate =>
    rate?.room_data?.rg_ext_code ?? rate?.room_data?.rg_ext ?? rate?.rg_ext ?? null;

const getDisplayPriceObj = (rate) => {
    const net = rate?.commission_info?.charge?.amount_net;
    const currFromCharge = rate?.commission_info?.charge?.currency;
    if (net != null) return { amount: Number(net), currency: currFromCharge || rate?.currency || 'USD' };
    const dep = rate?.payment_options?.payment_types?.find(pt => pt.type === 'deposit');
    if (dep?.show_amount != null) return { amount: Number(dep.show_amount), currency: dep.show_currency_code || 'USD' };
    const dp = parseFloat(rate?.daily_prices || rate?.payment_options?.payment_types?.[0]?.show_amount || 0);
    const curr = rate?.payment_options?.payment_types?.[0]?.show_currency_code || rate?.currency || 'USD';
    return { amount: dp, currency: curr };
};

const extractPolicy = (rate) => {
    const pts = rate?.payment_options?.payment_types || [];
    const policy = { freeBefore: null, policies: [], nonRefundable: false, unknown: pts.length === 0 };
    for (const pt of pts) {
        const cp = pt?.cancellation_penalties;
        if (!cp) continue;
        if (cp.free_cancellation_before) {
            const d = new Date(cp.free_cancellation_before);
            if (!policy.freeBefore || d < new Date(policy.freeBefore)) policy.freeBefore = cp.free_cancellation_before;
        }
        for (const p of (cp.policies || [])) {
            policy.policies.push({ start_at: p.start_at || null, end_at: p.end_at || null, amount_charge: Number(p.amount_charge) });
        }
    }
    const hasImmediatePenalty = policy.policies.some(r => r.start_at == null && r.end_at == null && r.amount_charge > 0);
    policy.nonRefundable = !policy.freeBefore && hasImmediatePenalty;
    return policy;
};

const extractTaxes = (rate) => {
    const pts = rate?.payment_options?.payment_types || [];
    const out = { included: [], excluded: [], totalIncluded: 0, totalExcluded: 0 };
    for (const pt of pts) {
        const taxes = pt?.tax_data?.taxes || [];
        const fb = pt?.show_currency_code || 'USD';
        for (const t of taxes) {
            const row = { name: (t?.name || 'Tax').replace(/_/g, ' '), amount: Number(t?.amount ?? 0), currency: t?.currency_code || fb };
            if (!(row.amount > 0)) continue;
            if (t?.included_by_supplier) out.included.push(row);
            else out.excluded.push(row);
        }
    }
    out.totalIncluded = out.included.reduce((s, r) => s + r.amount, 0);
    out.totalExcluded = out.excluded.reduce((s, r) => s + r.amount, 0);
    return out;
};

const formatUtc0 = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' (UTC+0)';
};

/* A-"----A-"----A-"---- room amenity icon helper A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
/* --- room amenity icon helper --- */
const amenityIconMap = {
    'wi-fi': '📶', 'wifi': '📶', 'internet': '📶',
    'bathroom': '🛁', 'bathtub': '🛁', 'private bathroom': '🛁',
    'tv': '📺', 'television': '📺',
    'air-conditioning': '❄️', 'air conditioning': '❄️',
    'heating': '🔥',
    'safe': '🔒', 'safety deposit box': '🔒',
    'minibar': '🍺',
    'balcony': '🌿',
    'parking': '🚗',
    'hairdryer': '💇', 'hair dryer': '💇',
    'desk': '💻',
    'blackout blinds': '🌙',
    'kitchen': '🍳', 'kitchenette': '🍳',
    'washing machine': '🧺', 'laundry': '🧺',
    'sea view': '🌊', 'ocean view': '🌊',
    'city view': '🏙️',
    'terrace': '⛲',
    'garden view': '🌳',
    'pool view': '🏊',
};
const getRoomAmenityIcon = (a) => amenityIconMap[(a || '').toLowerCase()] || '🏨';

const formatAmenityName = (a) =>
    (a || '').split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const getLucideAmenityIcon = (a) => {
    const k = (a || '').toLowerCase();
    if (k.includes('wifi') || k.includes('wi-fi') || k.includes('internet')) return <Wifi size={17} />;
    if (k.includes('tv') || k.includes('television')) return <Tv size={17} />;
    if (k.includes('air') || k.includes('conditioning')) return <Wind size={17} />;
    if (k.includes('breakfast') || k.includes('meal') || k.includes('utensil') || k.includes('dining')) return <Utensils size={17} />;
    if (k.includes('coffee') || k.includes('minibar') || k.includes('mini bar') || k.includes('bar')) return <Coffee size={17} />;
    if (k.includes('safe') || k.includes('security') || k.includes('deposit')) return <Lock size={17} />;
    if (k.includes('bathroom') || k.includes('bath') || k.includes('shower') || k.includes('private')) return <ShieldCheck size={17} />;
    if (k.includes('calendar') || k.includes('check')) return <Check size={17} />;
    return <Bed size={17} />;
};

const AMENITY_MAP = {
    wifi: 'WiFi',
    pool: 'Swimming Pool',
    parking: 'Parking',
    restaurant: 'Restaurant',
    bar: 'Bar',
    breakfast: 'Breakfast Included',
    spa: 'Spa & Wellness',
    fitness: 'Fitness Center',
    airport: 'Airport Shuttle',
    room_service: 'Room Service',
    laundry: 'Laundry Service',
    business: 'Business Center',
    air_conditioning: 'Air Conditioning',
    accessibility: 'Wheelchair Access',
    elevator: 'Elevator',
    concierge: 'Concierge',
    luggage: 'Luggage Storage',
};

const CATEGORY_LABELS = {
    exterior:       'Exterior',
    lobby:          'Lobby',
    guest_rooms:    'Guest Rooms',
    bathroom:       'Bathroom',
    meal:           'Dining',
    pool:           'Pool',
    spa:            'Spa & Wellness',
    fitness:        'Fitness Center',
    hotel_services: 'Hotel Services',
    common_areas:   'Common Areas',
    meeting:        'Meeting Rooms',
    kitchen:        'Kitchen',
    bedroom:        'Bedroom',
    living_room:    'Living Room',
    view:           'View',
    parking:        'Parking',
    unspecified:    'Other',
};

/* A-"----A-"----A-"---- amenity icon svgs A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
const AmenityIcon = ({ type }) => {
    const icons = {
        wifi: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
            </svg>
        ),
        pool: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M2 12s3-4 6-4 6 4 6 4 3-4 6-4" /><path d="M2 18s3-4 6-4 6 4 6 4 3-4 6-4" />
                <circle cx="12" cy="5" r="2" /><path d="M12 7v3" />
            </svg>
        ),
        parking: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
            </svg>
        ),
        restaurant: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M3 11l19-9-9 19-2-8-8-2z" />
            </svg>
        ),
        bar: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M8 22V12L3 3h18l-5 9v10" /><path d="M8 22h8" />
            </svg>
        ),
        breakfast: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
            </svg>
        ),
        spa: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M12 22c-4.97 0-9-3.58-9-8 0-2.43 1.08-4.6 2.8-6.1" />
                <path d="M12 22c4.97 0 9-3.58 9-8 0-2.43-1.08-4.6-2.8-6.1" />
                <path d="M12 2C8 6 6 9.5 6 12c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.5-2-6-6-10z" />
            </svg>
        ),
        fitness: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
            </svg>
        ),
        airport: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2l4.4 4.4-2.4 1.4 3.2 3.2 1.4-2.4z" />
            </svg>
        ),
        room_service: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M3 17h18" /><path d="M12 3C7.03 3 3 7.03 3 12" /><path d="M21 12c0-4.97-4.03-9-9-9" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
        ),
        laundry: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="2" y="3" width="20" height="19" rx="2" />
                <circle cx="12" cy="13" r="4" /><circle cx="12" cy="13" r="2" />
                <path d="M5 6h.01M8 6h.01" />
            </svg>
        ),
        business: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
            </svg>
        ),
        air_conditioning: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M8 6L20 6" /><path d="M4 10l16 0" /><path d="M4 14l16 0" /><path d="M8 18l12 0" />
            </svg>
        ),
        accessibility: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <circle cx="16" cy="4" r="1" fill="currentColor" /><path d="M6 11l4-3 3 3.5" />
                <path d="M10.5 14.5L9 19l5-1 3 3" /><path d="M14 8h5" />
            </svg>
        ),
        elevator: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="3" y="2" width="18" height="20" rx="2"/>
                <path d="M9 10l3-3 3 3"/><path d="M9 14l3 3 3-3"/>
            </svg>
        ),
        concierge: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M22 17H2a5 5 0 0 1 10 0"/><circle cx="12" cy="7" r="4"/>
            </svg>
        ),
        luggage: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="6" y="7" width="12" height="14" rx="2"/>
                <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                <line x1="12" y1="11" x2="12" y2="17"/>
                <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
        ),
    };
    const iconKey = Object.keys(icons).find(k => type && type.toLowerCase().includes(k));
    return icons[iconKey] || (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
        </svg>
    );
};

const NearbyPlaceIcon = ({ type }) => {
    const t = (type || '').toLowerCase();
    if (/restaurant|cafe|fast_food|food/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M3 11l19-9-9 19-2-8-8-2z"/>
        </svg>
    );
    if (/bar|pub/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M8 22V12L3 3h18l-5 9v10"/><path d="M8 22h8"/>
        </svg>
    );
    if (/hospital|pharmacy|clinic|medical/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M12 8v8"/><path d="M8 12h8"/>
        </svg>
    );
    if (/mosque|church|temple|worship|religious/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M12 2L2 10h3v10h14V10h3L12 2z"/>
            <rect x="9" y="14" width="6" height="6"/>
        </svg>
    );
    if (/bank|atm/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <rect x="3" y="10" width="18" height="11" rx="1"/>
            <path d="M3 10l9-7 9 7"/>
            <line x1="9" y1="10" x2="9" y2="21"/><line x1="15" y1="10" x2="15" y2="21"/>
        </svg>
    );
    if (/museum|attraction|artwork|gallery/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M3 10l9-7 9 7v2H3v-2z"/>
            <rect x="5" y="12" width="4" height="9"/><rect x="10" y="12" width="4" height="9"/><rect x="15" y="12" width="4" height="9"/>
            <line x1="3" y1="21" x2="21" y2="21"/>
        </svg>
    );
    if (/park|garden|nature/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M12 22V11"/>
            <path d="M5 9a7 7 0 0 1 14 0c0 3.87-3.13 7-7 7s-7-3.13-7-7z" fill="none"/>
        </svg>
    );
    if (/school|university|college|education/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M22 10v6m-10 4V10"/><path d="M2 10l10-5 10 5-10 5-10-5z"/>
            <path d="M6 12v5c0 1 2 2 6 2s6-1 6-2v-5"/>
        </svg>
    );
    if (/cinema|theatre|theater/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M16 12l-6 4V8l6 4z" fill="currentColor" stroke="none"/>
        </svg>
    );
    if (/mall|supermarket|convenience|shop|store/.test(t)) return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
    );
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
    );
};

/* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
/*  MAIN COMPONENT                                         */
/* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
export default function HotelDetailPage() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const hotelId = params.get('hotel_id') || '';

    const bookingParams = useRef({
        checkin:   params.get('checkin') || '',
        checkout:  params.get('checkout') || '',
        currency:  params.get('currency') || 'USD',
        residency: params.get('residency') || 'gb',
        guests:    (() => { try { return JSON.parse(params.get('guests') || '[]'); } catch (_) { return [{ adults: 2, children: [] }]; } })()
    });

    /* A-"----A-"---- state A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    const [hotel, setHotel]               = useState(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [rates, setRates]               = useState([]);
    const [ratesLoading, setRatesLoading] = useState(false);
    const [roomGroups, setRoomGroups]     = useState([]);

    /* gallery */
    const [lightboxIdx, setLightboxIdx]     = useState(null);
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [photoCategory, setPhotoCategory] = useState('all');

    /* map */
    const [showMap, setShowMap] = useState(false);
    const mapRef = useRef(null);
    const miniMapRef = useRef(null);
    const leafletRef = useRef(null);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);

    /* accordion */
    const [accordionOpen, setAccordionOpen] = useState(false);
    const [aboutExpanded, setAboutExpanded] = useState(false);
    const [aboutOverflows, setAboutOverflows] = useState(false);
    const aboutInnerRef = useRef(null);
    const [infoExpanded, setInfoExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('sec-overview');
    const clickLockRef = useRef(false);

    /* date filter */
    const [filterCheckin,  setFilterCheckin]  = useState(bookingParams.current.checkin);
    const [filterCheckout, setFilterCheckout] = useState(bookingParams.current.checkout);
    const fpRef = useRef(null);

    /* guest picker */
    const [filterAdults,   setFilterAdults]   = useState(() => bookingParams.current.guests[0]?.adults || 2);
    const [filterChildren, setFilterChildren] = useState(() => bookingParams.current.guests[0]?.children || []);
    const [showGuestPopup, setShowGuestPopup] = useState(false);
    const guestBarRef = useRef(null);

    /* room modal */
    const [modalRoom,     setModalRoom]     = useState(null);
    const [modalRate,     setModalRate]     = useState(null);
    const [modalImgIdx,   setModalImgIdx]   = useState(0);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showAllAmenities, setShowAllAmenities] = useState(false);

    /* room filters */
    const [bedFilter,  setBedFilter]  = useState('all');
    const [roomSort,   setRoomSort]   = useState('price-asc');

    /* prebook */
    const [prebookLoading,  setPrebookLoading]  = useState(false);
    const [prebookError,    setPrebookError]    = useState(null);
    const [priceChangeData, setPriceChangeData] = useState(null);
    const [pendingBookHash, setPendingBookHash] = useState(null);

    /* A-"----A-"---- fetch hotel info (FastAPI + RateHawk enrich) A-"----A-"----A-"---- */
    useEffect(() => {
        if (!hotelId) { setError('No hotel ID provided.'); setLoading(false); return; }
        setLoading(true);

        fetch('https://fastapiratehawk.co.uk/get-hotels-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hotel_ids: [hotelId] })
        })
            .then(r => r.json())
            .then(fastData => {
                const fastHotel = fastData[hotelId] || Object.values(fastData)[0] || null;
                if (!fastHotel) { setError('Hotel not found.'); setLoading(false); return; }

                const hotelObj = {
                    id: fastHotel.id || hotelId,
                    name: fastHotel.name || '',
                    star_rating: parseInt(fastHotel.stars || 0),
                    address: fastHotel.address || '',
                    region: fastHotel.region || null,
                    images_ext: Array.isArray(fastHotel.images)
                        ? fastHotel.images.map(url => ({ url, category_slug: 'unspecified' }))
                        : [],
                    amenities_list: Array.isArray(fastHotel.amenities) ? fastHotel.amenities : [],
                    description_struct: [],
                    latitude: null, longitude: null,
                    check_in_time: null, check_out_time: null,
                    phone: fastHotel.phone || null,
                    email: fastHotel.email || null,
                    payment_methods: [], hotel_chain: null, facts: {}, amenity_groups: [], serp_filters: [],
                };
                setHotel(hotelObj);
                setLoading(false);

                fetch('/api/hotel-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: hotelId, language: 'en' })
                })
                    .then(r => r.json())
                    .then(rhData => {
                        const rh = rhData?.data || null;
                        if (!rh) return;
                        setHotel(prev => ({
                            ...prev,
                            description_struct: rh.description_struct || [],
                            latitude: rh.latitude || null,
                            longitude: rh.longitude || null,
                            check_in_time: rh.check_in_time || null,
                            check_out_time: rh.check_out_time || null,
                            phone: rh.phone || prev.phone,
                            email: rh.email || prev.email,
                            payment_methods: rh.payment_methods || [],
                            hotel_chain: rh.hotel_chain || null,
                            facts: rh.facts || {},
                            amenity_groups: rh.amenity_groups || [],
                            serp_filters: rh.serp_filters || [],
                            images_ext: (rh.images_ext && rh.images_ext.length) ? rh.images_ext : prev.images_ext,
                            metapolicy_extra_info: rh.metapolicy_extra_info || null,
                            metapolicy_struct: rh.metapolicy_struct || null,
                        }));
                    })
                    .catch(() => {});
            })
            .catch(() => { setError('Failed to load hotel information.'); setLoading(false); });
    }, [hotelId]);

    /* A-"----A-"---- fetch room groups (FastAPI) A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    useEffect(() => {
        if (!hotelId) return;
        fetch(`https://fastapiratehawk.co.uk/hotel/${encodeURIComponent(hotelId)}`)
            .then(r => r.json())
            .then(d => {
                const groups = d?.data?.room_groups || [];
                setRoomGroups(groups);
            })
            .catch(() => {});
    }, [hotelId]);

    /* A-"----A-"---- fetch rates A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    useEffect(() => {
        if (!hotelId) return;
        const bp = bookingParams.current;
        if (!bp.checkin || !bp.checkout) return;
        setRatesLoading(true);
        fetch('/api/hotel-hp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: hotelId,
                checkin: bp.checkin,
                checkout: bp.checkout,
                guests: bp.guests.length ? bp.guests : [{ adults: 2, children: [] }],
                residency: bp.residency,
                language: 'en',
                currency: bp.currency
            })
        })
            .then(r => r.json())
            .then(d => {
                if (d?.data?.hotels?.[0]?.rates) setRates(d.data.hotels[0].rates);
                setRatesLoading(false);
            })
            .catch(() => setRatesLoading(false));
    }, [hotelId]);

    /* A-"----A-"---- images A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    const images = hotel
        ? (hotel.images_ext?.length ? hotel.images_ext : (hotel.images || []).map(u => ({ url: u, category_slug: 'unspecified' })))
        : [];

    const categoryGroups = {};
    images.forEach(img => {
        const cat = img.category_slug || 'unspecified';
        if (!categoryGroups[cat]) categoryGroups[cat] = [];
        categoryGroups[cat].push(img);
    });
    const orderedCats = [
        ...Object.keys(categoryGroups).filter(c => c !== 'unspecified'),
        ...(categoryGroups['unspecified'] ? ['unspecified'] : [])
    ];

    /* A-"----A-"---- keyboard handlers A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    useEffect(() => {
        if (lightboxIdx === null) return;
        const h = (e) => {
            if (e.key === 'ArrowRight') setLightboxIdx(i => (i + 1) % images.length);
            else if (e.key === 'ArrowLeft') setLightboxIdx(i => (i - 1 + images.length) % images.length);
            else if (e.key === 'Escape') setLightboxIdx(null);
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [lightboxIdx, images.length]);

    useEffect(() => {
        if (!showRoomModal) return;
        const h = (e) => { if (e.key === 'Escape') { setShowRoomModal(false); setPrebookError(null); } };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [showRoomModal]);

    /* close guest popup on outside click */
    useEffect(() => {
        const h = (e) => {
            if (guestBarRef.current && !guestBarRef.current.contains(e.target)) {
                setShowGuestPopup(false);
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    /* A-"----A-"---- match room groups to rates A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    const bp = bookingParams.current;
    const nights = (() => {
        if (!bp.checkin || !bp.checkout) return 1;
        const diff = new Date(bp.checkout) - new Date(bp.checkin);
        return Math.max(1, Math.round(diff / 86400000));
    })();

    const matchedRooms = (() => {
        if (!roomGroups.length || !rates.length) return [];
        const bestRateByRg = new Map();
        rates.forEach(rate => {
            const rg = getRateRgExt(rate);
            if (!rg) return;
            const key = safeKey(rg);
            const existing = bestRateByRg.get(key);
            if (!existing) { bestRateByRg.set(key, rate); return; }
            if (getDisplayPriceObj(rate).amount < getDisplayPriceObj(existing).amount) bestRateByRg.set(key, rate);
        });
        const result = [];
        roomGroups.forEach((room, idx) => {
            const rg = getRoomRgExt(room);
            if (!rg) return;
            const rate = bestRateByRg.get(safeKey(rg));
            if (!rate) return;
            result.push({ room: { ...room, __index: idx }, rate });
        });
        return result;
    })();

    /* A-"----A-"---- hotel amenities A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    const EXTRA_MAP = { internet: 'wifi', 'free internet': 'wifi', gym: 'fitness', conference: 'business', swimming: 'pool', shuttle: 'airport', elevator: 'elevator', lift: 'elevator', 'front desk': 'concierge', '24-hour': 'concierge', concierge: 'concierge', luggage: 'luggage', 'luggage storage': 'luggage', 'baggage storage': 'luggage' };
    const amenitySearchStr = [
        ...(hotel?.amenities_list || []),
        ...(hotel?.amenity_groups || []).flatMap(g => {
            const raw = g.amenities || g.group_name || '';
            return Array.isArray(raw) ? raw : [raw, g.group_name || ''];
        })
    ].join(' ').toLowerCase();

    const namedAmenities = Object.keys(AMENITY_MAP).filter(k => {
        const aliases = Object.entries(EXTRA_MAP).filter(([, v]) => v === k).map(([ak]) => ak);
        return [k, ...aliases].some(term => amenitySearchStr.includes(term));
    }).map(k => ({ key: k, label: AMENITY_MAP[k] })).slice(0, 12);

    /* A-"----A-"---- hotel facts A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    const facts = hotel ? (hotel.facts || {}) : {};
    const detailRows = hotel ? [
        { label: 'Check-in',  value: formatTime12(hotel.check_in_time) },
        { label: 'Check-out', value: formatTime12(hotel.check_out_time) },
        hotel.phone ? { label: 'Phone', value: hotel.phone } : null,
        hotel.email ? { label: 'Email', value: hotel.email } : null,
        facts.rooms_number ? { label: 'Total Rooms', value: facts.rooms_number } : null,
        hotel.payment_methods?.length ? { label: 'Payment Methods', value: hotel.payment_methods.join(', ') } : null,
        hotel.hotel_chain ? { label: 'Hotel Chain', value: hotel.hotel_chain } : null,
    ].filter(Boolean) : [];

    /* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â
       PREBOOK FLOW
    A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
    const proceedToBooking = useCallback((bookHash, selectedRate) => {
        const hotelName = hotel?.name || 'Hotel Booking';
        const roomName  = selectedRate?.room_name || 'Room';
        const priceInfo = getDisplayPriceObj(selectedRate);
        const payload = {
            book_hash:    bookHash,
            checkin:      bp.checkin,
            checkout:     bp.checkout,
            guests:       encodeURIComponent(JSON.stringify(bp.guests)),
            hotel_id:     hotelId,
            hotel_name:   encodeURIComponent(hotelName),
            room_name:    encodeURIComponent(roomName),
            total_amount: (priceInfo.amount * nights).toFixed(2),
            currency:     priceInfo.currency,
        };
        try {
            localStorage.setItem('hm_booking_data', JSON.stringify({ ...payload, hotel_name: hotelName, room_name: roomName, guests: JSON.stringify(bp.guests) }));
        } catch (_) {}
        window.location.href = `https://holidaysmaster.com/conform-booking/?${new URLSearchParams(payload).toString()}`;
    }, [hotel, hotelId, bp, nights]);

    const handleBookRoom = useCallback((bookHash, originalRate) => {
        setPrebookLoading(true);
        setPrebookError(null);
        fetch('/api/hotel-prebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash: bookHash, price_increase_percent: 20 })
        })
            .then(r => r.json())
            .then(data => {
                setPrebookLoading(false);
                if (data.status === 'ok' && data.data?.hotels?.length > 0) {
                    const updated = data.data.hotels[0].rates?.[0];
                    if (!updated?.book_hash) throw new Error('No valid rate');
                    if (data.data?.changes?.price_changed) {
                        setPriceChangeData({ original: originalRate, updated });
                        setPendingBookHash(updated.book_hash);
                    } else {
                        proceedToBooking(updated.book_hash, updated);
                    }
                } else if (data.error === 'prebook_disabled') {
                    proceedToBooking(bookHash, originalRate);
                } else {
                    setPrebookError(data.error || 'Availability check failed. Please try again.');
                }
            })
            .catch(() => { setPrebookLoading(false); setPrebookError('Unable to check availability. Please try again.'); });
    }, [proceedToBooking]);

    const openRoomModal = (room, rate) => {
        setModalRoom(room);
        setModalRate(rate);
        setModalImgIdx(0);
        setShowRoomModal(true);
        setPrebookError(null);
        setShowAllAmenities(false);
    };

    /* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â
       DATE FILTER BAR
    A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
    const handleDateUpdate = (e) => {
        e.preventDefault();
        if (!filterCheckin || !filterCheckout) return;
        if (new Date(filterCheckout) <= new Date(filterCheckin)) { alert('Check-out must be after check-in'); return; }
        const url = new URL(window.location.href);
        url.searchParams.set('checkin', filterCheckin);
        url.searchParams.set('checkout', filterCheckout);
        const newGuests = [{ adults: filterAdults, children: filterChildren }];
        url.searchParams.set('guests', JSON.stringify(newGuests));
        window.location.href = url.toString();
    };

    const fpOptions = useMemo(() => ({
        mode: 'range',
        minDate: 'today',
        dateFormat: 'Y-m-d',
        enableTime: false,
        showMonths: typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1,
        closeOnSelect: false,
        onClose: (selectedDates, _dateStr, instance) => {
            if (selectedDates.length === 1) setTimeout(() => instance.open(), 0);
        },
    }), []);

    const renderDateFilter = () => {
        const nightsCount = filterCheckin && filterCheckout
            ? Math.max(1, Math.round((new Date(filterCheckout) - new Date(filterCheckin)) / 86400000))
            : null;
        const totalGuests = filterAdults + filterChildren.length;
        const displayDate = filterCheckin && filterCheckout
            ? `${formatDateDisplay(filterCheckin)} \u2014 ${formatDateDisplay(filterCheckout)}`
            : 'Select your dates';

        return (
            <div className="hdp-search-bar">
                <form onSubmit={handleDateUpdate} className="hdp-search-bar-inner">

                    {/* ── Dates ── */}
                    <div className="hdp-sb-section hdp-sb-date-section" onClick={() => fpRef.current?.flatpickr?.open()}>
                        <div className="hdp-sb-icon-circle">
                            <Calendar size={16} />
                        </div>
                        <div className="hdp-sb-text">
                            <span className="hdp-sb-label">Check in &ndash; Check out</span>
                            <div className="hdp-sb-value-row">
                                <span className="hdp-sb-value">{displayDate}</span>
                                {nightsCount && (
                                    <span className="hdp-sb-night-badge">
                                        {nightsCount} night{nightsCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* zero-size hidden input — no overlap with calendar clicks */}
                        <Flatpickr
                            ref={fpRef}
                            options={fpOptions}
                            value={[
                                filterCheckin  ? new Date(filterCheckin  + 'T12:00:00') : null,
                                filterCheckout ? new Date(filterCheckout + 'T12:00:00') : null,
                            ].filter(Boolean)}
                            onChange={(selectedDates) => {
                                // Use local date parts — toISOString() converts to UTC and causes
                                // off-by-one errors in timezones ahead of UTC (e.g. UTC+5)
                                const toStr = (d) =>
                                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                if (selectedDates.length === 2) {
                                    setFilterCheckin(toStr(selectedDates[0]));
                                    setFilterCheckout(toStr(selectedDates[1]));
                                } else if (selectedDates.length === 1) {
                                    setFilterCheckin(toStr(selectedDates[0]));
                                    setFilterCheckout('');
                                } else {
                                    setFilterCheckin('');
                                    setFilterCheckout('');
                                }
                            }}
                            className="hdp-fp-hidden"
                        />
                    </div>

                    <div className="hdp-sb-divider" />

                    {/* ── Guests ── */}
                    <div className="hdp-sb-section" ref={guestBarRef}>
                        <div className="hdp-sb-section-inner" onClick={() => setShowGuestPopup(p => !p)}>
                            <div className="hdp-sb-icon-circle">
                                <Users size={16} />
                            </div>
                            <div className="hdp-sb-text">
                                <span className="hdp-sb-label">Guests &amp; Rooms</span>
                                <span className="hdp-sb-value">
                                    {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}, 1 Room
                                </span>
                            </div>
                            <ChevronDown
                                size={16}
                                className="hdp-sb-chevron"
                                style={{ transform: showGuestPopup ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                        </div>

                        {showGuestPopup && (
                            <div className="hdp-guest-popup" onClick={e => e.stopPropagation()}>
                                {/* Adults */}
                                <div className="hdp-guest-row">
                                    <div className="hdp-guest-info">
                                        <div className="hdp-guest-label">Adults</div>
                                        <div className="hdp-guest-sub">Age 18+</div>
                                    </div>
                                    <div className="hdp-guest-controls">
                                        <button type="button" className="hdp-guest-btn" onClick={() => setFilterAdults(a => Math.max(1, a - 1))} disabled={filterAdults <= 1}><Minus size={15} strokeWidth={2.5}/></button>
                                        <span className="hdp-guest-count">{filterAdults}</span>
                                        <button type="button" className="hdp-guest-btn" onClick={() => setFilterAdults(a => Math.min(6, a + 1))} disabled={filterAdults >= 6}><Plus size={15} strokeWidth={2.5}/></button>
                                    </div>
                                </div>
                                <div className="hdp-guest-divider"/>
                                {/* Children */}
                                <div className="hdp-guest-row">
                                    <div className="hdp-guest-info">
                                        <div className="hdp-guest-label">Children</div>
                                        <div className="hdp-guest-sub">Age 0&ndash;17</div>
                                    </div>
                                    <div className="hdp-guest-controls">
                                        <button type="button" className="hdp-guest-btn" onClick={() => setFilterChildren(c => c.slice(0, -1))} disabled={filterChildren.length === 0}><Minus size={15} strokeWidth={2.5}/></button>
                                        <span className="hdp-guest-count">{filterChildren.length}</span>
                                        <button type="button" className="hdp-guest-btn" onClick={() => setFilterChildren(c => [...c, 5])} disabled={filterChildren.length >= 4}><Plus size={15} strokeWidth={2.5}/></button>
                                    </div>
                                </div>
                                {filterChildren.length > 0 && (
                                    <>
                                        <div className="hdp-guest-divider"/>
                                        <div className="hdp-child-ages">
                                            <div className="hdp-child-ages-label">
                                                <Info size={13} style={{ color: '#1a6ef5' }}/>
                                                Children&apos;s Ages
                                            </div>
                                            <div className="hdp-child-ages-grid">
                                                {filterChildren.map((age, idx) => (
                                                    <div key={idx} className="hdp-child-age-wrap">
                                                        <select
                                                            className="hdp-child-age-select"
                                                            value={age}
                                                            onChange={e => setFilterChildren(c => c.map((a, i) => i === idx ? Number(e.target.value) : a))}
                                                        >
                                                            {[...Array(18).keys()].map(a => (
                                                                <option key={a} value={a}>Age {a}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={12} className="hdp-child-age-chevron"/>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Action ── */}
                    <div className="hdp-sb-action">
                        <button type="submit" className="hdp-sb-btn">
                            <Search size={16} />
                            Update Search
                        </button>
                    </div>

                </form>
            </div>
        );
    };

    /* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â
       ROOM CARDS
    A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
    const renderMealLabel = (rate) => {
        const m = rate?.meal_data?.value || '';
        if (!m || m === 'nomeal') return null;
        if (m === 'breakfast') return 'Breakfast included';
        if (m === 'half-board') return 'Half board';
        if (m === 'full-board') return 'Full board';
        if (m === 'all-inclusive') return 'All inclusive';
        return m.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const renderRoomCards = () => {
        const hasRates = rates.length > 0;
        const hasMatch = matchedRooms.length > 0;

        /* bed-type chips */
        const bedTypes = ['all', ...Array.from(
            new Set(matchedRooms.map(({ room }) => room?.name_struct?.bedding_type).filter(Boolean))
        )];

        /* filter + sort */
        const displayRooms = matchedRooms
            .filter(({ room }) => bedFilter === 'all' || room?.name_struct?.bedding_type === bedFilter)
            .slice()
            .sort((a, b) => {
                const pa = getDisplayPriceObj(a.rate).amount;
                const pb = getDisplayPriceObj(b.rate).amount;
                return roomSort === 'price-asc' ? pa - pb : pb - pa;
            });

        return (
            <div className="hdp-rooms-section" id="sec-rooms">
                <div className="hdp-rooms-header">
                    <h2 className="hdp-section-title" style={{ margin: 0 }}>Available Rooms</h2>
                    {bp.checkin && bp.checkout && (
                        <span className="hdp-rooms-meta">
                            {formatDateDisplay(bp.checkin)} → {formatDateDisplay(bp.checkout)}
                            &nbsp;·&nbsp;{nights} night{nights !== 1 ? 's' : ''}
                            &nbsp;·&nbsp;{bp.currency}
                        </span>
                    )}
                </div>

                {/* Bed filter chips + sort */}
                {hasMatch && (
                    <div className="hdp-room-filters">
                        <div className="hdp-bed-chips">
                            {bedTypes.map(bt => (
                                <button
                                    key={bt}
                                    className={`hdp-bed-chip${bedFilter === bt ? ' active' : ''}`}
                                    onClick={() => setBedFilter(bt)}
                                >
                                    {bt === 'all' ? 'All Beds' : bt}
                                </button>
                            ))}
                        </div>
                        <div className="hdp-room-sort">
                            <select
                                className="hdp-sort-select"
                                value={roomSort}
                                onChange={e => setRoomSort(e.target.value)}
                            >
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                )}

                {ratesLoading && (
                    <div className="hdp-rooms-loading">
                        <div className="hdp-rooms-spinner"/>
                        <p>Finding the best rooms for you…</p>
                    </div>
                )}

                {!ratesLoading && !hasRates && (
                    <div className="hdp-rooms-empty">
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18"/><path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14"/></svg>
                        <h3>No Rooms Available</h3>
                        <p>Try adjusting your dates or number of guests.</p>
                    </div>
                )}

                {!ratesLoading && hasRates && !hasMatch && (
                    /* fallback A----"- no room_groups match, show simple rate cards */
                    <div className="hdp-room-grid">
                        {rates.map((rate, idx) => {
                            const { amount, currency } = getDisplayPriceObj(rate);
                            const policy = extractPolicy(rate);
                            const tx = extractTaxes(rate);
                            const meal = renderMealLabel(rate);
                            return (
                                <div key={rate.book_hash || idx} className="hdp-room-card" onClick={() => openRoomModal(null, rate)}>
                                    <div className="hdp-room-img-wrap">
                                        <div className="hdp-room-img-placeholder">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                        </div>
                                    </div>
                                    <div className="hdp-room-card-body">
                                        <h3 className="hdp-room-name">{rate.room_name || 'Standard Room'}</h3>
                                        <div className="hdp-room-status-tags">
                                            {meal && (
                                                <div className="hdp-status-tag hdp-tag-green"><Utensils size={13}/>{meal}</div>
                                            )}
                                            {policy.freeBefore && !policy.nonRefundable && (
                                                <div className="hdp-status-tag hdp-tag-green"><Check size={13}/>Free cancellation</div>
                                            )}
                                            {policy.nonRefundable && (
                                                <div className="hdp-status-tag hdp-tag-red"><X size={13}/>Non-refundable</div>
                                            )}
                                            {!meal && (
                                                <div className="hdp-status-tag hdp-tag-slate"><Bed size={13}/>Room only</div>
                                            )}
                                        </div>
                                        {tx.totalExcluded > 0 && <div className="hdp-tax-note">+ {currency} {tx.totalExcluded.toFixed(0)} taxes at hotel</div>}
                                        <button className="hdp-view-link" onClick={e => { e.stopPropagation(); openRoomModal(null, rate); }}>
                                            View details <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                        </button>
                                    </div>
                                    <div className="hdp-room-price-section">
                                        <div>
                                            <div className="hdp-room-price">
                                                <span className="hdp-room-price-curr">{currency}</span>
                                                <span className="hdp-room-price-amt">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="hdp-room-price-night">Price for {nights} night{nights !== 1 ? 's' : ''}</div>
                                        </div>
                                        <button className="hdp-book-btn" onClick={e => { e.stopPropagation(); openRoomModal(null, rate); }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!ratesLoading && hasMatch && (
                    <div className="hdp-room-grid">
                        {displayRooms.map(({ room, rate }, idx) => {
                            const { amount, currency } = getDisplayPriceObj(rate);
                            const policy   = extractPolicy(rate);
                            const tx       = extractTaxes(rate);
                            const meal     = renderMealLabel(rate);
                            const roomImgs = (room.images || []).map(u => imgUrl(u, '640x400'));
                            const amenities = (room.room_amenities || []).slice(0, 4);
                            const capacity  = room.rg_ext?.capacity;
                            const bedding   = room.name_struct?.bedding_type;

                            return (
                                <div key={idx} className="hdp-room-card rich" onClick={() => openRoomModal(room, rate)}>

                                    {/* image */}
                                    <div className="hdp-room-img-wrap">
                                        {roomImgs.length > 0
                                            ? <img src={roomImgs[0]} alt={room.name} className="hdp-room-img"/>
                                            : <div className="hdp-room-img-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                                        }
                                        {roomImgs.length > 1 && (
                                            <span className="hdp-img-count">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                {roomImgs.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* body */}
                                    <div className="hdp-room-card-body">
                                        <h3 className="hdp-room-name">{room.name}</h3>

                                        {(capacity || bedding) && (
                                            <div className="hdp-room-meta">
                                                {capacity && <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>{capacity} Guest{capacity > 1 ? 's' : ''}</span>}
                                                {bedding && <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16M22 4v16M2 8h20M2 16h20"/></svg>{bedding}</span>}
                                            </div>
                                        )}

                                        {amenities.length > 0 && (
                                            <div className="hdp-amenity-chips">
                                                {amenities.map((a, i) => (
                                                    <span key={i} className="hdp-amenity-chip">
                                                        {a.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="hdp-room-status-tags">
                                            {meal && (
                                                <div className="hdp-status-tag hdp-tag-green"><Utensils size={13}/>{meal}</div>
                                            )}
                                            {policy.freeBefore && !policy.nonRefundable && (
                                                <div className="hdp-status-tag hdp-tag-green"><Check size={13}/>Free cancellation</div>
                                            )}
                                            {policy.nonRefundable && (
                                                <div className="hdp-status-tag hdp-tag-red"><X size={13}/>Non-refundable</div>
                                            )}
                                            {!meal && (
                                                <div className="hdp-status-tag hdp-tag-slate"><Bed size={13}/>Room only</div>
                                            )}
                                        </div>

                                        {tx.totalExcluded > 0 && <div className="hdp-tax-note">+ {currency} {tx.totalExcluded.toFixed(0)} taxes due at hotel</div>}

                                        <button className="hdp-view-link" onClick={e => { e.stopPropagation(); openRoomModal(room, rate); }}>
                                            View details <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                        </button>
                                    </div>

                                    {/* price */}
                                    <div className="hdp-room-price-section">
                                        <div>
                                            <div className="hdp-room-price">
                                                <span className="hdp-room-price-curr">{currency}</span>
                                                <span className="hdp-room-price-amt">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="hdp-room-price-night">Price for {nights} night{nights !== 1 ? 's' : ''}</div>
                                        </div>
                                        <button className="hdp-book-btn" onClick={e => { e.stopPropagation(); openRoomModal(room, rate); }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    /* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â
       ROOM DETAIL MODAL
    A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
    const renderRoomModal = () => {
        if (!showRoomModal || !modalRate) return null;
        const { amount, currency } = getDisplayPriceObj(modalRate);
        const policy      = extractPolicy(modalRate);
        const tx          = extractTaxes(modalRate);
        const meal        = renderMealLabel(modalRate);
        const roomName    = modalRoom?.name || modalRate.room_name || 'Standard Room';
        const roomImgs    = modalRoom ? (modalRoom.images || []).map(u => imgUrl(u, '1024x768')) : [];
        const amenities   = modalRoom?.room_amenities || [];
        const capacity    = modalRoom?.rg_ext?.capacity;
        const bedding     = modalRoom?.name_struct?.bedding_type;
        const mainName    = modalRoom?.name_struct?.main_name;
        const totalAmt    = (amount * nights).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalAdults = bp.guests.reduce((s, g) => s + (g.adults || 0), 0);
        const totalChildren = bp.guests.reduce((s, g) => s + (g.children?.length || 0), 0);
        const roomSub     = [bedding, mainName].filter(Boolean).join(' \u2022 ');
        const cancelText  = policy.freeBefore
            ? `Free until ${formatUtc0(policy.freeBefore)}`
            : policy.nonRefundable ? 'Non-refundable' : 'Policy applies';
        const cancelColor = policy.freeBefore ? '#16a34a' : policy.nonRefundable ? '#dc2626' : '';

        return (
            <div className="hdp-rm-overlay" onClick={() => { setShowRoomModal(false); setPrebookError(null); }}>
                <div className="hdp-rm-modal" onClick={e => e.stopPropagation()}>

                    {/* Absolute close */}
                    <button className="hdp-rm-close" onClick={() => { setShowRoomModal(false); setPrebookError(null); }}>
                        <X size={20} />
                    </button>

                    {/* ── LEFT: gallery + details ── */}
                    <div className="hdp-rm-left">

                        {/* Gallery slider */}
                        <div className="hdp-rm-gallery">
                            {roomImgs.length > 0 ? (
                                <>
                                    <img src={roomImgs[modalImgIdx]} alt={roomName} className="hdp-rm-gallery-img" />
                                    <div className="hdp-rm-gallery-grad" />
                                    {roomImgs.length > 1 && (
                                        <>
                                            <button className="hdp-rm-gallery-nav hdp-rm-gallery-prev"
                                                onClick={() => setModalImgIdx(i => (i - 1 + roomImgs.length) % roomImgs.length)}>
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button className="hdp-rm-gallery-nav hdp-rm-gallery-next"
                                                onClick={() => setModalImgIdx(i => (i + 1) % roomImgs.length)}>
                                                <ChevronRight size={20} />
                                            </button>
                                        </>
                                    )}
                                    <div className="hdp-rm-gallery-counter">
                                        {modalImgIdx + 1} / {roomImgs.length}
                                    </div>
                                </>
                            ) : (
                                <div className="hdp-rm-gallery-placeholder">
                                    <Bed size={44} strokeWidth={1.2} />
                                    <span>No images available</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {roomImgs.length > 1 && (
                            <div className="hdp-rm-thumbs-row">
                                {roomImgs.slice(0, 6).map((src, i) => (
                                    <button key={i}
                                        className={`hdp-rm-thumb-btn${i === modalImgIdx ? ' active' : ''}`}
                                        onClick={() => setModalImgIdx(i)}>
                                        <img src={imgUrl(src, '240x180')} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* About this room */}
                        <div className="hdp-rm-about">
                            <h3 className="hdp-rm-about-title">
                                <Info size={17} className="hdp-rm-about-icon" />
                                About this room
                            </h3>
                            <div className="hdp-rm-detail-rows">
                                {mainName && (
                                    <div className="hdp-rm-detail-row">
                                        <span className="hdp-rm-detail-label">Room Type</span>
                                        <span className="hdp-rm-detail-value">{mainName}</span>
                                    </div>
                                )}
                                {capacity && (
                                    <div className="hdp-rm-detail-row">
                                        <span className="hdp-rm-detail-label">Max Guests</span>
                                        <span className="hdp-rm-detail-value">{capacity} Person{capacity > 1 ? 's' : ''}</span>
                                    </div>
                                )}
                                {bedding && (
                                    <div className="hdp-rm-detail-row">
                                        <span className="hdp-rm-detail-label">Bed Type</span>
                                        <span className="hdp-rm-detail-value">{bedding}</span>
                                    </div>
                                )}
                                <div className="hdp-rm-detail-row">
                                    <span className="hdp-rm-detail-label">Meal Plan</span>
                                    <span className="hdp-rm-detail-value" style={{ color: meal ? '#16a34a' : '' }}>
                                        {meal || 'Room only'}
                                    </span>
                                </div>
                                <div className="hdp-rm-detail-row">
                                    <span className="hdp-rm-detail-label">Cancellation</span>
                                    <span className="hdp-rm-detail-value" style={{ color: cancelColor || 'inherit' }}>
                                        {cancelText}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: header + scrollable body + pinned bottom ── */}
                    <div className="hdp-rm-right">

                        {/* Header */}
                        <div className="hdp-rm-right-header">
                            {hotel?.name && (
                                <div className="hdp-rm-hotel-pill">
                                    <MapPin size={11} /> {hotel.name}
                                </div>
                            )}
                            <h1 className="hdp-rm-room-name">{roomName}</h1>
                            {roomSub && <p className="hdp-rm-room-sub">{roomSub}</p>}
                        </div>

                        {/* Scrollable body */}
                        <div className="hdp-rm-right-body">

                            {/* Stay summary */}
                            <div className="hdp-rm-stay-card">
                                <div className="hdp-rm-stay-col">
                                    <span className="hdp-rm-stay-label">Stay</span>
                                    <span className="hdp-rm-stay-val">
                                        {formatDateDisplay(bp.checkin)} &ndash; {formatDateDisplay(bp.checkout)}
                                    </span>
                                </div>
                                <div className="hdp-rm-stay-divider" />
                                <div className="hdp-rm-stay-col hdp-rm-stay-col-right">
                                    <span className="hdp-rm-stay-label">Guests</span>
                                    <span className="hdp-rm-stay-val">
                                        {totalAdults} Adult{totalAdults !== 1 ? 's' : ''}
                                        {totalChildren > 0 && `, ${totalChildren} Child${totalChildren !== 1 ? 'ren' : ''}`}
                                    </span>
                                </div>
                            </div>

                            {/* Amenities grid */}
                            {amenities.length > 0 && (() => {
                                const visible = showAllAmenities ? amenities : amenities.slice(0, 6);
                                return (
                                    <div className="hdp-rm-amenities-section">
                                        <h3 className="hdp-rm-section-label">Room Amenities</h3>
                                        <div className="hdp-rm-amenities-grid">
                                            {visible.map((a, i) => (
                                                <div key={i} className="hdp-rm-amenity-item">
                                                    <div className="hdp-rm-amenity-icon-box">
                                                        {getLucideAmenityIcon(a)}
                                                    </div>
                                                    <span className="hdp-rm-amenity-label">{formatAmenityName(a)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {amenities.length > 6 && (
                                            <button
                                                className="hdp-rm-see-more-btn"
                                                onClick={() => setShowAllAmenities(p => !p)}
                                            >
                                                {showAllAmenities
                                                    ? 'See less ∧'
                                                    : `See ${amenities.length - 6} more ∨`}
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Price breakdown */}
                            <div className="hdp-rm-breakdown">
                                <div className="hdp-rm-breakdown-row">
                                    <span>{currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} &times; {nights} night{nights !== 1 ? 's' : ''}</span>
                                    <span>{currency} {totalAmt}</span>
                                </div>
                                {meal && (
                                    <div className="hdp-rm-breakdown-row hdp-rm-bdrow-green">
                                        <span><Utensils size={12} /> {meal}</span><span>Included</span>
                                    </div>
                                )}
                                {tx.totalIncluded > 0 && (
                                    <div className="hdp-rm-breakdown-row">
                                        <span>Taxes &amp; fees (incl.)</span>
                                        <span>{currency} {tx.totalIncluded.toFixed(2)}</span>
                                    </div>
                                )}
                                {tx.totalExcluded > 0 && (
                                    <div className="hdp-rm-breakdown-row hdp-rm-bdrow-warn">
                                        <span>Taxes due at hotel</span>
                                        <span>{currency} {tx.totalExcluded.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="hdp-rm-breakdown-total">
                                    <span>Total</span>
                                    <span>{currency} {totalAmt}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pinned bottom */}
                        <div className="hdp-rm-bottom">
                            <div className="hdp-rm-price-row">
                                <div>
                                    <div className="hdp-rm-price-main">
                                        <span className="hdp-rm-price-curr">{currency}</span>
                                        <span className="hdp-rm-price-val">
                                            {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="hdp-rm-per-night">/ night</span>
                                    </div>
                                    <div className="hdp-rm-best-price">
                                        <span className="hdp-rm-pulse-dot" />
                                        Best Price Guaranteed
                                    </div>
                                </div>
                            </div>

                            {prebookError && (
                                <div className="hdp-rm-error">
                                    <Info size={14} /> {prebookError}
                                </div>
                            )}

                            <button className="hdp-rm-confirm-btn" disabled={prebookLoading}
                                onClick={() => handleBookRoom(modalRate.book_hash, modalRate)}>
                                {prebookLoading
                                    ? <><div className="hdp-rm-btn-spinner" /> Checking availability...</>
                                    : <><Lock size={17} /> Confirm Room <ChevronRight size={17} className="hdp-rm-chevron-slide" /></>
                                }
                            </button>

                            <p className="hdp-rm-disclaimer">
                                <Info size={11} /> Price will be verified before final booking
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â
       PRICE CHANGE MODAL
    A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
    const renderPriceChangeModal = () => {
        if (!priceChangeData) return null;
        const { original, updated } = priceChangeData;
        const origP = getDisplayPriceObj(original);
        const newP  = getDisplayPriceObj(updated);
        const delta = newP.amount - origP.amount;
        const isUp  = delta > 0;
        const pct   = origP.amount > 0 ? Math.abs((delta / origP.amount) * 100).toFixed(1) : '0.0';
        return (
            <div className="hdp-pc-overlay">
                <div className="hdp-pc-modal">
                    <div className="hdp-pc-header">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Price Change Alert
                    </div>
                    <div className="hdp-pc-body">
                        <p className="hdp-pc-desc">The price for this room has changed. Please review before continuing.</p>
                        <div className="hdp-pc-comparison">
                            <div className="hdp-pc-price-box">
                                <div className="hdp-pc-price-label">Original</div>
                                <div className="hdp-pc-price-val muted">{origP.currency} {origP.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                            <div className={`hdp-pc-arrow ${isUp ? 'up' : 'down'}`}>
                                {isUp ? '↑' : '↓'}{' '}<span>{isUp ? '+' : '-'}{pct}%</span>
                            </div>
                            <div className="hdp-pc-price-box">
                                <div className="hdp-pc-price-label">New Price</div>
                                <div className={`hdp-pc-price-val ${isUp ? 'red' : 'green'}`}>{newP.currency} {newP.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    </div>
                    <div className="hdp-pc-footer">
                        <button className="hdp-pc-cancel" onClick={() => { setPriceChangeData(null); setPendingBookHash(null); }}>Cancel</button>
                        <button className="hdp-pc-accept" onClick={() => {
                            const hash = pendingBookHash;
                            const rate = priceChangeData.updated;
                            setPriceChangeData(null);
                            setPendingBookHash(null);
                            proceedToBooking(hash, rate);
                        }}>Accept &amp; Continue</button>
                    </div>
                </div>
            </div>
        );
    };

    /* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â
       GALLERY
    A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
    const renderGallery = () => {
        if (!images.length) return null;
        const visible   = images.slice(0, 7);
        const remaining = images.length - 7;
        return (
            <div className="hdp-gallery-wrap">
                <div className="hdp-gallery" ref={mapRef}>
                    {visible.map((img, idx) => {
                        const url    = imgUrl(img.url, '1024x768');
                        const isLast = idx === 6 && remaining > 0;
                        const isHero = idx === 0;
                        return (
                            <div key={idx} className={isHero ? 'hdp-hero' : isLast ? 'hdp-more-tile' : ''} onClick={() => setLightboxIdx(idx)}>
                                <img src={url} alt=""/>
                                {isLast && images.length > 1 && (
                                    <button className="hdp-show-all-btn" onClick={e => { e.stopPropagation(); setShowAllPhotos(true); }}>
                                        Show all {images.length} photos
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                {images.length > 1 && remaining <= 0 && (
                    <button className="hdp-show-all-btn" onClick={() => setShowAllPhotos(true)}>
                        Show all {images.length} photos
                    </button>
                )}
            </div>
        );
    };

    /* A-"----A-"---- lightbox A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    const renderLightbox = () => {
        if (lightboxIdx === null) return null;
        const img    = images[lightboxIdx];
        const thumbs = images.slice(0, 20);
        return (
            <div className="hdp-lb-overlay" onClick={() => setLightboxIdx(null)}>
                <span className="hdp-lb-counter">{lightboxIdx + 1} / {images.length}</span>
                <button className="hdp-lb-close" onClick={() => setLightboxIdx(null)}>A¢Å“"¢</button>
                <div className="hdp-lb-inner" onClick={e => e.stopPropagation()}>
                    <button className="hdp-lb-prev" onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + images.length) % images.length); }}>&#8249;</button>
                    <img className="hdp-lb-img" src={imgUrl(img.url, '1024x768')} alt=""/>
                    <button className="hdp-lb-next" onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % images.length); }}>&#8250;</button>
                </div>
                <div className="hdp-lb-thumbs">
                    {thumbs.map((t, i) => (
                        <img key={i} className={`hdp-lb-thumb${i === lightboxIdx ? ' active' : ''}`}
                            src={imgUrl(t.url, '240x240')} alt=""
                            onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}/>
                    ))}
                </div>
            </div>
        );
    };

    /* A-"----A-"---- all photos modal A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    const renderAllPhotos = () => {
        if (!showAllPhotos) return null;
        const catMap = {};
        images.forEach(img => {
            const c = img.category_slug || 'unspecified';
            if (!catMap[c]) catMap[c] = [];
            catMap[c].push(img);
        });
        const catKeys = Object.keys(catMap);
        const hasCategories = catKeys.length > 1 || (catKeys.length === 1 && catKeys[0] !== 'unspecified');
        const tabKeys = hasCategories ? ['all', ...catKeys] : [];
        const activeImages = photoCategory === 'all' ? images : (catMap[photoCategory] || images);
        return (
            <div className="hdp-ap-overlay">
                <div className="hdp-ap-header">
                    <span className="hdp-ap-header-title">All Photos <span className="hdp-ap-count">({images.length})</span></span>
                    <button className="hdp-ap-close-btn" onClick={() => { setShowAllPhotos(false); setPhotoCategory('all'); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                {hasCategories && (
                    <div className="hdp-ap-tabs">
                        {tabKeys.map(cat => (
                            <button key={cat} className={`hdp-ap-tab${photoCategory === cat ? ' active' : ''}`} onClick={() => setPhotoCategory(cat)}>
                                {cat === 'all' ? <>All <span className="hdp-ap-tab-count">({images.length})</span></> : <>{CATEGORY_LABELS[cat] || cat} <span className="hdp-ap-tab-count">({catMap[cat].length})</span></>}
                            </button>
                        ))}
                    </div>
                )}
                <div className="hdp-ap-grid">
                    {activeImages.map((img, idx) => (
                        <div key={idx} className="hdp-ap-photo" onClick={() => { setShowAllPhotos(false); setLightboxIdx(images.indexOf(img)); }}>
                            <img src={imgUrl(img.url, '640x400')} alt=""/>
                            {hasCategories && img.category_slug && img.category_slug !== 'unspecified' && (
                                <span className="hdp-ap-photo-label">{CATEGORY_LABELS[img.category_slug] || img.category_slug}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    /* A-"----A-"---- map modal A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"----A-"---- */
    /* fetch real nearby POIs from Overpass */
    useEffect(() => {
        if (!hotel?.latitude || !hotel?.longitude) return;
        const lat = parseFloat(hotel.latitude);
        const lng = parseFloat(hotel.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        const query = `[out:json][timeout:15];(node(around:1000,${lat},${lng})[amenity~"restaurant|cafe|hospital|bank|pharmacy|mosque|church|school|museum|park|cinema|library|fast_food|bar|supermarket"];node(around:1000,${lat},${lng})[tourism~"attraction|museum|artwork"];node(around:1000,${lat},${lng})[shop~"mall|supermarket|convenience"];);out 12;`;
        fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
            .then(r => r.json())
            .then(data => {
                const haversine = (lat1, lon1, lat2, lon2) => {
                    const R = 6371000;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
                    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
                };
                const seen = new Set();
                const places = (data.elements || [])
                    .filter(e => e.tags?.name)
                    .map(e => ({
                        name: e.tags.name,
                        dist: haversine(lat, lng, e.lat, e.lon),
                        type: e.tags.amenity || e.tags.tourism || e.tags.shop || '',
                    }))
                    .filter(p => { if (seen.has(p.name)) return false; seen.add(p.name); return true; })
                    .sort((a, b) => a.dist - b.dist)
                    .slice(0, 4)
                    .map(p => ({
                        ...p,
                        distLabel: p.dist < 1000 ? `${p.dist} m` : `${(p.dist/1000).toFixed(1)} km`,
                    }));
                setNearbyPlaces(places);
            })
            .catch(() => {});
    }, [hotel?.latitude, hotel?.longitude]);

    useEffect(() => {
        if (aboutInnerRef.current) {
            // 340px is the CSS max-height for .hdp-about
            setAboutOverflows(aboutInnerRef.current.scrollHeight > 340);
        }
    }, [hotel?.description_struct]);

    useEffect(() => {
        const sectionIds = ['sec-overview','sec-about','sec-rooms','sec-policies','sec-amenities'];
        const onScroll = () => {
            if (clickLockRef.current) return;
            let active = 'sec-overview';
            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= 100) active = id;
            }
            setActiveTab(active);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const loadLeaflet = useCallback(() => {
        return new Promise((resolve) => {
            if (window.L) { resolve(window.L); return; }
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve(window.L);
            document.head.appendChild(script);
        });
    }, []);

    const renderAllAmenities = () => {
        if (!hotel) return null;

        // Popular chips – all AMENITY_MAP matches (no 12-cap)
        const popularChips = Object.keys(AMENITY_MAP).filter(k => {
            const aliases = Object.entries(EXTRA_MAP).filter(([, v]) => v === k).map(([ak]) => ak);
            return [k, ...aliases].some(term => amenitySearchStr.includes(term));
        }).map(k => ({ key: k, label: AMENITY_MAP[k] }));

        // Raw amenity groups
        const rawGroups = (hotel.amenity_groups || []).filter(
            g => Array.isArray(g.amenities) && g.amenities.length > 0
        );

        if (popularChips.length === 0 && rawGroups.length === 0) return null;

        // Map group_name → SVG icon
        const groupIconMap = (name) => {
            const n = (name || '').toLowerCase();
            if (n.includes('bathroom') || n.includes('bath'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6 6 3 3 6"/><path d="M3 6v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6"/><path d="M3 10h18"/></svg>;
            if (n.includes('kitchen') || n.includes('cooking') || n.includes('kitchenette'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>;
            if (n.includes('outdoor') || n.includes('garden') || n.includes('terrace') || n.includes('pool'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20A14.5 14.5 0 0 0 12 2"/><path d="M2 12h20"/></svg>;
            if (n.includes('media') || n.includes('technology') || n.includes('entertainment') || n.includes('tv'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>;
            if (n.includes('food') || n.includes('drink') || n.includes('dining') || n.includes('meal') || n.includes('restaurant'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>;
            if (n.includes('internet') || n.includes('wifi') || n.includes('wi-fi'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>;
            if (n.includes('parking'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>;
            if (n.includes('front desk') || n.includes('reception') || n.includes('concierge') || n.includes('service'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>;
            if (n.includes('family') || n.includes('child') || n.includes('kid'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
            if (n.includes('cleaning') || n.includes('housekeep') || n.includes('laundry'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
            if (n.includes('safety') || n.includes('security'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
            if (n.includes('accessibility') || n.includes('wheelchair') || n.includes('disabled'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="4" r="2"/><path d="M9 9h6l-1 7-2 4-2-4"/><path d="M7 21a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4"/></svg>;
            if (n.includes('language') || n.includes('spoken'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>;
            if (n.includes('room') || n.includes('general') || n.includes('ameniti'))
                return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
            // default
            return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
        };

        // Detect surcharge/additional-charge in item string
        const parseAmenityItem = (a) => {
            const lower = (a || '').toLowerCase();
            const isExtra = lower.includes('additional charge') || lower.includes('surcharge') || lower.includes('extra charge');
            const clean = formatAmenityName(a.replace(/\s*[–-]?\s*(additional charge|surcharge|extra charge)/gi, '').trim());
            return { label: clean, isExtra };
        };

        return (
            <>
                <hr className="hdp-divider" />
                <div className="hdp-section" id="sec-amenities">
                    <h2 className="hdp-section-title">Most popular facilities</h2>

                    {/* Grouped amenities Booking.com style */}
                    {(popularChips.length > 0 || rawGroups.length > 0) && (
                        <div className="hdp-amen2-groups">

                            {/* Popular as first group card */}
                            {popularChips.length > 0 && (
                                <div className="hdp-amen2-group-card">
                                    <div className="hdp-amen2-group-header">
                                        <span className="hdp-amen2-group-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                        </span>
                                        <span className="hdp-amen2-group-title">Great for your stay</span>
                                    </div>
                                    <ul className="hdp-amen2-list">
                                        {popularChips.map(a => (
                                            <li key={a.key} className="hdp-amen2-item">
                                                <svg className="hdp-amen2-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                                <span className="hdp-amen2-item-label">{a.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {rawGroups.map((g, gi) => (
                                <div key={gi} className="hdp-amen2-group-card">
                                    <div className="hdp-amen2-group-header">
                                        <span className="hdp-amen2-group-icon">
                                            {groupIconMap(g.group_name)}
                                        </span>
                                        <span className="hdp-amen2-group-title">{g.group_name || 'Amenities'}</span>
                                    </div>
                                    <ul className="hdp-amen2-list">
                                        {g.amenities.map((a, ai) => {
                                            const { label, isExtra } = parseAmenityItem(a);
                                            return (
                                                <li key={ai} className="hdp-amen2-item">
                                                    <svg className="hdp-amen2-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                                    <span className="hdp-amen2-item-label">{label}</span>
                                                    {isExtra && <span className="hdp-amen2-badge">Additional charge</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
        );
    };

    const renderHotelInfoPolicies = () => {
        if (!hotel) return null;
        const extraInfo = hotel.metapolicy_extra_info;
        const policyStruct = hotel.metapolicy_struct;
        if (!extraInfo && !policyStruct) return null;

        const policyMeta = {
            internet:  { title: 'Internet & Wi-Fi', color: '#3b82f6', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg> },
            meal:      { title: 'Dining & Meals',    color: '#f59e0b', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg> },
            parking:   { title: 'Parking',           color: '#8b5cf6', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg> },
            pets:      { title: 'Pet Policy',        color: '#10b981', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg> },
            extra_bed: { title: 'Extra Bed',         color: '#ec4899', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg> },
            children:  { title: 'Children Policy',  color: '#f97316', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 3"/></svg> },
            shuttle:   { title: 'Airport Shuttle',  color: '#06b6d4', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-4.3c.3-2.7.2-6.7-.8-8.3H2"/><path d="M9 18H5.2L5 10H2.8c-.8 0-.8 0-.8.8V18h2"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/></svg> },
            visa:      { title: 'Visa Info',         color: '#64748b', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
            deposit:   { title: 'Deposit',           color: '#14b8a6', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
        };

        const buildPolicyItems = (struct) => {
            if (!struct || typeof struct !== 'object') return [];
            const items = [];
            const fmt = (v) => v ? String(v).replace(/_/g, ' ') : '';
            const fmtMoney = (amount, currency) => amount ? `${currency || ''} ${parseFloat(amount).toFixed(2)}`.trim() : null;
            Object.entries(struct).forEach(([key, arr]) => {
                if (!Array.isArray(arr) || arr.length === 0) return;
                const meta = policyMeta[key] || { title: fmt(key), color: '#64748b', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> };
                arr.forEach(item => {
                    if (!item || typeof item !== 'object') return;
                    const parts = [];
                    const type = item.type || item.territory_type || item.pets_type;
                    const inclusion = item.inclusion;
                    const price = item.price != null ? fmtMoney(item.price, item.currency) : null;
                    const priceUnit = item.price_unit ? fmt(item.price_unit) : null;
                    const amount = item.amount;
                    if (type) parts.push(fmt(type));
                    if (inclusion) {
                        const inc = fmt(inclusion);
                        const incLabels = { included: 'Included in rate', excluded: 'Not included', 'for free': 'Free of charge', surcharge: 'Additional charge applies' };
                        parts.push(incLabels[inc] || inc.charAt(0).toUpperCase() + inc.slice(1));
                    }
                    if (price) parts.push(`${price}${priceUnit ? ' / ' + priceUnit : ''}`);
                    if (amount && key === 'extra_bed') parts.push(`${amount} bed${amount > 1 ? 's' : ''}`);
                    items.push({ ...meta, desc: parts.join(' · ') || 'See hotel for details' });
                });
            });
            return items;
        };

        const policyItems = buildPolicyItems(policyStruct);

        return (
            <>
                <hr className="hdp-divider" />
                <div className="hdp-info-policies-wrap" id="sec-policies">

                    {extraInfo && (
                        <div className="hdp-hotel-info-banner">
                            <div className="hdp-hib-header">
                                <span className="hdp-hib-icon-wrap">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
                                </span>
                                <span className="hdp-hib-title">Important Hotel Information</span>
                            </div>
                            <div className="hdp-hib-body">
                                <div className="hdp-hib-text" dangerouslySetInnerHTML={{ __html: extraInfo }} />
                            </div>
                        </div>
                    )}

                    {policyItems.length > 0 && (
                        <div className="hdp-policies-card">
                            <div className="hdp-policies-header">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>
                                <span className="hdp-policies-header-title">Hotel Policies</span>
                                <span className="hdp-policies-count">{policyItems.length}</span>
                            </div>
                            <div className="hdp-policies-grid">
                                {policyItems.map((p, i) => (
                                    <div key={i} className="hdp-policy-item">
                                        <span className="hdp-policy-icon-wrap" style={{ background: p.color + '18', color: p.color }}>
                                            {p.svg}
                                        </span>
                                        <div className="hdp-policy-content">
                                            <div className="hdp-policy-title">{p.title}</div>
                                            <div className="hdp-policy-desc">{p.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </>
        );
    };

    // Mini-map now uses Google Maps iframe — no Leaflet useEffect needed

    const renderMap = () => {
        if (!showMap || !hotel) return null;
        const lat = parseFloat(hotel.latitude);
        const lng = parseFloat(hotel.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        const gmSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
        return (
            <div className="hdp-map-overlay" onClick={() => setShowMap(false)}>
                <div className="hdp-map-box" onClick={e => e.stopPropagation()}>
                    <div className="hdp-map-header">
                        <span className="hdp-map-title">{hotel.name || 'Location'}</span>
                        <button className="hdp-close-btn" onClick={() => setShowMap(false)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Close
                        </button>
                    </div>
                    <iframe
                        title="Hotel map"
                        src={gmSrc}
                        style={{ flex: 1, border: 0, width: '100%', minHeight: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>
            </div>
        );
    };

    /* A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â
       MAIN RENDER
    A¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢ÂA¢"¢Â */
    return (
        <div className="hdp-page">

            {loading && (
                <div className="hdp-center-box">
                    <div style={{ textAlign: 'center' }}>
                        <div className="hdp-spinner"/>
                        <p className="hdp-spin-text">Loading hotel detailsA¢â‚¬Â¦</p>
                    </div>
                </div>
            )}

            {!loading && error && (
                <div className="hdp-center-box">
                    <div className="hdp-error-box">
                        <h3>Unable to load hotel</h3>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {!loading && !error && hotel && (
                <div className="hdp-container">

                    {/* 1. name + stars + address */}
                    <div className="hdp-header" id="sec-overview">
                        <div className="hdp-title-row">
                            <h1 className="hdp-hotel-name">{hotel.name}</h1>
                            {hotel.star_rating > 0 && (
                                <span className="hdp-stars-inline">
                                    {Array.from({ length: hotel.star_rating }).map((_, i) => (
                                        <svg key={i} width="14" height="14" viewBox="0 0 24 24">
                                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                                                fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"/>
                                        </svg>
                                    ))}
                                    <span className="hdp-stars-label">{hotel.star_rating}-Star Hotel</span>
                                </span>
                            )}
                        </div>
                        <div className="hdp-meta-row">
                            {(hotel.address || hotel.region) && (
                                <span className="hdp-address">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    {[hotel.address, hotel.region?.name].filter(Boolean).join(', ')}
                                </span>
                            )}
                            {hotel.latitude && hotel.longitude && (
                                <button className="hdp-map-btn" onClick={() => setShowMap(true)}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    View on Map
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. gallery */}
                    {renderGallery()}

                    {/* sticky section tabs */}
                    <div className="hdp-tabs-bar">
                        {[
                            { id: 'sec-overview',      label: 'Overview' },
                            { id: 'sec-about',         label: 'About' },
                            { id: 'sec-rooms',         label: 'Rooms' },
                            { id: 'sec-policies',      label: 'Policies' },
                            { id: 'sec-amenities',    label: 'Amenities' },
                        ].map(t => (
                            <button
                                key={t.id}
                                className={`hdp-tab-btn${activeTab === t.id ? ' hdp-tab-btn--active' : ''}`}
                                onClick={() => {
                                    const el = document.getElementById(t.id);
                                    if (el) {
                                        const y = el.getBoundingClientRect().top + window.scrollY - 80;
                                        window.scrollTo({ top: y, behavior: 'smooth' });
                                    }
                                    setActiveTab(t.id);
                                    clickLockRef.current = true;
                                    setTimeout(() => { clickLockRef.current = false; }, 1000);
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <hr className="hdp-divider"/>

                    {/* 3+4. about + explore area — two-column layout */}
                    <div className="hdp-about-area-row">
                        {/* Left column: About + Amenities */}
                        <div className="hdp-about-area-left">
                            {hotel.description_struct?.length > 0 && (
                                <div className="hdp-section" id="sec-about">
                                    <h2 className="hdp-section-title">About the Property</h2>
                                    <div className={`hdp-about${aboutExpanded ? ' hdp-about--expanded' : ''}`}>
                                        <div className="hdp-about-inner" ref={aboutInnerRef}>
                                            {hotel.description_struct.map((section, si) => (
                                                <div key={si} className="hdp-about-section">
                                                    {section.title && <h4>{section.title}</h4>}
                                                    {(Array.isArray(section.paragraphs) ? section.paragraphs : [section.paragraphs]).filter(Boolean).map((p, pi) => {
                                                        const colonIdx = p.indexOf(':');
                                                        if (colonIdx > 0 && colonIdx < 50) return <p key={pi}><strong>{p.slice(0, colonIdx)}</strong>{p.slice(colonIdx)}</p>;
                                                        return <p key={pi}>{p}</p>;
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                        {aboutOverflows && !aboutExpanded && <div className="hdp-about-fade"/>}
                                    </div>
                                    {aboutOverflows && (
                                        <button className="hdp-about-toggle" onClick={() => setAboutExpanded(e => !e)}>
                                            {aboutExpanded ? 'Show less ↑' : 'Read more ↓'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {namedAmenities.length > 0 && (
                                <div className="hdp-section">
                                    <h2 className="hdp-section-title">Amenities</h2>
                                    <div className="hdp-amenities-grid">
                                        {namedAmenities.map(a => (
                                            <div key={a.key} className="hdp-amenity-chip">
                                                <AmenityIcon type={a.key}/>
                                                <span>{a.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right column: Explore the Area */}
                        {hotel.latitude && hotel.longitude && (() => {
                            const locationSection = (hotel.description_struct || []).find(s => s.title?.toLowerCase() === 'location');
                            const locationBlurb = locationSection?.paragraphs?.[0] || null;
                            return (
                                <div className="hdp-about-area-right">
                                    <div className="hdp-explore-card">
                                        <h3 className="hdp-explore-title">Explore the area</h3>
                                        <div className="hdp-explore-map-thumb">
                                            {hotel.latitude && hotel.longitude && (
                                                <iframe
                                                    title="Hotel location preview"
                                                    src={`https://maps.google.com/maps?q=${parseFloat(hotel.latitude)},${parseFloat(hotel.longitude)}&z=15&output=embed`}
                                                    style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                                                    loading="lazy"
                                                    allowFullScreen
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                />
                                            )}
                                        </div>
                                        <div className="hdp-explore-addr-row">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hdp-explore-pin-icon"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                            <span className="hdp-explore-addr-text">
                                                {[hotel.address, hotel.region?.name].filter(Boolean).join(', ')}
                                            </span>
                                        </div>
                                        <button className="hdp-explore-view-btn" onClick={() => setShowMap(true)}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                            View in a map
                                        </button>
                                        {locationBlurb && (
                                            <p className="hdp-explore-location-blurb">{locationBlurb}</p>
                                        )}
                                        {nearbyPlaces.length > 0 && (
                                            <div className="hdp-explore-highlights">
                                                <p className="hdp-explore-highlights-label">What's nearby</p>
                                                <div className="hdp-explore-nearby-list">
                                                    {nearbyPlaces.map((p, i) => (
                                                        <div key={i} className="hdp-explore-nearby-item">
                                                            <span className="hdp-explore-nearby-icon"><NearbyPlaceIcon type={p.type} /></span>
                                                            <span className="hdp-explore-nearby-name">{p.name}</span>
                                                            <span className="hdp-explore-nearby-dist">{p.distLabel}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <hr className="hdp-divider"/>

                    {/* 5. date filter + rooms */}
                    {renderDateFilter()}
                    {renderRoomCards()}

                    {renderHotelInfoPolicies()}
                    {renderAllAmenities()}

                    <hr className="hdp-divider"/>

                    {/* 6. details accordion */}
                    {detailRows.length > 0 && (
                        <div className="hdp-accordion">
                            <div className="hdp-accordion-header" onClick={() => setAccordionOpen(o => !o)}>
                                <span className="hdp-accordion-title">Hotel Details</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    className={`hdp-accordion-chevron${accordionOpen ? ' open' : ''}`}>
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </div>
                            {accordionOpen && (
                                <div className="hdp-accordion-body">
                                    {detailRows.map((row, i) => (
                                        <div key={i} className="hdp-detail-row">
                                            <span className="hdp-detail-label">{row.label}</span>
                                            <span className="hdp-detail-value">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* modals */}
            {renderLightbox()}
            {renderAllPhotos()}
            {renderMap()}
            {renderRoomModal()}
            {renderPriceChangeModal()}
        </div>
    );
}

