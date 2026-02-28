const express = require('express');
const https = require('https');
const router = express.Router();

const API_ID = process.env.RATEHAWK_API_ID;
const API_KEY = process.env.RATEHAWK_API_KEY;
const API_HOST = process.env.RATEHAWK_API_HOST || 'api.worldota.net';

function assertRateHawkConfig(res) {
    if (!API_ID || !API_KEY) {
        res.status(500).json({
            error: 'RateHawk credentials are not configured on the server',
            hint: 'Set RATEHAWK_API_ID and RATEHAWK_API_KEY in your environment (copy .env.example to .env)'
        });
        return false;
    }
    return true;
}

// Autocomplete Endpoint
router.post('/autocomplete', (req, res) => {
    if (!assertRateHawkConfig(res)) return;
    const { query, language = 'en' } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const data = JSON.stringify({
        query,
        language
    });

    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');

    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/search/multicomplete/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': `Basic ${auth}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => body += chunk);
        apiRes.on('end', () => {
            try {
                const jsonData = JSON.parse(body);
                res.status(apiRes.statusCode).json(jsonData);
            } catch (e) {
                res.status(500).json({ error: 'Invalid response from API' });
            }
        });
    });

    apiReq.on('error', (e) => res.status(500).json({ error: 'Failed to connect to RateHawk API' }));
    apiReq.write(data);
    apiReq.end();
});

// Geo Search Endpoint (nearby hotels by lat/lon)
router.post('/geo-search', handleGeoSearch);

async function handleGeoSearch(req, res) {
    if (!assertRateHawkConfig(res)) return;
    const {
        checkin, checkout,
        residency = 'gb', language = 'en', currency = 'USD',
        guests, latitude, longitude,
        radius = 5000, limit = 25
    } = req.body;

    if (!checkin || !checkout || latitude == null || longitude == null) {
        return res.status(400).json({ error: 'Missing required params: checkin, checkout, latitude, longitude' });
    }

    const payload = {
        checkin, checkout,
        residency, language, currency,
        guests: guests || [{ adults: 2, children: [] }],
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: Number(radius),
        limit: Number(limit)
    };

    console.log('📍 Geo Search payload:', JSON.stringify(payload, null, 2));

    const data = JSON.stringify(payload);
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');

    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/search/serp/geo/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Basic ${auth}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => body += chunk);
        apiRes.on('end', () => {
            try {
                const jsonData = JSON.parse(body);
                console.log('✅ Geo Search - Hotels found:', jsonData?.data?.hotels?.length || 0);
                res.status(apiRes.statusCode).json(jsonData);
            } catch (e) {
                res.status(500).json({ error: 'Invalid response from API' });
            }
        });
    });

    apiReq.on('error', (e) => res.status(500).json({ error: 'Failed to connect to RateHawk API' }));
    apiReq.write(data);
    apiReq.end();
}

// Region Search (Pricing) Endpoint
router.post('/search', handleRegionSearch);

// Legacy PHP path compatibility
router.post('/wp-json/ratehawk/v1/search', handleRegionSearch);

async function handleRegionSearch(req, res) {
    if (!assertRateHawkConfig(res)) return;
    const { checkin, checkout, residency, language = 'en', currency, guests, region_id } = req.body;

    // Validate requirements
    if (!checkin || !checkout || !region_id) {
        return res.status(400).json({ error: 'Missing required search parameters' });
    }

    const payload = {
        checkin,
        checkout,
        residency: residency || 'gb',
        language,
        currency: currency || 'USD',
        guests: guests || [{ adults: 2, children: [] }],
        region_id: parseInt(region_id)
    };

    // Log what we're sending to RateHawk
    console.log('🔍 Sending to RateHawk API:', JSON.stringify(payload, null, 2));

    const data = JSON.stringify(payload);
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');

    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/search/serp/region/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': `Basic ${auth}`
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => body += chunk);
        apiRes.on('end', () => {
            try {
                const jsonData = JSON.parse(body);

                // Log what currency RateHawk actually returned
                const firstHotel = jsonData?.data?.hotels?.[0];
                const returnedCurrency = firstHotel?.rates?.[0]?.payment_options?.payment_types?.[0]?.show_currency_code;
                console.log('✅ RateHawk Response - Hotels:', jsonData?.data?.hotels?.length || 0, '| Returned Currency:', returnedCurrency || 'N/A');

                res.status(apiRes.statusCode).json(jsonData);
            } catch (e) {
                res.status(500).json({ error: 'Invalid response from API' });
            }
        });
    });

    apiReq.on('error', (e) => res.status(500).json({ error: 'Failed to connect' }));
    apiReq.write(data);
    apiReq.end();
}

