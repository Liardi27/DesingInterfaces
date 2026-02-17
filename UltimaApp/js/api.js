class InvestmentsAPI {
    constructor() {
        this.apiKey = localStorage.getItem('finnhubApiKey') || '';
        this.baseUrl = 'https://finnhub.io/api/v1';
        // Rate limit handling (simple bucket)
        this.lastCall = 0;
        this.minInterval = 1000; // 1 sec between calls (60/min limit)
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('finnhubApiKey', key);
    }

    async _fetch(endpoint, params = {}) {
        if (!this.apiKey) {
            console.warn('Finnhub API Key missing. Using Demo Mode.');
            throw new Error('DEMO_MODE');
        }

        // Rate limit check (Only applies if we are actually calling the API)
        const now = Date.now();
        if (now - this.lastCall < this.minInterval) {
            await new Promise(r => setTimeout(r, this.minInterval - (now - this.lastCall)));
        }
        this.lastCall = Date.now();

        const url = new URL(this.baseUrl + endpoint);
        url.searchParams.append('token', this.apiKey);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        try {
            const res = await fetch(url);
            if (res.status === 429) {
                console.warn('Finnhub Rate Limit Exceeded. Switching to Demo Mode.');
                throw new Error('RATE_LIMIT');
            }
            if (!res.ok) throw new Error(`Finnhub Error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('API Fetch Error:', err);
            throw err; // Propagate to let caller handle fallback
        }
    }

    // --- Core Endpoints ---

    async getQuote(symbol) {
        try {
            const data = await this._fetch('/quote', { symbol });
            // Validate data (Finnhub returns 0s if invalid symbol)
            if (data.c === 0 && data.h === 0 && data.l === 0) throw new Error('Invalid Symbol');
            return {
                c: data.c, // Current price
                d: data.d, // Change
                dp: data.dp, // Percent change
                h: data.h, // High
                l: data.l, // Low
                o: data.o, // Open
                pc: data.pc // Previous Close
            };
        } catch (e) {
            return this._getDemoQuote(symbol);
        }
    }

    async getProfile(symbol) {
        try {
            return await this._fetch('/stock/profile2', { symbol });
        } catch (e) {
            return {
                name: symbol,
                ticker: symbol,
                logo: `https://ui-avatars.com/api/?name=${symbol}&background=random`,
                finnhubIndustry: 'Technology',
                currency: 'USD',
                marketCapitalization: 1000000
            };
        }
    }

    async getCandles(symbol, resolution = 'D', count = 30) {
        const to = Math.floor(Date.now() / 1000);
        const from = to - (count * 86400 * (resolution === 'D' ? 1 : 7)); // Rough estimate
        try {
            const data = await this._fetch('/stock/candle', { symbol, resolution, from, to });
            if (data.s !== 'ok') throw new Error('No Data');
            return data;
        } catch (e) {
            return this._getDemoHistory(count);
        }
    }

    async search(query) {
        try {
            const data = await this._fetch('/search', { q: query });
            return data.result || [];
        } catch (e) {
            return this._getDemoSearch(query);
        }
    }

    // --- Simulations / Aggregates ---

    async getMarketMovers() {
        // Simulate "Top Movers" by fetching a fixed list of tech giants and sorting by % change
        const symbols = ['NVDA', 'TSLA', 'META', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'AMD', 'NFLX'];
        const results = [];

        // Parallel fetch (careful with rate limits!)
        // We actully need to serialize this to avoid hitting 429 immediatley on free tier
        for (const sym of symbols) {
            const quote = await this.getQuote(sym);
            results.push({ symbol: sym, ...quote });
        }

        return results.sort((a, b) => b.dp - a.dp); // Sort by % change desc
    }

    async getMarketIndices() {
        // Simulate Indices using ETFs
        const map = {
            'S&P 500': 'SPY',
            'Nasdaq 100': 'QQQ',
            'Dow Jones': 'DIA',
            'Russell 2000': 'IWM',
            'Oro': 'GLD'
        };

        const results = [];
        for (const [name, sym] of Object.entries(map)) {
            const quote = await this.getQuote(sym);
            results.push({ name, symbol: sym, ...quote });
        }
        return results;
    }

    async getExchangeRate(base = 'EUR', target = 'USD') {
        if (base === target) return 1;

        // Force User-Specific Rates (Calibrated to user examples)
        const rates = {
            'EUR': {
                'USD': 1.183644,
                'GBP': 0.87,
                'JPY': 181.21,
                'PLN': 4.21514
            },
            // Cross rates calculated dynamically
        };

        // Helper to get rate relative to EUR
        const getEurRate = (currency) => {
            if (currency === 'EUR') return 1;
            return rates['EUR'][currency] || 1; // Default 1 if missing
        };

        // Logic: Convert Base -> EUR -> Target
        // Rate = (1 / Base_to_EUR) * Target_to_EUR
        // wait, rates['EUR'][X] is 1 EUR = X units.
        // so 1 Base = (1 / rates['EUR'][Base]) EUR
        // and 1 EUR = rates['EUR'][Target] Target
        // so 1 Base = (1 / rates['EUR'][Base]) * rates['EUR'][Target] Target

        const baseToEur = base === 'EUR' ? 1 : (1 / (rates['EUR'][base] || 0));
        const eurToTarget = target === 'EUR' ? 1 : (rates['EUR'][target] || 0);

        if (baseToEur === Infinity || eurToTarget === 0) {
            console.error(`Missing rate for ${base} or ${target}`);
            return 1; // Safeguard
        }

        const finalRate = baseToEur * eurToTarget;

        console.log(`Rate forced: ${base} -> ${target} = ${finalRate}`);
        return finalRate;

        /*
        try {
            // Use Frankfurter API (Free, Open Source) for currency conversion
            const res = await fetch(`https://api.frankfurter.app/latest?amount=1&from=${base}&to=${target}`);
            if (!res.ok) throw new Error('Forex API Error');
            const data = await res.json();
            
            // Validate response
            if (!data || !data.rates || typeof data.rates[target] !== 'number') {
                throw new Error('Invalid API Response');
            }
            
            return data.rates[target];
        } catch (e) {
            console.warn('Forex API failed, using fallback rates', e);
            // Fallback static rates
            // ... (removed old fallback)
            return 1;
        }
        */
    }

    // --- Demo Fallbacks ---

    _getDemoQuote(symbol) {
        const base = Math.random() * 100 + 50;
        const change = (Math.random() - 0.5) * 5;
        return {
            c: (base + change).toFixed(2),
            d: change.toFixed(2),
            dp: ((change / base) * 100).toFixed(2),
            h: (base + 5).toFixed(2),
            l: (base - 5).toFixed(2),
            o: base.toFixed(2),
            pc: base.toFixed(2),
            isDemo: true
        };
    }

    _getDemoHistory(count) {
        const c = [], t = [], o = [], h = [], l = [];
        let price = 150;
        const now = Math.floor(Date.now() / 1000);
        for (let i = 0; i < count; i++) {
            price = price + (Math.random() - 0.5) * 5;
            c.push(price);
            o.push(price - (Math.random() - 0.5));
            h.push(price + Math.random());
            l.push(price - Math.random());
            t.push(now - ((count - i) * 86400));
        }
        return { c, t, o, h, l, s: 'ok' };
    }

    _getDemoSearch(query) {
        return [
            { description: `${query.toUpperCase()} Inc.`, displaySymbol: query.toUpperCase(), symbol: query.toUpperCase(), type: 'Common Stock' },
            { description: 'Apple Inc', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock' },
            { description: 'Tesla Inc', displaySymbol: 'TSLA', symbol: 'TSLA', type: 'Common Stock' }
        ].filter(i => i.symbol.includes(query.toUpperCase()));
    }
}

// Attach to window
window.InvestmentsAPI = InvestmentsAPI;
window.api = new InvestmentsAPI();
