/**
 * RateHawk API Integration Service
 * 
 * Calls through local proxy server (server.js) which handles
 * authentication and forwards requests to RateHawk SANDBOX API
 */

import { PROXY_API_PATH } from '../constants';

const BASE_URL = PROXY_API_PATH;

class RateHawkService {
    /**
     * Autocomplete Search - Proxied
     * @param {string} query - The search query (minimum 2 characters)
     * @param {string} language - Language code (default: 'en')
     */
    async autocomplete(query, language = 'en') {
        if (!query || query.length < 2) {
            return { hotels: [], regions: [] };
        }

        try {
            const response = await fetch(`${BASE_URL}/autocomplete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    language: language
                })
            });

            if (!response.ok) {
                return { hotels: [], regions: [] };
            }

            const data = await response.json();

            if (data.status === 'error') {
                console.error('[RateHawk] API error:', data.error);
                return { hotels: [], regions: [] };
            }

            return {
                hotels: data.data?.hotels || [],
                regions: data.data?.regions || []
            };
        } catch (error) {
            console.error('[RateHawk] Error:', error.message);
            return { hotels: [], regions: [] };
        }
    }

    /**
     * Hotel Search (Placeholder)
     */
    async startSearch(params) {
        console.log('Search params:', params);
        return { task_id: 'mock-task-id' };
    }
}

export const rateHawkService = new RateHawkService();
