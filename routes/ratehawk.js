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

module.exports = router;
