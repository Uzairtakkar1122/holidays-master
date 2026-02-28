import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { phoneCodes } from '../data/geoData';
import './ConfirmBookingPage.css';

/* â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const fmt = (d) => {
    if (!d) return '-';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
};

const fmtShort = (d) => {
    if (!d) return '-';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
};

function generateUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
}

async function getUserIp() {
    try {
        const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
        if (!r.ok) return null;
        const j = await r.json();
        return j.ip || null;
    } catch { return null; }
}

const PARTNER_OPS_EMAIL = 'holidaysmasters2024@gmail.com';
const POLL_INTERVAL_MS  = 5000;
const GENERAL_TIMEOUT_MS = 2 * 60 * 1000;


/* â”€â”€â”€ main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function ConfirmBookingPage() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { isDark } = useTheme();
    const params    = new URLSearchParams(location.search);

    /* --- URL / localStorage data -------------------------------- */
    const bookHash     = params.get('book_hash') || '';
    const checkin      = params.get('checkin') || '';
    const checkout     = params.get('checkout') || '';
    const hotelIdParam = params.get('hotel_id') || '';
    const totalAmtParam= parseFloat(params.get('total_amount') || '0');
    const currencyParam= params.get('currency') || 'USD';
    const hotelNameParam = decodeURIComponent(params.get('hotel_name') || 'Hotel Booking');
    const roomNameParam  = decodeURIComponent(params.get('room_name') || 'Room');

    let guestList = [{ adults: 1, children: [] }];
    try {
        const raw = decodeURIComponent(params.get('guests') || '');
        if (raw) guestList = JSON.parse(raw);
    } catch {}

    const nights = checkin && checkout
        ? Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000))
        : 1;

    const totalGuests = guestList.reduce((a, r) => a + (r.adults || 1) + (r.children?.length || 0), 0);

    /* --- state -------------------------------------------------- */
    const [phase, setPhase]         = useState('init'); // init | form | processing | success | error
    const [statusMsg, setStatusMsg] = useState({ title: 'Preparing your booking...', text: 'Retrieving the best rates and availability.', type: 'loading' });
    const [itemId, setItemId]       = useState(null);
    const [paymentType, setPaymentType] = useState(null);   // selected payment type object from API
    const [partnerOrderId, setPartnerOrderId] = useState('');

    // room / hotel display
    const [roomImages, setRoomImages]   = useState([]);
    const hotelName = hotelNameParam;
    const roomName  = roomNameParam;
    const displayAmount = totalAmtParam;
    const displayCurrency = currencyParam;

    // form fields
    const [firstName, setFirstName]     = useState('');
    const [lastName, setLastName]       = useState('');
    const [email, setEmail]             = useState('');
    const [phoneDial, setPhoneDial]     = useState('+1');
    const [phone, setPhone]             = useState('');
    const [comment, setComment]         = useState('');
    const [cardHolder, setCardHolder]   = useState('');
    const [cardNumber, setCardNumber]   = useState('');
    const [cardMonth, setCardMonth]     = useState('');
    const [cardYear, setCardYear]       = useState('');
    const [cardCvc, setCardCvc]         = useState('');
    const [guestNames, setGuestNames]   = useState({}); // { 'r0a0_first': '', ... }
    const [errors, setErrors]           = useState({});
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting]   = useState(false);
    const [refundable, setRefundable]   = useState(null); // null | { before, text }
    const [showSpecial, setShowSpecial] = useState(false);
    const [progressStep, setProgressStep] = useState(1); // 1=Details, 2=Payment, 3=Confirmation

    // live card preview
    const [cardType, setCardType]       = useState('default'); // visa | mastercard | amex | discover | default
    const [cardPreview, setCardPreview] = useState({ number: '', holder: '', expiry: '' });

    // image carousel
    const [imgIdx, setImgIdx] = useState(0);
    const prevImg = () => setImgIdx(i => (i - 1 + roomImages.length) % roomImages.length);
    const nextImg = () => setImgIdx(i => (i + 1) % roomImages.length);

    const pollingRef = useRef(null);
    // ref keeps the current partner_order_id so handleSubmit never reads a stale closure value
    const partnerOrderIdRef = useRef('');
    // prevent React StrictMode from running initBookingForm twice in dev
    const initCalledRef = useRef(false);

    /* --- load room images from localStorage --------------------- */
    useEffect(() => {
        try {
            const imgs = JSON.parse(localStorage.getItem('hm_room_images') || localStorage.getItem('hm_hotel_images') || '[]');
            if (Array.isArray(imgs) && imgs.length > 0) setRoomImages(imgs);
        } catch {}
    }, []);

    /* --- auto-fill from Google auth user ----------------------- */
    useEffect(() => {
        try {
            const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
            if (authUser) {
                if (authUser.given_name)  setFirstName(authUser.given_name);
                if (authUser.family_name) setLastName(authUser.family_name);
                else if (authUser.name) {
                    const parts = authUser.name.split(' ');
                    if (!authUser.given_name) setFirstName(parts[0] || '');
                    setLastName(parts.slice(1).join(' ') || '');
                }
                if (authUser.email) setEmail(authUser.email);
            }
        } catch {}
    }, []);

    /* --- call hotel-booking-form on mount ---------------------- */
    useEffect(() => {
        if (initCalledRef.current) return; // StrictMode guard — prevent double-call
        initCalledRef.current = true;
        if (!bookHash) {
            setStatusMsg({ title: 'Invalid Request', text: 'Missing booking reference. Please start your search again.', type: 'error' });
            setPhase('error');
            return;
        }
        initBookingForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initBookingForm = async () => {
        setPhase('init');
        setStatusMsg({ title: 'Preparing your booking...', text: 'Retrieving rates and availability for your selected dates.', type: 'loading' });
        let orderId = generateUUID();
        setPartnerOrderId(orderId);
        partnerOrderIdRef.current = orderId;
        const userIp = await getUserIp();
        try {
            const payload = { partner_order_id: orderId, book_hash: bookHash, language: 'en' };
            if (userIp) payload.user_ip = userIp;
            console.log('[Booking] hotel-booking-form called — partner_order_id:', orderId);
            const res = await fetch('/api/hotel-booking-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            console.log('[Booking] hotel-booking-form response:', JSON.stringify(data).substring(0, 700));
            if (data?.status === 'success' && data.data?.status === 'ok') {
                const form = data.data.data;
                const iid  = form?.item_id;
                if (!iid) throw new Error('No item_id returned from booking form API');
                setItemId(iid);
                console.log('[Booking] item_id:', iid);

                // RateHawk may return its own partner_order_id — use it (mirrors PHP code)
                if (form?.partner_order_id) {
                    console.log('[Booking] RateHawk returned partner_order_id:', form.partner_order_id, '(replacing:', orderId, ')');
                    orderId = form.partner_order_id;
                    setPartnerOrderId(orderId);
                    partnerOrderIdRef.current = orderId;
                }

                // extract refund policy
                const cp = form?.payment_types?.[0]?.cancellation_penalties;
                if (cp?.free_cancellation_before) {
                    setRefundable({ before: cp.free_cancellation_before, text: `Fully refundable before ${fmtShort(cp.free_cancellation_before.split('T')[0])}` });
                }

                // find "now" payment type
                const nowPt = (form?.payment_types || []).find(pt => pt.type === 'now');
                if (!nowPt) throw new Error('Pay Now method not available for this booking');
                setPaymentType({
                    ...nowPt,
                    display_amount: parseFloat(nowPt.amount || '0'),
                    display_currency: nowPt.currency_code,
                });

                setPhase('form');
            } else {
                // pull out the actual RateHawk error from the nested response
                const rhStatus = data?.data?.data?.status || data?.data?.status;
                const rhError  = data?.data?.data?.error  || data?.data?.error  || data?.error;
                const msg = rhError || rhStatus || 'Booking form request failed';
                throw new Error(msg);
            }
        } catch (err) {
            console.error('[Booking] initBookingForm error:', err.message);
            setStatusMsg({ title: 'Booking Unavailable', text: err.message || 'Unable to prepare booking. Please try again.', type: 'error' });
            setPhase('error');
        }
    };

    /* --- card type detection ----------------------------------- */
    const detectCardType = (num) => {
        const n = num.replace(/\s/g, '');
        if (n.startsWith('4'))           return 'visa';
        if (/^5[1-5]/.test(n))          return 'mastercard';
        if (/^3[47]/.test(n))           return 'amex';
        if (/^6(?:011|5)/.test(n))      return 'discover';
        return 'default';
    };

    const handleCardNumber = (v) => {
        let clean = v.replace(/\D/g, '');
        clean = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(clean);
        setCardType(detectCardType(clean));
        setCardPreview(p => ({ ...p, number: clean }));
        clearErr('cardNumber');
    };

    const handleCardHolder = (v) => {
        setCardHolder(v);
        setCardPreview(p => ({ ...p, holder: v.toUpperCase() }));
        clearErr('cardHolder');
    };

    const handleCardMonth = (v) => {
        const m = v.replace(/\D/g, '').slice(0, 2);
        setCardMonth(m);
        setCardPreview(p => ({ ...p, expiry: `${m}/${cardYear || ''}` }));
        clearErr('cardMonth');
    };

    const handleCardYear = (v) => {
        const y = v.replace(/\D/g, '').slice(0, 2);
        setCardYear(y);
        setCardPreview(p => ({ ...p, expiry: `${cardMonth || ''}/${y}` }));
        clearErr('cardYear');
    };

    /* --- validation ------------------------------------------- */
    const clearErr = (field) => setErrors(e => { const n = { ...e }; delete n[field]; return n; });

    const validate = () => {
        const errs = {};
        if (!firstName.trim()) errs.firstName = 'Required';
        if (!lastName.trim())  errs.lastName  = 'Required';
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Valid email required';
        if (!phone.trim())     errs.phone     = 'Required';
        if (!cardHolder.trim())  errs.cardHolder  = 'Required';
        const cn = cardNumber.replace(/\s/g, '');
        if (!cn || cn.length < 13) errs.cardNumber = 'Enter a valid card number';
        if (!cardMonth.trim() || parseInt(cardMonth) < 1 || parseInt(cardMonth) > 12) errs.cardMonth = 'Invalid month';
        if (!cardYear.trim() || parseInt(cardYear) < (new Date().getFullYear() % 100)) errs.cardYear = 'Invalid year';
        if (!cardCvc.trim() || !/^\d{3,4}$/.test(cardCvc)) errs.cardCvc = 'Invalid CVC';
        // guest names
        guestList.forEach((room, ri) => {
            for (let ai = 0; ai < (room.adults || 1); ai++) {
                if (!guestNames[`r${ri}a${ai}_first`]?.trim()) errs[`r${ri}a${ai}_first`] = 'Required';
                if (!guestNames[`r${ri}a${ai}_last`]?.trim())  errs[`r${ri}a${ai}_last`]  = 'Required';
            }
            (room.children || []).forEach((_, ci) => {
                if (!guestNames[`r${ri}c${ci}_first`]?.trim()) errs[`r${ri}c${ci}_first`] = 'Required';
                if (!guestNames[`r${ri}c${ci}_last`]?.trim())  errs[`r${ri}c${ci}_last`]  = 'Required';
            });
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    /* --- build rooms array ------------------------------------- */
    const buildRooms = () => guestList.map((room, ri) => {
        const guests = [];
        for (let ai = 0; ai < (room.adults || 1); ai++) {
            guests.push({
                first_name: guestNames[`r${ri}a${ai}_first`]?.trim() || (ri === 0 && ai === 0 ? firstName : ''),
                last_name:  guestNames[`r${ri}a${ai}_last`]?.trim()  || (ri === 0 && ai === 0 ? lastName  : ''),
            });
        }
        (room.children || []).forEach((age, ci) => {
            guests.push({
                first_name: guestNames[`r${ri}c${ci}_first`]?.trim() || '',
                last_name:  guestNames[`r${ri}c${ci}_last`]?.trim()  || '',
                is_child: true,
                age: Number(age),
            });
        });
        return { guests };
    });

    /* --- submit handler --------------------------------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            const first = document.querySelector('.cbp-input.cbp-error');
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const currentOrderId = partnerOrderIdRef.current;
        if (!itemId || !paymentType || !currentOrderId) {
            setSubmitError('Booking session not ready - please refresh the page.');
            return;
        }
        try {
            setSubmitting(true);
            setSubmitError('');

            // Step 1 â€” tokenise card
            setProgressStep(2);
            setPhase('processing');
            setStatusMsg({ title: 'Securing payment...', text: 'Encrypting your card details securely.', type: 'loading' });
            const payUuid  = generateUUID();
            const initUuid = generateUUID();
            console.log('[Booking] create-card-token called, object_id:', itemId, 'pay_uuid:', payUuid);
            const tokenRes = await fetch('/api/create-card-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    object_id: itemId.toString(),
                    pay_uuid: payUuid,
                    init_uuid: initUuid,
                    user_first_name: firstName.trim(),
                    user_last_name: lastName.trim(),
                    cvc: cardCvc.trim(),
                    is_cvc_required: true,
                    credit_card_data_core: {
                        card_number: cardNumber.replace(/\s/g, ''),
                        card_holder: cardHolder.trim(),
                        month: cardMonth.trim(),
                        year: cardYear.trim(),
                    },
                }),
            });
            const tokenData = await tokenRes.json();
            console.log('[Booking] create-card-token response:', JSON.stringify(tokenData).substring(0, 400));

            // Payota wraps its response: outer status:'success' just means HTTP OK
            // The actual result is in tokenData.data — must check THAT for errors too
            const tokenInner = tokenData?.data || {};
            const tokenFailed = tokenData?.status !== 'success' || tokenInner?.status === 'error' || !!tokenInner?.error;
            if (tokenFailed) {
                // Pick up the error code: Payota uses tokenInner.error, our server uses tokenData.code
                const code = tokenInner?.error || tokenData?.data?.code || tokenData?.code || 'card_error';
                const msg  = tokenInner?.message || tokenData?.message || 'Card processing failed';
                const fieldErrMap = {
                    invalid_cvc: 'cardCvc', invalid_card_number: 'cardNumber',
                    luhn_algorithm_error: 'cardNumber', invalid_card_holder: 'cardHolder',
                    invalid_month: 'cardMonth', invalid_year: 'cardYear',
                };
                if (fieldErrMap[code]) {
                    const friendlyMsg = {
                        luhn_algorithm_error: 'Invalid card number — please check and re-enter.',
                        invalid_cvc: 'Invalid CVC — please check and re-enter.',
                        invalid_card_number: 'Invalid card number.',
                        invalid_card_holder: 'Invalid cardholder name.',
                        invalid_month: 'Invalid expiry month.',
                        invalid_year: 'Invalid expiry year.',
                    };
                    setErrors(prev => ({ ...prev, [fieldErrMap[code]]: friendlyMsg[code] || msg }));
                    setPhase('form');
                    setSubmitting(false);
                    return;
                }
                throw new Error(msg || `Card error: ${code}`);
            }

            // Step 2 â€” booking finish
            setStatusMsg({ title: 'Processing booking...', text: 'Contacting the hotel to confirm your reservation.', type: 'loading' });
            const returnUrl = `${window.location.origin}/confirm-booking?booking_return=3ds_complete&partner_order_id=${encodeURIComponent(currentOrderId)}`;
            const guestMeta = { guest_email: email.trim(), guest_name: `${firstName} ${lastName}`, booking_source: 'HolidaysMaster', booking_timestamp: new Date().toISOString() };
            try { localStorage.setItem('guest_email', email.trim()); localStorage.setItem('guest_name', `${firstName} ${lastName}`); } catch {}

            const bookPayload = {
                user: { email: PARTNER_OPS_EMAIL, phone: phoneDial + phone.trim(), comment: comment || '' },
                supplier_data: { first_name_original: 'Holidays', last_name_original: 'Master', phone: '+447969270207', email: PARTNER_OPS_EMAIL },
                partner: { partner_order_id: currentOrderId, comment: JSON.stringify(guestMeta), amount_sell_b2b2c: paymentType.amount || '0' },
                language: 'en',
                rooms: buildRooms(),
                payment_type: { type: 'now', amount: paymentType.amount || '0', currency_code: paymentType.currency_code || 'USD', pay_uuid: payUuid, init_uuid: initUuid },
                return_path: returnUrl,
            };
            if (checkin) {
                const arr = new Date(checkin);
                if (!isNaN(arr)) { arr.setHours(15, 0, 0, 0); bookPayload.arrival_datetime = arr.toISOString(); }
            }

            console.log('[Booking] start-booking-process calling, partner_order_id:', currentOrderId);
            const bookRes = await fetch('/api/start-booking-process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookPayload),
            });
            const bookData = await bookRes.json();
            console.log('[Booking] start-booking-process response (HTTP', bookRes.status, '):', JSON.stringify(bookData).substring(0, 600));

            // If the server returned a non-2xx HTTP status, the booking was rejected
            // (e.g. 400 = bad payload, 429 = rate limited, 500 = server error)
            if (!bookRes.ok) {
                const errMsg = bookData?.message || bookData?.data?.message || bookData?.error
                    || `Booking request rejected (HTTP ${bookRes.status}). Please try again.`;
                // 400 means bad request (our payload) — go back to form
                if (bookRes.status === 400) throw new Error(errMsg);
                // 429 / 5xx — transient errors, proceed to polling (booking may still process)
                if (bookRes.status === 429 || bookRes.status >= 500) {
                    console.warn('[Booking] Transient HTTP error, proceeding to poll:', bookRes.status);
                } else {
                    throw new Error(errMsg);
                }
            }

            // If the booking finish itself returned a hard error, surface it immediately
            // rather than silently falling through to polling (which will return page_not_found)
            const finishInner  = bookData?.data?.data || bookData?.data || {};
            const finishStatus = finishInner?.status || bookData?.status;
            const finishError  = finishInner?.error  || bookData?.error;
            console.log('[Booking] finish decoded — status:', finishStatus, '| error:', finishError, '| data.data:', bookData?.data?.data);

            // If data.data is null, RateHawk received the booking but hasn't registered it yet.
            // This is normal for production — wait a few seconds before first poll.
            const dataDataIsNull = bookData?.data?.data === null || bookData?.data?.data === undefined;

            const HARD_ERRORS = ['page_not_found', 'bad_book_hash', 'invalid_book_hash',
                                  'book_limit', 'soldout', 'block'];
            if (HARD_ERRORS.includes(finishStatus) || HARD_ERRORS.includes(finishError)) {
                const MSG = {
                    page_not_found:    'Your booking session has expired. Please go back and select the room again.',
                    bad_book_hash:     'The booking link has expired. Please go back and select the room again.',
                    invalid_book_hash: 'The booking link is invalid. Please go back and search again.',
                    book_limit:        'Too many booking attempts. Please wait a moment and try again.',
                    soldout:           'Sorry, this room just sold out. Please go back and choose another room.',
                    block:             'Payment blocked. Please try a different card.',
                };
                const code = HARD_ERRORS.find(c => c === finishStatus || c === finishError);
                const msg = MSG[code] || `Booking failed (${code}). Please go back and try again.`;
                // Session/availability errors – send to error screen so user knows to navigate back
                const sessionErrors = ['page_not_found', 'bad_book_hash', 'invalid_book_hash', 'book_limit', 'soldout'];
                if (sessionErrors.includes(code)) {
                    setStatusMsg({ title: 'Booking Unavailable', text: msg, type: 'error' });
                    setPhase('error');
                    setSubmitting(false);
                    return;
                }
                // Card errors – go back to form so user can re-enter card
                throw new Error(msg);
            }

            // Step 3 â€” poll status
            // If booking finish returned null data, RateHawk is still registering the booking.
            // Wait 4 seconds before first poll to give it time to appear in the system.
            const initialPollDelay = dataDataIsNull ? 4000 : 0;
            setProgressStep(3);
            if (initialPollDelay > 0) {
                setStatusMsg({ title: 'Booking submitted...', text: 'Waiting for hotel confirmation. This may take a moment.', type: 'loading' });
                await new Promise(res2 => setTimeout(res2, initialPollDelay));
            }
            pollStatus(currentOrderId, Date.now());

        } catch (err) {
            setSubmitError(err.message || 'An error occurred. Please try again.');
            setPhase('form');
            setSubmitting(false);
        }
    };

    /* --- status polling --------------------------------------- */
    const pollStatus = useCallback((orderId, startTime) => {
        setPhase('processing');
        setStatusMsg({ title: 'Confirming reservation...', text: 'We\'re waiting for the hotel to confirm your booking.', type: 'loading' });
        const timeoutAt = startTime + GENERAL_TIMEOUT_MS;

        const check = () => {
            if (Date.now() > timeoutAt) {
                setStatusMsg({ title: 'Booking Timeout', text: 'Your booking is taking longer than expected. Please check your email or contact support.', type: 'error' });
                setPhase('error');
                return;
            }
            fetch('/api/booking-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partner_order_id: orderId }),
            })
            .then(async r => {
                const d = await r.json().catch(() => null);
                // If RateHawk returns 404 and we're within the first 45 seconds,
                // the booking is still being registered — retry instead of failing
                if (!r.ok) {
                    const elapsed = Date.now() - startTime;
                    if (r.status === 404 && elapsed < 45000) {
                        console.log('[Booking] 404 on status poll, booking still registering... retry in 5s (elapsed:', Math.round(elapsed/1000), 's)');
                        pollingRef.current = setTimeout(check, POLL_INTERVAL_MS);
                        return;
                    }
                    // For other HTTP errors or 404 after 45s, treat as not found
                    const errTxt = d?.message || d?.data?.message || `HTTP ${r.status}`;
                    setStatusMsg({ title: 'Booking Not Found', text: `Could not retrieve booking status (${errTxt}). Please contact support with ref: ${orderId.substring(0,8).toUpperCase()}`, type: 'error' });
                    setPhase('error');
                    return;
                }
                return d;
            })
            .then(d => {
                if (!d) return; // handled above (null = retry or error already set)
                // Server wraps RateHawk: { status:'success', data:{ status:'ok', data:{ status:'...', error:'...' } } }
                // Actual booking status is at d.data.data.status
                const inner   = d?.data?.data;             // RateHawk inner payload
                const status  = inner?.status || d?.data?.status || d?.status;
                const errCode = inner?.error  || d?.data?.error  || d?.error;
                const data3ds = inner?.data_3ds || d?.data?.data_3ds;
                switch (status) {
                    case 'ok': case 'completed': case 'confirmed':
                        setStatusMsg({ title: 'Booking Confirmed!', text: `Your reservation is confirmed. Booking reference: ${orderId}`, type: 'success' });
                        setPhase('success');
                        break;
                    case 'processing': case 'pending': case 'requested':
                        setStatusMsg({ title: 'Processing...', text: 'Finalising your reservation with the hotel.', type: 'loading' });
                        pollingRef.current = setTimeout(check, POLL_INTERVAL_MS);
                        break;
                    // Hard-failure statuses returned directly as the status field
                    case 'page_not_found':
                        setStatusMsg({ title: 'Session Expired', text: 'Your booking session has expired. Please go back and select the room again.', type: 'error' });
                        setPhase('error');
                        break;
                    case 'not_found':
                        setStatusMsg({ title: 'Booking Not Found', text: 'We could not find this booking. Please contact support with your reference: ' + orderId.substring(0,8).toUpperCase(), type: 'error' });
                        setPhase('error');
                        break;
                    case '3ds':
                        if (data3ds?.action_url) {
                            setStatusMsg({ title: '3D Secure Required', text: 'Redirecting to your bank for verification...', type: 'loading' });
                            const form = document.createElement('form');
                            form.method = data3ds.method || 'POST';
                            form.action = data3ds.action_url;
                            if (data3ds.data && typeof data3ds.data === 'object') {
                                Object.entries(data3ds.data).forEach(([k, v]) => {
                                    const inp = document.createElement('input');
                                    inp.type = 'hidden'; inp.name = k; inp.value = v;
                                    form.appendChild(inp);
                                });
                            }
                            document.body.appendChild(form);
                            setTimeout(() => form.submit(), 500);
                        } else {
                            pollingRef.current = setTimeout(check, POLL_INTERVAL_MS);
                        }
                        break;
                    case 'error':
                        const errMsgs = {
                            soldout:        'This room is sold out. Please search for an alternative room.',
                            block:          'Payment blocked by your bank. Please try a different card.',
                            charge:         'Card charge failed. Please check your card details and try again.',
                            book_limit:     'Booking session expired. Please go back and start a new booking.',
                            provider:       'Hotel system error. Please try again in a few minutes.',
                            page_not_found: 'Your booking session has expired. Please go back and search again.',
                            'page not found': 'Your booking session has expired. Please go back and search again.',
                            '3ds':          '3D Secure authentication failed. Please try again.',
                        };
                        setStatusMsg({ title: 'Booking Failed', text: errMsgs[errCode] || errMsgs[String(errCode).replace(/_/g,' ')] || `Payment or booking error (${errCode || 'unknown'}). Please contact support.`, type: 'error' });
                        setPhase('error');
                        break;
                    default:
                        pollingRef.current = setTimeout(check, POLL_INTERVAL_MS);
                }
            })
            .catch(() => {
                if (Date.now() + POLL_INTERVAL_MS <= timeoutAt) {
                    pollingRef.current = setTimeout(check, POLL_INTERVAL_MS);
                } else {
                    setStatusMsg({ title: 'Connection Error', text: 'Unable to verify status. Please contact support.', type: 'error' });
                    setPhase('error');
                }
            });
        };
        check();
    }, []);

    useEffect(() => () => { if (pollingRef.current) clearTimeout(pollingRef.current); }, []);

    /* --- handle 3DS return ------------------------------------ */
    useEffect(() => {
        const returnParam = params.get('booking_return');
        const returnOrder = params.get('partner_order_id');
        if (returnParam === '3ds_complete' && returnOrder) {
            setPartnerOrderId(returnOrder);
            partnerOrderIdRef.current = returnOrder;
            setStatusMsg({ title: 'Verifying payment...', text: 'Please wait while we confirm your transaction.', type: 'loading' });
            setPhase('processing');
            pollStatus(returnOrder, Date.now());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* â”€â”€ guest name field helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const guestField = (key, placeholder) => (
        <input
            className={`cbp-input${errors[key] ? ' cbp-error' : ''}`}
            placeholder={placeholder}
            value={guestNames[key] || ''}
            onChange={e => { setGuestNames(p => ({ ...p, [key]: e.target.value })); clearErr(key); }}
        />
    );

    /* â”€â”€â”€ sidebar price info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const showAmount   = paymentType?.display_amount || displayAmount;
    const showCurrency = paymentType?.display_currency || displayCurrency;
    const taxAmt       = (showAmount * 0.12).toFixed(2);
    const payToday     = showAmount.toFixed(2);

    /* â”€â”€â”€ render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (phase === 'init' || phase === 'processing') {
        return (
            <div className={`cbp-status-wrap${isDark ? ' cbp-dark' : ''}`}>
                <div className={`cbp-status-card cbp-status-${statusMsg.type}`}>
                    {statusMsg.type === 'loading' && (
                        <div className="cbp-spinner-ring">
                            <svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" strokeWidth="4"/></svg>
                        </div>
                    )}
                    {statusMsg.type === 'success' && (
                        <div className="cbp-status-icon cbp-success-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                    )}
                    {statusMsg.type === 'error' && (
                        <div className="cbp-status-icon cbp-error-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </div>
                    )}
                    <h2 className="cbp-status-title">{statusMsg.title}</h2>
                    <p className="cbp-status-text">{statusMsg.text}</p>
                </div>
            </div>
        );
    }

    if (phase === 'success') {
        return (
            <div className={`cbp-status-wrap${isDark ? ' cbp-dark' : ''}`}>
                <div className="cbp-status-card cbp-status-success">
                    <div className="cbp-status-icon cbp-success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h2 className="cbp-status-title">Booking Confirmed!</h2>
                    <p className="cbp-status-text">{statusMsg.text}</p>
                    <div className="cbp-success-details">
                        <div className="cbp-success-row"><span>Hotel</span><strong>{hotelName}</strong></div>
                        <div className="cbp-success-row"><span>Room</span><strong>{roomName}</strong></div>
                        <div className="cbp-success-row"><span>Check-in</span><strong>{fmt(checkin)}</strong></div>
                        <div className="cbp-success-row"><span>Check-out</span><strong>{fmt(checkout)}</strong></div>
                        <div className="cbp-success-row"><span>Reference</span><strong className="cbp-ref">{partnerOrderId.substring(0, 8).toUpperCase()}</strong></div>
                    </div>
                    <a href="/" className="cbp-home-btn">Back to Home</a>
                </div>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className={`cbp-status-wrap${isDark ? ' cbp-dark' : ''}`}>
                <div className="cbp-status-card cbp-status-error">
                    <div className="cbp-status-icon cbp-error-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <h2 className="cbp-status-title">{statusMsg.title}</h2>
                    <p className="cbp-status-text">{statusMsg.text}</p>
                    <button className="cbp-retry-btn" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    /* â”€â”€â”€ MAIN FORM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    return (
        <div className={`cbp-page${isDark ? ' cbp-dark' : ''}`}>

            {/* â”€â”€ Progress Indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="cbp-progress">
                {['Details', 'Payment', 'Confirmation'].map((label, i) => {
                    const step = i + 1;
                    const done   = progressStep > step;
                    const active = progressStep === step;
                    return (
                        <React.Fragment key={label}>
                            <div className={`cbp-prog-step${done ? ' cbp-prog-done' : ''}${active ? ' cbp-prog-active' : ''}`}>
                                <div className="cbp-prog-indicator">
                                    {done
                                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        : step}
                                </div>
                                <div className="cbp-prog-label">{label}</div>
                            </div>
                            {i < 2 && <div className={`cbp-prog-line${done ? ' cbp-prog-line-done' : ''}`}/>}
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="cbp-container">

                {/* â”€â”€ LEFT: form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="cbp-left">

                    {/* Refund Policy Banner */}
                    {refundable && (
                        <div className="cbp-refund-banner">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <div>
                                <strong>{refundable.text}</strong>
                                <p>Fully refundable &mdash; you can cancel for a full refund if plans change.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>

                        {/* â”€â”€ SECTION 1: Contact Details â”€â”€â”€â”€â”€â”€â”€ */}
                        <div className="cbp-section">
                            <div className="cbp-section-header">
                                <div className="cbp-section-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                                <div className="cbp-section-meta">
                                    <h3 className="cbp-section-title">Contact Details</h3>
                                    <p className="cbp-section-subtitle">We'll send your confirmation here</p>
                                </div>
                            </div>

                            <div className="cbp-form-grid">
                                <div className="cbp-field">
                                    <label>First Name <span className="cbp-required">*</span></label>
                                    <input className={`cbp-input${errors.firstName ? ' cbp-error' : ''}`} placeholder="John" value={firstName} onChange={e => { setFirstName(e.target.value); clearErr('firstName'); }} />
                                    {errors.firstName && <span className="cbp-err-msg">{errors.firstName}</span>}
                                </div>
                                <div className="cbp-field">
                                    <label>Last Name <span className="cbp-required">*</span></label>
                                    <input className={`cbp-input${errors.lastName ? ' cbp-error' : ''}`} placeholder="Doe" value={lastName} onChange={e => { setLastName(e.target.value); clearErr('lastName'); }} />
                                    {errors.lastName && <span className="cbp-err-msg">{errors.lastName}</span>}
                                </div>
                                <div className="cbp-field cbp-field-wide">
                                    <label>Email Address <span className="cbp-required">*</span></label>
                                    <input type="email" className={`cbp-input${errors.email ? ' cbp-error' : ''}`} placeholder="john.doe@example.com" value={email} onChange={e => { setEmail(e.target.value); clearErr('email'); }} />
                                    {errors.email && <span className="cbp-err-msg">{errors.email}</span>}
                                </div>
                                <div className="cbp-field cbp-field-wide">
                                    <label>Phone Number <span className="cbp-required">*</span></label>
                                    <div className="cbp-phone-row">
                                        <select className="cbp-phone-code" value={phoneDial} onChange={e => setPhoneDial(e.target.value)}>
                                            {phoneCodes.map(c => (
                                                <option key={c.code} value={c.dialCode}>
                                                    {c.name} ({c.dialCode})
                                                </option>
                                            ))}
                                        </select>
                                        <input type="tel" className={`cbp-input cbp-phone-num${errors.phone ? ' cbp-error' : ''}`} placeholder="+44 20 7123 4567" value={phone} onChange={e => { setPhone(e.target.value); clearErr('phone'); }} />
                                    </div>
                                    {errors.phone && <span className="cbp-err-msg">{errors.phone}</span>}
                                </div>
                                <div className="cbp-field cbp-field-wide">
                                    <label>Special Requests <span className="cbp-optional">(Optional)</span></label>
                                    <textarea className="cbp-input cbp-textarea" rows={3} placeholder="Any special requirements for your stay..." value={comment} onChange={e => setComment(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* â”€â”€ SECTION 2: Guest Information â”€â”€â”€â”€â”€ */}
                        <div className="cbp-section">
                            <div className="cbp-section-header">
                                <div className="cbp-section-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <div className="cbp-section-meta">
                                    <h3 className="cbp-section-title">Guest Information</h3>
                                    <p className="cbp-section-subtitle">Enter details for all travellers</p>
                                </div>
                            </div>

                            <div className="cbp-guest-forms">
                                {guestList.map((room, ri) => {
                                    const adultCount = room.adults || 1;
                                    const childCount = (room.children || []).length;
                                    return (
                                        <div key={ri} className="cbp-guest-room-block">
                                            <div className="cbp-guest-room-header">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                                                Room {ri + 1} ({adultCount} Adult{adultCount > 1 ? 's' : ''}{childCount > 0 ? `, ${childCount} Child${childCount > 1 ? 'ren' : ''}` : ''})
                                            </div>
                                            {Array.from({ length: adultCount }).map((_, ai) => (
                                                <div key={ai} className="cbp-guest-entry">
                                                    <div className="cbp-guest-label">Adult {ai + 1}</div>
                                                    <div className="cbp-row-2">
                                                        <div>
                                                            <input className={`cbp-input${errors[`r${ri}a${ai}_first`] ? ' cbp-error' : ''}`} placeholder="First name" value={guestNames[`r${ri}a${ai}_first`] || ''} onChange={e => { setGuestNames(p => ({ ...p, [`r${ri}a${ai}_first`]: e.target.value })); clearErr(`r${ri}a${ai}_first`); }} />
                                                            {errors[`r${ri}a${ai}_first`] && <span className="cbp-err-msg">{errors[`r${ri}a${ai}_first`]}</span>}
                                                        </div>
                                                        <div>
                                                            <input className={`cbp-input${errors[`r${ri}a${ai}_last`] ? ' cbp-error' : ''}`} placeholder="Last name" value={guestNames[`r${ri}a${ai}_last`] || ''} onChange={e => { setGuestNames(p => ({ ...p, [`r${ri}a${ai}_last`]: e.target.value })); clearErr(`r${ri}a${ai}_last`); }} />
                                                            {errors[`r${ri}a${ai}_last`] && <span className="cbp-err-msg">{errors[`r${ri}a${ai}_last`]}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(room.children || []).map((age, ci) => (
                                                <div key={ci} className="cbp-guest-entry">
                                                    <div className="cbp-guest-label">Child (Age {age})</div>
                                                    <div className="cbp-row-2">
                                                        <div>
                                                            <input className={`cbp-input${errors[`r${ri}c${ci}_first`] ? ' cbp-error' : ''}`} placeholder="First name" value={guestNames[`r${ri}c${ci}_first`] || ''} onChange={e => { setGuestNames(p => ({ ...p, [`r${ri}c${ci}_first`]: e.target.value })); clearErr(`r${ri}c${ci}_first`); }} />
                                                            {errors[`r${ri}c${ci}_first`] && <span className="cbp-err-msg">{errors[`r${ri}c${ci}_first`]}</span>}
                                                        </div>
                                                        <div>
                                                            <input className={`cbp-input${errors[`r${ri}c${ci}_last`] ? ' cbp-error' : ''}`} placeholder="Last name" value={guestNames[`r${ri}c${ci}_last`] || ''} onChange={e => { setGuestNames(p => ({ ...p, [`r${ri}c${ci}_last`]: e.target.value })); clearErr(`r${ri}c${ci}_last`); }} />
                                                            {errors[`r${ri}c${ci}_last`] && <span className="cbp-err-msg">{errors[`r${ri}c${ci}_last`]}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* â”€â”€ SECTION 3: Secure Payment â”€â”€â”€â”€â”€â”€â”€ */}
                        <div className="cbp-section">
                            <div className="cbp-section-header">
                                <div className="cbp-section-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                </div>
                                <div className="cbp-section-meta">
                                    <h3 className="cbp-section-title">Secure Payment</h3>
                                    <p className="cbp-section-subtitle">Encrypted &amp; secure transaction</p>
                                </div>
                            </div>

                            {/* Live card visual */}
                            <div className="cbp-card-visual">
                                <div className={`cbp-card-preview cbp-card-${cardType}`}>
                                    {/* top row: chip + brand logo */}
                                    <div className="cbp-card-top-row">
                                        <div className="cbp-card-chip">
                                            <div className="cbp-chip-line"/><div className="cbp-chip-line"/><div className="cbp-chip-line"/>
                                        </div>
                                        <div className="cbp-card-brand">
                                            {cardType === 'visa' && (
                                                <svg viewBox="0 0 56 18" height="20"><text y="14" fontSize="15" fontWeight="900" fill="white" fontFamily="Arial,sans-serif" letterSpacing="2">VISA</text></svg>
                                            )}
                                            {cardType === 'mastercard' && (
                                                <svg viewBox="0 0 40 26" width="40" height="26" fill="none">
                                                    <circle cx="14" cy="13" r="13" fill="#eb001b" opacity=".95"/>
                                                    <circle cx="26" cy="13" r="13" fill="#f79e1b" opacity=".95"/>
                                                    <path d="M20 6.2a13 13 0 0 1 0 13.6 13 13 0 0 1 0-13.6z" fill="#ff5f00"/>
                                                </svg>
                                            )}
                                            {cardType === 'amex' && (
                                                <svg viewBox="0 0 60 18" height="18"><text y="14" fontSize="13" fontWeight="900" fill="white" fontFamily="Arial,sans-serif" letterSpacing="1">AMEX</text></svg>
                                            )}
                                            {cardType === 'discover' && (
                                                <svg viewBox="0 0 90 18" height="16"><text y="13" fontSize="11" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">DISCOVER</text></svg>
                                            )}
                                            {cardType === 'default' && (
                                                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                            )}
                                        </div>
                                    </div>
                                    {/* card number */}
                                    <div className="cbp-card-number-display">
                                        {cardPreview.number || '•••• •••• •••• ••••'}
                                    </div>
                                    {/* holder + expiry */}
                                    <div className="cbp-card-details-row">
                                        <div>
                                            <div className="cbp-card-field-label">Card Holder</div>
                                            <div className="cbp-card-holder-display">{cardPreview.holder || 'YOUR NAME'}</div>
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                            <div className="cbp-card-field-label">Expires</div>
                                            <div className="cbp-card-expiry-display">{cardPreview.expiry || 'MM / YY'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card form fields */}
                            <div className="cbp-card-form">
                                <div className="cbp-field">
                                    <label>Cardholder Name <span className="cbp-required">*</span></label>
                                    <input className={`cbp-input${errors.cardHolder ? ' cbp-error' : ''}`} placeholder="Name as appears on card" value={cardHolder} onChange={e => handleCardHolder(e.target.value)} autoComplete="cc-name" />
                                    {errors.cardHolder && <span className="cbp-err-msg">{errors.cardHolder}</span>}
                                </div>
                                <div className="cbp-field">
                                    <label>Card Number <span className="cbp-required">*</span></label>
                                    <div className="cbp-input-icon-wrap">
                                        <input className={`cbp-input${errors.cardNumber ? ' cbp-error' : ''}`} placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => handleCardNumber(e.target.value)} maxLength={19} inputMode="numeric" autoComplete="cc-number" />
                                        <svg className="cbp-lock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    </div>
                                    {errors.cardNumber && <span className="cbp-err-msg">{errors.cardNumber}</span>}
                                </div>
                                <div className="cbp-row-3">
                                    <div className="cbp-field">
                                        <label>Expiry Month <span className="cbp-required">*</span></label>
                                        <input className={`cbp-input${errors.cardMonth ? ' cbp-error' : ''}`} placeholder="MM" maxLength={2} value={cardMonth} onChange={e => handleCardMonth(e.target.value)} inputMode="numeric" autoComplete="cc-exp-month" />
                                        {errors.cardMonth && <span className="cbp-err-msg">{errors.cardMonth}</span>}
                                    </div>
                                    <div className="cbp-field">
                                        <label>Expiry Year <span className="cbp-required">*</span></label>
                                        <input className={`cbp-input${errors.cardYear ? ' cbp-error' : ''}`} placeholder="YY" maxLength={2} value={cardYear} onChange={e => handleCardYear(e.target.value)} inputMode="numeric" autoComplete="cc-exp-year" />
                                        {errors.cardYear && <span className="cbp-err-msg">{errors.cardYear}</span>}
                                    </div>
                                    <div className="cbp-field">
                                        <label>CVC / CVV <span className="cbp-required">*</span></label>
                                        <div className="cbp-input-icon-wrap">
                                            <input className={`cbp-input${errors.cardCvc ? ' cbp-error' : ''}`} placeholder="123" maxLength={4} value={cardCvc} onChange={e => { setCardCvc(e.target.value.replace(/\D/g, '')); clearErr('cardCvc'); }} inputMode="numeric" autoComplete="cc-csc" />
                                            <svg className="cbp-lock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" title="3 or 4 digit code on the back of your card"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#9ca3af"/></svg>
                                        </div>
                                        {errors.cardCvc && <span className="cbp-err-msg">{errors.cardCvc}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Security Badges */}
                            <div className="cbp-security-badges">
                                <div className="cbp-badge">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    SSL Secure
                                </div>
                                <div className="cbp-badge">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    PCI DSS Compliant
                                </div>
                                <div className="cbp-badge">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                                    3D Secure Ready
                                </div>
                            </div>
                        </div>

                        {/* Submit error */}
                        {submitError && (
                            <div className="cbp-submit-error">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                {submitError}
                            </div>
                        )}

                        {/* Submit button */}
                        <div className="cbp-submit-wrap">
                            <button type="submit" className="cbp-submit-btn" disabled={submitting}>
                                {submitting ? (
                                    <><svg className="cbp-btn-spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"/></svg> Processing...</>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        Complete Booking
                                    </>
                                )}
                            </button>
                            <p className="cbp-terms">
                                By completing this booking, you agree to our <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>. Your payment information is encrypted and secure.
                            </p>
                        </div>
                    </form>
                </div>

                {/* â”€â”€ RIGHT: summary sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="cbp-right">
                    <div className="cbp-summary-card">

                        {/* Header */}
                        <div className="cbp-summary-header">
                            <span className="cbp-summary-label">Booking Summary</span>
                            {partnerOrderId && (
                                <span className="cbp-booking-ref">{partnerOrderId.substring(0, 8).toUpperCase()}</span>
                            )}
                        </div>

                        {/* Hotel & Room info */}
                        <div className="cbp-hotel-preview">
                            <div className="cbp-hotel-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            </div>
                            <div className="cbp-hotel-info">
                                <h4 className="cbp-hotel-name-sm">{hotelName}</h4>
                                <p className="cbp-room-name-sm">{roomName}</p>
                            </div>
                        </div>

                        {/* Room image carousel */}
                        {roomImages.length > 0 ? (
                            <div className="cbp-carousel">
                                <div className="cbp-carousel-track">
                                    <img
                                        key={imgIdx}
                                        src={roomImages[imgIdx]}
                                        alt={`${roomName} ${imgIdx + 1}`}
                                        className="cbp-carousel-img"
                                        onError={e => { e.target.style.display = "none"; }}
                                    />
                                </div>
                                {roomImages.length > 1 && (
                                    <>
                                        <button type="button" className="cbp-car-btn cbp-car-btn-prev" onClick={prevImg} aria-label="Previous image">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                                        </button>
                                        <button type="button" className="cbp-car-btn cbp-car-btn-next" onClick={nextImg} aria-label="Next image">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                        <div className="cbp-carousel-dots">
                                            {roomImages.map((_, di) => (
                                                <button type="button" key={di} className={`cbp-dot${di === imgIdx ? " cbp-dot-active" : ""}`} onClick={() => setImgIdx(di)} aria-label={`Image ${di + 1}`}/>
                                            ))}
                                        </div>
                                    </>
                                )}
                                <div className="cbp-carousel-counter">{imgIdx + 1} / {roomImages.length}</div>
                            </div>
                        ) : (
                            <div className="cbp-carousel cbp-carousel-empty">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                <span>No images available</span>
                            </div>
                        )}
                        {/* Booking details */}
                        <div className="cbp-booking-details">
                            <div className="cbp-detail-row">
                                <div className="cbp-detail-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg></div>
                                <div className="cbp-detail-content">
                                    <span className="cbp-detail-label">Check-in</span>
                                    <span className="cbp-detail-value">{fmt(checkin)}</span>
                                    <span className="cbp-detail-sub">4:00 PM</span>
                                </div>
                            </div>
                            <div className="cbp-detail-row">
                                <div className="cbp-detail-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                                <div className="cbp-detail-content">
                                    <span className="cbp-detail-label">Check-out</span>
                                    <span className="cbp-detail-value">{fmt(checkout)}</span>
                                    <span className="cbp-detail-sub">11:00 AM</span>
                                </div>
                            </div>
                            <div className="cbp-detail-row">
                                <div className="cbp-detail-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></div>
                                <div className="cbp-detail-content">
                                    <span className="cbp-detail-label">Nights</span>
                                    <span className="cbp-detail-value">{nights} night{nights > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            <div className="cbp-detail-row">
                                <div className="cbp-detail-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                                <div className="cbp-detail-content">
                                    <span className="cbp-detail-label">Guests</span>
                                    <span className="cbp-detail-value">{totalGuests} Guest{totalGuests > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>

                        {/* Price breakdown */}
                        <div className="cbp-price-breakdown">
                            <div className="cbp-price-row">
                                <span>Subtotal</span>
                                <span>{showCurrency} {showAmount.toFixed(2)}</span>
                            </div>
                            <div className="cbp-price-row">
                                <span>Taxes &amp; Fees</span>
                                <span>Included</span>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="cbp-total-section">
                            <div className="cbp-total-row">
                                <div className="cbp-total-label">
                                    <span>Total Amount</span>
                                    <small>Charged today</small>
                                </div>
                                <div className="cbp-total-amount">{showCurrency} {payToday}</div>
                            </div>
                        </div>

                        {/* Support */}
                        <div className="cbp-support-section">
                            <div className="cbp-support-avatar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.11h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <div className="cbp-support-info">
                                <span className="cbp-support-title">Need Help?</span>
                                <span className="cbp-support-text">Contact our 24/7 support team</span>
                            </div>
                            <a href={`mailto:${PARTNER_OPS_EMAIL}`} className="cbp-support-link">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </a>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