// Hotel Info Endpoint → /api/b2b/v3/hotel/info/
router.post('/hotel-info', (req, res) => {
    if (!assertRateHawkConfig(res)) return;
    const { id, language = 'en' } = req.body;
    if (!id) return res.status(400).json({ error: 'hotel id is required' });

    const data = JSON.stringify({ id, language });
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');
    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/hotel/info/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Basic ${auth}`
        }
    };
    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
            try { res.status(apiRes.statusCode).json(JSON.parse(body)); }
            catch (e) { res.status(500).json({ error: 'Invalid response from API' }); }
        });
    });
    apiReq.on('error', () => res.status(500).json({ error: 'Failed to connect to RateHawk API' }));
    apiReq.write(data);
    apiReq.end();
});

// Hotel Page Pricing Endpoint → /api/b2b/v3/search/hp/
router.post('/hotel-hp', (req, res) => {
    if (!assertRateHawkConfig(res)) return;
    const { id, checkin, checkout, guests, residency = 'gb', language = 'en', currency = 'USD' } = req.body;
    if (!id || !checkin || !checkout) return res.status(400).json({ error: 'id, checkin and checkout are required' });

    const data = JSON.stringify({ id, checkin, checkout, guests: guests || [{ adults: 2, children: [] }], residency, language, currency });
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');
    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/search/hp/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Basic ${auth}`
        }
    };
    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
            try { res.status(apiRes.statusCode).json(JSON.parse(body)); }
            catch (e) { res.status(500).json({ error: 'Invalid response from API' }); }
        });
    });
    apiReq.on('error', () => res.status(500).json({ error: 'Failed to connect to RateHawk API' }));
    apiReq.write(data);
    apiReq.end();
});

// Hotel Prebook Endpoint → /api/b2b/v3/hotel/prebook/
router.post('/hotel-prebook', (req, res) => {
    if (!assertRateHawkConfig(res)) return;
    const { hash, price_increase_percent = 20 } = req.body;
    if (!hash) return res.status(400).json({ error: 'hash is required' });

    const data = JSON.stringify({ hash, price_increase_percent });
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');
    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/hotel/prebook/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Basic ${auth}`
        }
    };
    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
            try { res.status(apiRes.statusCode).json(JSON.parse(body)); }
            catch (e) { res.status(500).json({ error: 'Invalid response from API' }); }
        });
    });
    apiReq.on('error', () => res.status(500).json({ error: 'Failed to connect to RateHawk API' }));
    apiReq.write(data);
    apiReq.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING FLOW ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// Hotel Booking Form → /api/b2b/v3/hotel/order/booking/form/
// Equivalent of WP: /wp-json/ratehawk/v1/hotel-booking-form
router.post('/hotel-booking-form', (req, res) => {
    if (!assertRateHawkConfig(res)) return;
    const { partner_order_id, book_hash, language = 'en', user_ip } = req.body;
    if (!partner_order_id || !book_hash) {
        return res.status(400).json({ status: 'error', message: 'Missing required field: partner_order_id or book_hash' });
    }
    const payload = { partner_order_id, book_hash, language };
    if (user_ip) payload.user_ip = user_ip;
    const data = JSON.stringify(payload);
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');
    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/hotel/order/booking/form/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Basic ${auth}`
        }
    };
    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(body);
                console.log('📋 Booking Form - status:', apiRes.statusCode, '| error:', json?.error);
                res.status(apiRes.statusCode).json({ status: apiRes.statusCode === 200 ? 'success' : 'error', data: json });
            } catch (e) { res.status(500).json({ status: 'error', message: 'Invalid response from API' }); }
        });
    });
    apiReq.on('error', () => res.status(500).json({ status: 'error', message: 'Failed to connect to RateHawk API' }));
    apiReq.write(data);
    apiReq.end();
});

