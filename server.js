const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = 5000;

// Import Routes
const rateHawkRoutes = require('./routes/ratehawk');

// Middleware
app.use(cors());
app.use(express.json());

// Diagnostic Test Route
app.get('/test', (req, res) => res.json({ status: 'Proxy is running', time: new Date().toISOString() }));

// API Routes
app.use('/api', rateHawkRoutes);
app.use('/', rateHawkRoutes); // Fallback for legacy paths like /wp-json/...

app.listen(PORT, () => {
    console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Forwarding requests to RateHawk API via modular routes\n`);
});
