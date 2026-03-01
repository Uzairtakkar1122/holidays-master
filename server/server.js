const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const PORT = 5000;

// ─── Logo upload ─────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.png';
        // Remove any previously uploaded logo file with a different ext
        const exts = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];
        exts.forEach(e => {
            const old = path.join(UPLOADS_DIR, `site-logo${e}`);
            if (e !== ext && fs.existsSync(old)) fs.unlinkSync(old);
        });
        cb(null, `site-logo${ext}`);
    },
});
const uploadLogo = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// Import Routes
const rateHawkRoutes = require('./routes/ratehawk');

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files (logo etc.) as static — accessible at /uploads/site-logo.*
app.use('/uploads', express.static(UPLOADS_DIR));

// Diagnostic Test Route
app.get('/test', (req, res) => res.json({ status: 'Proxy is running', time: new Date().toISOString() }));

// Logo upload endpoint
app.post('/api/upload-logo', uploadLogo.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
});

// Delete uploaded logo
app.delete('/api/upload-logo', (req, res) => {
    const exts = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];
    exts.forEach(e => {
        const f = path.join(UPLOADS_DIR, `site-logo${e}`);
        if (fs.existsSync(f)) fs.unlinkSync(f);
    });
    res.json({ ok: true });
});

// API Routes
app.use('/api', rateHawkRoutes);
app.use('/', rateHawkRoutes); // Fallback for legacy paths like /wp-json/...

app.listen(PORT, () => {
    console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Forwarding requests to RateHawk API via modular routes\n`);
});