// Create Card Token → Payota API: /api/public/v1/manage/init_partners
// Equivalent of WP: /wp-json/payota/v1/create-card-token
router.post('/create-card-token', (req, res) => {
    if (!assertRateHawkConfig(res)) return;
    const params = req.body;
    const required = ['object_id', 'pay_uuid', 'init_uuid', 'user_first_name', 'user_last_name', 'is_cvc_required', 'credit_card_data_core'];
    for (const field of required) {
        if (!params[field] && params[field] !== false) {
            return res.status(400).json({ status: 'error', message: `Missing required field: ${field}` });
        }
    }
    const ccFields = ['card_number', 'card_holder', 'month', 'year'];
    for (const f of ccFields) {
        if (!params.credit_card_data_core[f]) {
            return res.status(400).json({ status: 'error', message: `Missing credit card field: ${f}` });
        }
    }
    const data = JSON.stringify(params);
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');
    const options = {
        hostname: 'api.payota.net',
        path: '/api/public/v1/manage/init_partners',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Basic ${auth}`
        }
    };
    console.log('💳 Card Token Request - object_id:', params.object_id, '| pay_uuid:', params.pay_uuid);
    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(body);
                console.log('💳 Card Token Response - status:', apiRes.statusCode, '| body:', body.substring(0, 200));
                if (apiRes.statusCode !== 200) {
                    return res.status(apiRes.statusCode).json({ status: 'error', message: json?.message || 'API request failed', code: json?.code });
                }
                res.status(200).json({ status: 'success', data: json });
            } catch (e) { res.status(500).json({ status: 'error', message: 'Invalid response from Payota API' }); }
        });
    });
    apiReq.on('error', () => res.status(500).json({ status: 'error', message: 'Failed to connect to Payota API' }));
    apiReq.write(data);
    apiReq.end();
});

// Start Booking Process (Booking Finish) → /api/b2b/v3/hotel/order/booking/finish/
// Equivalent of WP: /wp-json/ratehawk/v1/start-booking-process
router.post('/start-booking-process', (req, res) => {
    if (!assertRateHawkConfig(res)) return;
    const params = req.body;
    const required = ['language', 'payment_type', 'rooms', 'user', 'partner'];
    for (const field of required) {
        if (!params[field]) {
            return res.status(400).json({ status: 'error', message: `Missing required field: ${field}` });
        }
    }
    if (!params.payment_type.type || !params.payment_type.amount || !params.payment_type.currency_code) {
        return res.status(400).json({ status: 'error', message: "Missing fields inside 'payment_type'" });
    }
    if (!Array.isArray(params.rooms) || params.rooms.length === 0) {
        return res.status(400).json({ status: 'error', message: "'rooms' must be a non-empty array" });
    }
    const data = JSON.stringify(params);
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');
    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/hotel/order/booking/finish/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Basic ${auth}`
        }
    };
    console.log('🏨 Booking Finish - partner_order_id:', params.partner?.partner_order_id);
    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(body);
                console.log('🏨 Booking Finish Response - status:', apiRes.statusCode, '| full:', JSON.stringify(json).substring(0, 400));
                res.status(apiRes.statusCode).json({ status: apiRes.statusCode === 200 ? 'success' : 'error', data: json });
            } catch (e) { res.status(500).json({ status: 'error', message: 'Invalid response from API' }); }
        });
    });
    apiReq.on('error', () => res.status(500).json({ status: 'error', message: 'Failed to connect to RateHawk API' }));
    apiReq.write(data);
    apiReq.end();
});

// Booking Status Polling → /api/b2b/v3/hotel/order/status/
// Equivalent of WP: /wp-json/ratehawk/v1/booking-status
router.post('/booking-status', (req, res) => {
    if (!assertRateHawkConfig(res)) return;
    const { partner_order_id } = req.body;
    if (!partner_order_id) {
        return res.status(400).json({ status: 'error', message: 'Missing required field: partner_order_id' });
    }
    const data = JSON.stringify({ partner_order_id });
    const auth = Buffer.from(`${API_ID}:${API_KEY}`).toString('base64');
    const options = {
        hostname: API_HOST,
        path: '/api/b2b/v3/hotel/order/status/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Basic ${auth}`
        }
    };
    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(body);
                console.log('📊 Booking Status - order:', partner_order_id, '| full:', JSON.stringify(json).substring(0, 400));
                res.status(apiRes.statusCode).json({ status: apiRes.statusCode === 200 ? 'success' : 'error', data: json });
            } catch (e) { res.status(500).json({ status: 'error', message: 'Invalid response from API' }); }
        });
    });
    apiReq.on('error', () => res.status(500).json({ status: 'error', message: 'Failed to connect to RateHawk API' }));
    apiReq.write(data);
    apiReq.end();
});

module.exports = router;
