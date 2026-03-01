import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSiteBrand } from '../../context/SiteBrandContext';
import { useThemeCustom, THEME_DEFAULTS } from '../../context/ThemeCustomContext';
import { REGION_ID_MAPPING } from '../../data/regionIdMapping';
import {
    LayoutDashboard, MousePointerClick, BookOpen, Megaphone,
    MapPin, Menu, Check, Eye, EyeOff, Save,
    Image, ToggleLeft, ToggleRight, PlusCircle, Trash2,
    ChevronRight, Globe, Bell, LogOut, Palette, RotateCcw, AlignLeft
} from 'lucide-react';

// ─── localStorage helpers ─────────────────────────────────────────────────────
const load = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const persist = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
};

// ─── Region ID auto-resolve ───────────────────────────────────────────────────
const slugify = (v) => String(v || '').toLowerCase().trim()
    .split(',')[0].trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const resolveRegion = (title) => {
    const key = slugify(title);
    return REGION_ID_MAPPING[key] || null;
};

// ─── Sidebar sections config ──────────────────────────────────────────────────
const NAV = [
    { id: 'overview',      label: 'Overview',            icon: LayoutDashboard },
    { id: 'branding',      label: 'Site Branding',        icon: Globe },
    { id: 'theme',         label: 'Theme & Colours',      icon: Palette },
    { id: 'popup',         label: 'First Visitor Popup', icon: MousePointerClick },
    { id: 'about',         label: 'About Us Page',       icon: BookOpen },
    { id: 'noticebar',     label: 'Notice Bar',           icon: Bell },
    { id: 'hero',          label: 'Hero Banner',          icon: Image },
    { id: 'destinations',  label: 'Featured Places',      icon: MapPin },
    { id: 'footer',         label: 'Footer Content',       icon: AlignLeft },
];

// ─── Shared UI primitives ─────────────────────────────────────────────────────
const SaveBar = ({ onSave, saved }) => (
    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 mb-6">
        <span className="text-sm text-slate-500 dark:text-slate-400">Changes apply site-wide instantly after saving.</span>
        <button onClick={onSave}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all shadow-sm">
            {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
        </button>
    </div>
);
const Field = ({ label, hint, children }) => (
    <div className="mb-5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
        {children}
    </div>
);
const Input = ({ className = '', ...props }) => (
    <input {...props} className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/80 transition-all ${className}`} />
);
const Textarea = ({ className = '', ...props }) => (
    <textarea {...props} className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/80 transition-all resize-none ${className}`} />
);
const Toggle = ({ value, onChange, label }) => (
    <button onClick={() => onChange(!value)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-sm font-semibold ${value
            ? 'bg-accent/10 border-accent/30 text-accent dark:bg-accent/10 dark:border-accent/40 dark:text-accent'
            : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
        {value ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        {value ? `${label}: ON` : `${label}: OFF`}
    </button>
);
const ColorPicker = ({ value, onChange }) => (
    <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0" />
        <Input value={value} onChange={e => onChange(e.target.value)} className="flex-1" />
    </div>
);
const Card = ({ title, children }) => (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 mb-5 shadow-sm">
        {title && <h3 className="text-base font-black text-slate-800 dark:text-white mb-4">{title}</h3>}
        {children}
    </div>
);

// ─── Overview ─────────────────────────────────────────────────────────────────
const OverviewSection = ({ user, setActive }) => {
    const popup  = load('hm_visitor_popup', { enabled: false });
    const notice = load('hm_notice_bar',    { enabled: false });
    const stats  = [
        { label: 'First Visitor Popup', active: popup.enabled,  section: 'popup' },
        { label: 'Notice Bar',           active: notice.enabled, section: 'noticebar' },
    ];
    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {stats.map(s => (
                    <button key={s.label} onClick={() => setActive(s.section)}
                        className="bg-card-bg border border-card-border rounded-2xl p-5 text-left hover:shadow-md transition-all group">
                        <div className={`text-xs font-black uppercase tracking-widest mb-1 ${s.active ? 'text-accent' : 'text-slate-400'}`}>
                            {s.active ? '● LIVE' : '○ OFF'}
                        </div>
                        <div className="text-base font-bold text-slate-800 dark:text-white group-hover:text-primary">{s.label}</div>
                        <div className="text-xs text-blue-500 mt-2 flex items-center gap-1">Edit <ChevronRight size={12} /></div>
                    </button>
                ))}
                <div className="bg-card-bg border border-card-border rounded-2xl p-5">
                    <div className="text-xs font-black uppercase tracking-widest mb-1 text-primary">LOGGED IN AS</div>
                    <div className="text-base font-bold text-slate-800 dark:text-white truncate">{user?.given_name || user?.name}</div>
                    <div className="text-xs text-slate-400 mt-1 truncate">{user?.email}</div>
                </div>
            </div>
            <Card title="All Sections">
                <div className="grid grid-cols-2 gap-3">
                    {NAV.filter(n => n.id !== 'overview').map(n => (
                        <button key={n.id} onClick={() => setActive(n.id)}
                            className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 dark:hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-left group">
                            <n.icon size={17} className="text-primary flex-shrink-0" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary">{n.label}</span>
                        </button>
                    ))}
                </div>
            </Card>
        </div>
    );
};

// ─── Site Branding ───────────────────────────────────────────────────────────
const BrandingSection = () => {
    const { brand, updateBrand } = useSiteBrand();
    const [form, setForm] = useState({ siteName: brand.siteName, logoUrl: brand.logoUrl });
    const [saved, setSaved] = useState(false);
    const [logoMode, setLogoMode] = useState('url'); // 'url' | 'upload'
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileRef = useRef(null);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = () => {
        updateBrand(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadError('');
        setUploading(true);
        try {
            const data = new FormData();
            data.append('logo', file);
            const res = await fetch('/api/upload-logo', { method: 'POST', body: data });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Upload failed');
            set('logoUrl', `${json.url}?v=${Date.now()}`);
        } catch (err) {
            setUploadError(err.message);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleRemoveLogo = async () => {
        try { await fetch('/api/upload-logo', { method: 'DELETE' }); } catch {}
        set('logoUrl', '');
    };

    const TabBtn = ({ id, label }) => (
        <button
            onClick={() => setLogoMode(id)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${logoMode === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {label}
        </button>
    );

    return (
        <div>
            <SaveBar onSave={handleSave} saved={saved} />
            <Card title="Website Identity">
                <Field label="Website Name" hint="Displayed in the navbar and browser tab.">
                    <Input
                        value={form.siteName}
                        onChange={e => set('siteName', e.target.value)}
                        placeholder="e.g. LuxStay"
                    />
                </Field>

                <Field label="Logo">
                    {/* Mode tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 w-full max-w-xs">
                        <TabBtn id="url" label="🔗 Paste URL" />
                        <TabBtn id="upload" label="⬆ Upload File" />
                    </div>

                    {logoMode === 'url' ? (
                        <Input
                            value={form.logoUrl}
                            onChange={e => set('logoUrl', e.target.value)}
                            placeholder="https://yourdomain.com/logo.png"
                        />
                    ) : (
                        <div>
                            <label className={`flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all
                                ${uploading
                                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                {uploading ? (
                                    <span className="text-sm text-primary font-semibold animate-pulse">Uploading…</span>
                                ) : (
                                    <>
                                        <Image size={24} className="text-slate-400" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400">Click to choose an image</span>
                                        <span className="text-xs text-slate-400">PNG, JPG, SVG, WEBP — max 5 MB</span>
                                    </>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                            </label>
                            {uploadError && (
                                <p className="mt-2 text-xs text-red-500 font-semibold">{uploadError}</p>
                            )}
                            <p className="mt-2 text-xs text-slate-400">
                                Saved as <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">public/assets/site-logo.*</span> and served as a static URL automatically.
                            </p>
                        </div>
                    )}

                    {/* Preview + remove */}
                    {form.logoUrl && (
                        <div className="mt-4 flex items-center gap-4">
                            <img
                                src={form.logoUrl}
                                alt="Logo preview"
                                className="h-12 object-contain rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800"
                                onError={e => e.target.style.display = 'none'}
                            />
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Current logo</p>
                                <button
                                    onClick={handleRemoveLogo}
                                    className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                                    <Trash2 size={12} /> Remove logo
                                </button>
                            </div>
                        </div>
                    )}
                </Field>
            </Card>

            <Card title="Navbar Preview">
                <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-5 py-4">
                    {form.logoUrl ? (
                        <img
                            src={form.logoUrl}
                            alt={form.siteName || 'Logo'}
                            className="w-8 h-8 object-contain rounded"
                            onError={e => e.target.style.display = 'none'}
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-tr-xl rounded-bl-xl bg-white text-slate-900 flex items-center justify-center">
                            <span className="font-bold text-lg">{(form.siteName || 'L')[0]}</span>
                        </div>
                    )}
                    <span className="text-2xl font-serif font-bold tracking-tight text-white">
                        {form.siteName || 'LuxStay'}
                    </span>
                </div>
            </Card>
        </div>
    );
};

// ─── Theme & Colours ──────────────────────────────────────────────────────────
const ThemeSection = () => {
    const { custom, updateCustom, resetCustom } = useThemeCustom();
    const [form, setForm] = useState({ ...custom });
    const [saved, setSaved] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = () => {
        updateCustom(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };
    const handleReset = () => {
        setForm({ ...THEME_DEFAULTS });
        resetCustom();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const CP = ({ label, hint, k }) => (
        <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
            <div className="flex items-center gap-3">
                <input type="color" value={form[k]} onChange={e => set(k, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0" />
                <input value={form[k]} onChange={e => set(k, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/80 transition-all font-mono text-sm" />
            </div>
        </div>
    );

    return (
        <div>
            {/* Save bar with reset */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 mb-6">
                <span className="text-sm text-slate-500 dark:text-slate-400">Changes apply site-wide instantly after saving.</span>
                <div className="flex items-center gap-2">
                    <button onClick={handleReset}
                        className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-600 text-sm font-bold px-4 py-2 rounded-xl transition-all">
                        <RotateCcw size={14} /> Reset to Defaults
                    </button>
                    <button onClick={handleSave}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all shadow-sm">
                        {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* Brand colours */}
            <Card title="Brand Colours">
                <p className="text-xs text-slate-400 mb-4">Used for buttons, active nav items, links and interactive highlights across the site.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CP label="Primary Colour" hint="Buttons, active states, focus rings" k="primary" />
                    <CP label="Accent / CTA Colour" hint="Sign-in button, hover highlights" k="accent" />
                </div>
            </Card>

            {/* Navbar */}
            <Card title="Navbar">
                <p className="text-xs text-slate-400 mb-4">Applied when the user scrolls down or is on a hotel/search page.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CP label="Background — Light Mode" k="navBgLight" />
                    <CP label="Background — Dark Mode"  k="navBgDark" />
                    <CP label="Text — Light Mode"       k="navTextLight" />
                    <CP label="Text — Dark Mode"        k="navTextDark" />
                </div>
            </Card>

            {/* Footer */}
            <Card title="Footer">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CP label="Background — Light Mode"   k="footerBgLight" />
                    <CP label="Background — Dark Mode"    k="footerBgDark" />
                    <CP label="Body Text — Light Mode"    k="footerTextLight" />
                    <CP label="Body Text — Dark Mode"     k="footerTextDark" />
                    <CP label="Headings — Light Mode"     k="footerHeadingLight" />
                    <CP label="Headings — Dark Mode"      k="footerHeadingDark" />
                    <CP label="Border / Divider — Light"  k="footerBorderLight" />
                    <CP label="Border / Divider — Dark"   k="footerBorderDark" />
                </div>
            </Card>

            {/* Page background */}
            <Card title="Page Background">
                <p className="text-xs text-slate-400 mb-4">The main background colour behind all page content.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CP label="Background — Light Mode" k="pageBgLight" />
                    <CP label="Background — Dark Mode"  k="pageBgDark" />
                </div>
            </Card>

            {/* Cards & Panels */}
            <Card title="Cards & Panels">
                <p className="text-xs text-slate-400 mb-4">Hotel cards, search result cards, and info panels.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CP label="Card Background — Light" k="cardBgLight" />
                    <CP label="Card Background — Dark"  k="cardBgDark" />
                    <CP label="Card Border — Light"     k="cardBorderLight" />
                    <CP label="Card Border — Dark"      k="cardBorderDark" />
                </div>
            </Card>

            {/* Admin Sidebar */}
            <Card title="Admin Sidebar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CP label="Sidebar Background — Light" k="sidebarBgLight" />
                    <CP label="Sidebar Background — Dark"  k="sidebarBgDark" />
                </div>
            </Card>

            {/* Live mini preview */}
            <Card title="Live Preview">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-xs">
                    {/* Mock navbar */}
                    <div className="flex items-center justify-between px-4 py-2.5"
                        style={{ backgroundColor: form.navBgLight, color: form.navTextLight }}>
                        <span className="font-bold text-base">🏨 YourSite</span>
                        <div className="flex gap-3 font-semibold opacity-80">
                            <span>Hotels</span><span>About</span>
                            <span className="px-2 py-0.5 rounded-full text-white text-xs"
                                style={{ backgroundColor: form.accent }}>Sign In</span>
                        </div>
                    </div>
                    {/* Mock page */}
                    <div className="px-4 py-4" style={{ backgroundColor: form.pageBgLight }}>
                        <div className="rounded-lg border p-3 mb-2"
                            style={{ backgroundColor: form.cardBgLight, borderColor: form.cardBorderLight }}>
                            <div className="font-bold mb-1" style={{ color: form.navTextLight }}>Hotel Card</div>
                            <button className="text-white text-xs px-3 py-1 rounded-full"
                                style={{ backgroundColor: form.primary }}>Book Now</button>
                        </div>
                    </div>
                    {/* Mock footer */}
                    <div className="px-4 py-2.5" style={{ backgroundColor: form.footerBgLight, color: form.footerTextLight }}>
                        <span className="font-bold" style={{ color: form.footerHeadingLight }}>Company</span>
                        <span className="ml-4">About · Support · Destinations</span>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">* Preview shows light mode colours.</p>
            </Card>
        </div>
    );
};

// ─── First Visitor Popup ──────────────────────────────────────────────────────
const DEFAULT_POPUP = {
    enabled: false, title: 'Welcome to LuxStay 🌟',
    message: "Discover the world's finest hotels at unbeatable prices. Sign up and get 10% off your first booking!",
    ctaText: 'Explore Hotels', ctaLink: '/hotels',
    bgColor: '#1e293b', textColor: '#ffffff', showOnce: true,
};
const PopupSection = () => {
    const [form, setForm] = useState(() => load('hm_visitor_popup', DEFAULT_POPUP));
    const [saved, setSaved] = useState(false);
    const [preview, setPreview] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = () => { persist('hm_visitor_popup', form); setSaved(true); setTimeout(() => setSaved(false), 2500); };
    return (
        <div>
            <SaveBar onSave={handleSave} saved={saved} />
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <Toggle value={form.enabled} onChange={v => set('enabled', v)} label="Popup" />
                    <button onClick={() => setPreview(p => !p)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl transition-all">
                        {preview ? <EyeOff size={15} /> : <Eye size={15} />} {preview ? 'Hide' : 'Preview'}
                    </button>
                </div>
                <Field label="Popup Title"><Input value={form.title} onChange={e => set('title', e.target.value)} /></Field>
                <Field label="Message"><Textarea rows={3} value={form.message} onChange={e => set('message', e.target.value)} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Button Text"><Input value={form.ctaText} onChange={e => set('ctaText', e.target.value)} /></Field>
                    <Field label="Button Link" hint="e.g. /hotels or /search"><Input value={form.ctaLink} onChange={e => set('ctaLink', e.target.value)} /></Field>
                    <Field label="Background Colour"><ColorPicker value={form.bgColor} onChange={v => set('bgColor', v)} /></Field>
                    <Field label="Text Colour"><ColorPicker value={form.textColor} onChange={v => set('textColor', v)} /></Field>
                </div>
                <Field label="Show Behaviour">
                    <Toggle value={form.showOnce} onChange={v => set('showOnce', v)} label="Show only once per visitor" />
                </Field>
            </Card>
            {preview && (
                <Card title="Preview">
                    <div className="rounded-2xl overflow-hidden p-8 text-center" style={{ backgroundColor: form.bgColor }}>
                        <h2 className="text-2xl font-black mb-3" style={{ color: form.textColor }}>{form.title || 'Title'}</h2>
                        <p className="text-sm mb-6 opacity-80" style={{ color: form.textColor }}>{form.message}</p>
                        <span className="inline-block bg-white text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm">{form.ctaText}</span>
                    </div>
                </Card>
            )}
        </div>
    );
};

// ─── About Us Page ────────────────────────────────────────────────────────────
const DEFAULT_ABOUT = {
    heroImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80',
    heroTitle: 'We Are LuxStay', heroSubtitle: 'Curating unforgettable travel experiences since 2020.',
    mission: "Our mission is to connect travellers with the world's finest hotels at the best prices.",
    body: "LuxStay was founded by a team of passionate travellers who believed great accommodation should be easy to find.\n\nWe partner with thousands of hotels across the globe and use cutting-edge technology to surface the perfect stay.",
    teamMembers: [
        { name: 'Alex Rahman', role: 'CEO & Founder', photo: '' },
        { name: 'Sara Malik',  role: 'Head of Partnerships', photo: '' },
    ],
    ctaText: 'Browse Hotels', ctaLink: '/hotels',
};
const AboutSection = () => {
    const [form, setForm] = useState(() => load('hm_about_page', DEFAULT_ABOUT));
    const [saved, setSaved] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = () => { persist('hm_about_page', form); setSaved(true); setTimeout(() => setSaved(false), 2500); };
    const setMember = (i, k, v) => { const a = [...form.teamMembers]; a[i] = { ...a[i], [k]: v }; set('teamMembers', a); };
    return (
        <div>
            <SaveBar onSave={handleSave} saved={saved} />
            <Card title="Hero Section">
                <Field label="Hero Image URL" hint="Paste a full URL (Unsplash recommended)">
                    <Input value={form.heroImage} onChange={e => set('heroImage', e.target.value)} placeholder="https://..." />
                    {form.heroImage && <img src={form.heroImage} alt="" className="mt-3 w-full h-32 object-cover rounded-xl" onError={e => e.target.style.display='none'} />}
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Headline"><Input value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)} /></Field>
                    <Field label="Subtitle"><Input value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} /></Field>
                </div>
            </Card>
            <Card title="Content">
                <Field label="Mission Statement" hint="Shown prominently — keep it one sentence.">
                    <Textarea rows={2} value={form.mission} onChange={e => set('mission', e.target.value)} />
                </Field>
                <Field label="Body Text" hint="Blank line between paragraphs.">
                    <Textarea rows={6} value={form.body} onChange={e => set('body', e.target.value)} />
                </Field>
            </Card>
            <Card title="Call to Action">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Button Text"><Input value={form.ctaText} onChange={e => set('ctaText', e.target.value)} /></Field>
                    <Field label="Button Link"><Input value={form.ctaLink} onChange={e => set('ctaLink', e.target.value)} /></Field>
                </div>
            </Card>
            <Card title="Team Members">
                {form.teamMembers.map((m, i) => (
                    <div key={i} className="flex gap-3 mb-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Name"><Input value={m.name} onChange={e => setMember(i, 'name', e.target.value)} /></Field>
                            <Field label="Role"><Input value={m.role} onChange={e => setMember(i, 'role', e.target.value)} /></Field>
                            <Field label="Photo URL"><Input value={m.photo} onChange={e => setMember(i, 'photo', e.target.value)} placeholder="https://..." /></Field>
                        </div>
                        <button onClick={() => set('teamMembers', form.teamMembers.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 mt-6 flex-shrink-0"><Trash2 size={16} /></button>
                    </div>
                ))}
                <button onClick={() => set('teamMembers', [...form.teamMembers, { name: '', role: '', photo: '' }])}
                    className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                    <PlusCircle size={16} /> Add Team Member
                </button>
            </Card>
        </div>
    );
};

// ─── Notice Bar ───────────────────────────────────────────────────────────────
const DEFAULT_NOTICE = {
    enabled: false, text: '🌟 Special offer: Book now and save up to 20%!',
    bgColor: '#1d4ed8', textColor: '#ffffff', link: '', linkText: 'View Deals',
};
const NoticeBarSection = () => {
    const [form, setForm] = useState(() => load('hm_notice_bar', DEFAULT_NOTICE));
    const [saved, setSaved] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = () => { persist('hm_notice_bar', form); setSaved(true); setTimeout(() => setSaved(false), 2500); };
    return (
        <div>
            <SaveBar onSave={handleSave} saved={saved} />
            <Card>
                <div className="mb-5"><Toggle value={form.enabled} onChange={v => set('enabled', v)} label="Notice Bar" /></div>
                <Field label="Message"><Textarea rows={2} value={form.text} onChange={e => set('text', e.target.value)} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Link URL" hint="Leave blank for no link"><Input value={form.link} onChange={e => set('link', e.target.value)} /></Field>
                    <Field label="Link Button Text"><Input value={form.linkText} onChange={e => set('linkText', e.target.value)} /></Field>
                    <Field label="Background Colour"><ColorPicker value={form.bgColor} onChange={v => set('bgColor', v)} /></Field>
                    <Field label="Text Colour"><ColorPicker value={form.textColor} onChange={v => set('textColor', v)} /></Field>
                </div>
            </Card>
            {form.enabled && (
                <Card title="Preview">
                    <div className="rounded-xl px-5 py-3 flex items-center justify-between gap-4" style={{ backgroundColor: form.bgColor }}>
                        <span className="text-sm font-semibold" style={{ color: form.textColor }}>{form.text}</span>
                        {form.link && <a href={form.link} className="text-xs font-black px-3 py-1.5 rounded-full bg-white/20 whitespace-nowrap" style={{ color: form.textColor }}>{form.linkText}</a>}
                    </div>
                </Card>
            )}
        </div>
    );
};

// ─── Hero Banner ──────────────────────────────────────────────────────────────
const DEFAULT_HERO = {
    headline: 'Find Your Perfect Stay',
    subheadline: 'Search thousands of hotels worldwide at the best prices.',
    bgImage: '', overlayOpacity: 60,
};
const HeroSection = () => {
    const [form, setForm] = useState(() => load('hm_hero_banner', DEFAULT_HERO));
    const [saved, setSaved] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = () => { persist('hm_hero_banner', form); setSaved(true); setTimeout(() => setSaved(false), 2500); };
    return (
        <div>
            <SaveBar onSave={handleSave} saved={saved} />
            <Card>
                <Field label="Main Headline"><Input value={form.headline} onChange={e => set('headline', e.target.value)} /></Field>
                <Field label="Sub-headline"><Input value={form.subheadline} onChange={e => set('subheadline', e.target.value)} /></Field>
                <Field label="Background Image URL" hint="Optional — leave blank for default dark gradient.">
                    <Input value={form.bgImage} onChange={e => set('bgImage', e.target.value)} placeholder="https://..." />
                    {form.bgImage && <img src={form.bgImage} alt="" className="mt-3 w-full h-28 object-cover rounded-xl" onError={e => e.target.style.display='none'} />}
                </Field>
                <Field label={`Dark Overlay: ${form.overlayOpacity}%`}>
                    <input type="range" min="0" max="90" value={form.overlayOpacity} onChange={e => set('overlayOpacity', +e.target.value)} className="w-full accent-primary" />
                </Field>
            </Card>
        </div>
    );
};

// ─── Featured Destinations ────────────────────────────────────────────────────
const DEFAULT_DESTS = [
    // ── Iconic World Destinations ──────────────────────────────────────────────
    { title: 'Santorini, Greece',           image: 'https://images.unsplash.com/photo-1504814532849-cff240bbc503?auto=format&fit=crop&w=800&q=80',          region_id: '1735' },
    { title: 'Bali, Indonesia',              image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '602651' },
    { title: 'Kyoto, Japan',                image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '10323' },
    { title: 'Paris, France',               image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '2734' },
    { title: 'Amalfi Coast, Italy',         image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',          region_id: '4922' },
    { title: 'Swiss Alps, Switzerland',     image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '' },
    { title: 'Maldives',                    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '2343' },
    { title: 'Maui, Hawaii',               image: 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '180073' },
    { title: 'Bora Bora, French Polynesia', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '602862' },
    { title: 'Cape Town, South Africa',     image: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', region_id: '910' },
    { title: 'Tulum, Mexico',               image: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=800&q=80',          region_id: '182189' },
    { title: 'Dubrovnik, Croatia',          image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',          region_id: '986' },
    // ── Middle East & UAE ──────────────────────────────────────────────────────
    { title: 'Dubai, UAE',                  image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',          region_id: '6053839' },
    { title: 'Makkah, Saudi Arabia',        image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',          region_id: '178043' },
    { title: 'Medina, Saudi Arabia',        image: 'https://images.unsplash.com/photo-1564769625647-fbd7d8d5b6d8?auto=format&fit=crop&w=800&q=80',          region_id: '602705' },
    // ── Turkey ────────────────────────────────────────────────────────────────
    { title: 'Istanbul, Turkey',            image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',          region_id: '1639' },
    { title: 'Cappadocia, Turkey',          image: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=800&q=80',          region_id: '602183' },
    { title: 'Antalya, Turkey',             image: 'https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?auto=format&fit=crop&w=800&q=80',          region_id: '481' },
    { title: 'Pamukkale, Turkey',           image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80',          region_id: '6054844' },
    // ── United Kingdom ────────────────────────────────────────────────────────
    { title: 'London, UK',                  image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',          region_id: '2114' },
    { title: 'Edinburgh, Scotland',         image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=800&q=80',            region_id: '966238332' },
    { title: 'Manchester, UK',              image: 'https://images.unsplash.com/photo-1574108816803-22c5e9b2b4f0?auto=format&fit=crop&w=800&q=80',          region_id: '2205' },
    { title: 'Liverpool, UK',               image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=800&q=80',          region_id: '2122' },
    // ── Global Cities ─────────────────────────────────────────────────────────
    { title: 'New York, USA',               image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=800&q=80',          region_id: '5128' },
    { title: 'Tokyo, Japan',                image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',          region_id: '3593' },
    { title: 'Sydney, Australia',           image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',          region_id: '3341' },
    // ── Pakistan ──────────────────────────────────────────────────────────────
    { title: 'Islamabad, Pakistan',         image: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?auto=format&fit=crop&w=800&q=80',          region_id: '1633' },
    { title: 'Lahore, Pakistan',            image: 'https://images.unsplash.com/photo-1567767292278-a1aababd2b69?auto=format&fit=crop&w=800&q=80',          region_id: '2068' },
    { title: 'Karachi, Pakistan',           image: 'https://images.unsplash.com/photo-1589553416260-f586c8f1514f?auto=format&fit=crop&w=800&q=80',          region_id: '1809' },
];
const DestinationsSection = () => {
    const [items, setItems] = useState(() => {
        const stored = load('hm_featured_destinations', []);
        if (!stored.length) return DEFAULT_DESTS;
        // Merge: add any DEFAULT_DESTS entries not already present by title
        const storedTitles = new Set(stored.map(d => d.title?.toLowerCase()));
        const missing = DEFAULT_DESTS.filter(d => !storedTitles.has(d.title.toLowerCase()));
        return [...stored, ...missing];
    });
    const [saved, setSaved] = useState(false);
    const handleSave = () => { persist('hm_featured_destinations', items); setSaved(true); setTimeout(() => setSaved(false), 2500); };

    const setItem = (i, k, v) => {
        const a = [...items];
        // When title changes, auto-resolve region_id from mapping
        if (k === 'title') {
            const resolved = resolveRegion(v);
            a[i] = { ...a[i], title: v, region_id: resolved ? String(resolved.id) : a[i].region_id };
        } else {
            a[i] = { ...a[i], [k]: v };
        }
        setItems(a);
    };
    return (
        <div>
            <SaveBar onSave={handleSave} saved={saved} />
            {items.map((it, i) => (
                <Card key={i}>
                    <div className="flex items-start gap-4">
                        {it.image && <img src={it.image} alt="" className="w-20 h-16 object-cover rounded-xl flex-shrink-0" onError={e => e.target.style.display='none'} />}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Name"><Input value={it.title} onChange={e => setItem(i, 'title', e.target.value)} /></Field>
                            <Field label="Image URL"><Input value={it.image} onChange={e => setItem(i, 'image', e.target.value)} /></Field>
                            <Field label="Region ID" hint={resolveRegion(it.title) ? `✓ Auto-resolved: ${resolveRegion(it.title).name}` : 'Type a name to auto-resolve, or enter manually'}>
                                <Input
                                    value={it.region_id}
                                    onChange={e => setItem(i, 'region_id', e.target.value)}
                                    placeholder="e.g. 2734"
                                    className={resolveRegion(it.title) ? 'border-accent focus:border-accent' : ''}
                                />
                            </Field>
                        </div>
                        <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 mt-6 flex-shrink-0"><Trash2 size={16} /></button>
                    </div>
                </Card>
            ))}
            <button onClick={() => setItems([...items, { title: '', image: '', region_id: '' }])}
                    className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                <PlusCircle size={16} /> Add Destination
            </button>
        </div>
    );
};

// ─── Footer Content ─────────────────────────────────────────────────────────
const HM_FOOTER_KEY = 'hm_footer_content';
const DEFAULT_FOOTER_DATA = {
    tagline: "Curating the world's most breathtaking stays for the modern traveler.",
    socials: [
        { platform: 'Instagram', url: '#' },
        { platform: 'Twitter',   url: '#' },
        { platform: 'Facebook',  url: '#' },
    ],
    columns: [
        { title: 'Company',      links: [{ label: 'About Us', url: '/about' }, { label: 'Careers', url: '#' }, { label: 'Blog', url: '#' }, { label: 'Press', url: '#' }] },
        { title: 'Support',      links: [{ label: 'Contact Us', url: '#' }, { label: 'Terms & Conditions', url: '#' }, { label: 'Privacy Policy', url: '#' }, { label: 'FAQ', url: '#' }] },
        { title: 'Destinations', links: [{ label: 'Maldives', url: '/hotels' }, { label: 'Switzerland', url: '/hotels' }, { label: 'Japan', url: '/hotels' }, { label: 'France', url: '/hotels' }] },
    ],
    bottomLinks: [
        { label: 'Privacy', url: '#' },
        { label: 'Terms',   url: '#' },
        { label: 'Sitemap', url: '#' },
    ],
    copyrightText: '',
};
const SOCIAL_PLATFORMS = ['Instagram', 'Twitter', 'Facebook', 'Youtube', 'LinkedIn'];

const FooterSection = () => {
    const [form, setForm] = useState(() => load(HM_FOOTER_KEY, DEFAULT_FOOTER_DATA));
    const [saved, setSaved] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = () => {
        persist(HM_FOOTER_KEY, form);
        window.dispatchEvent(new CustomEvent('hm-footer-updated'));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    // ── Socials ──
    const setSocial = (i, k, v) => { const a = [...form.socials]; a[i] = { ...a[i], [k]: v }; set('socials', a); };
    const addSocial = () => set('socials', [...form.socials, { platform: 'Instagram', url: '#' }]);
    const removeSocial = (i) => set('socials', form.socials.filter((_, j) => j !== i));

    // ── Columns ──
    const setColumnTitle = (ci, v) => { const a = [...form.columns]; a[ci] = { ...a[ci], title: v }; set('columns', a); };
    const addColumn = () => set('columns', [...form.columns, { title: 'New Column', links: [{ label: '', url: '#' }] }]);
    const removeColumn = (ci) => set('columns', form.columns.filter((_, j) => j !== ci));
    const setLink = (ci, li, k, v) => {
        const a = [...form.columns];
        const links = [...a[ci].links];
        links[li] = { ...links[li], [k]: v };
        a[ci] = { ...a[ci], links };
        set('columns', a);
    };
    const addLink = (ci) => { const a = [...form.columns]; a[ci] = { ...a[ci], links: [...a[ci].links, { label: '', url: '#' }] }; set('columns', a); };
    const removeLink = (ci, li) => { const a = [...form.columns]; a[ci] = { ...a[ci], links: a[ci].links.filter((_, j) => j !== li) }; set('columns', a); };

    // ── Bottom links ──
    const setBottomLink = (i, k, v) => { const a = [...form.bottomLinks]; a[i] = { ...a[i], [k]: v }; set('bottomLinks', a); };
    const addBottomLink = () => set('bottomLinks', [...form.bottomLinks, { label: '', url: '#' }]);
    const removeBottomLink = (i) => set('bottomLinks', form.bottomLinks.filter((_, j) => j !== i));

    const SelectField = ({ value, onChange }) => (
        <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all">
            {SOCIAL_PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
    );

    return (
        <div>
            <SaveBar onSave={handleSave} saved={saved} />

            {/* ── Brand Tagline ── */}
            <Card title="Brand Tagline">
                <Field label="Description" hint="Shown below the logo in the footer.">
                    <Textarea rows={2} value={form.tagline} onChange={e => set('tagline', e.target.value)}
                        placeholder="Curating the world's most breathtaking stays..." />
                </Field>
            </Card>

            {/* ── Social Links ── */}
            <Card title="Social Media Links">
                <p className="text-xs text-slate-400 mb-4">Each social icon appears below the tagline. Supported: Instagram, Twitter, Facebook, Youtube, LinkedIn.</p>
                {form.socials.map((s, i) => (
                    <div key={i} className="flex gap-2 items-end mb-3">
                        <div className="w-36 flex-shrink-0">
                            <Field label={i === 0 ? 'Platform' : ''}>
                                <SelectField value={s.platform} onChange={v => setSocial(i, 'platform', v)} />
                            </Field>
                        </div>
                        <div className="flex-1">
                            <Field label={i === 0 ? 'Profile URL' : ''}>
                                <Input
                                    value={s.url}
                                    onChange={e => setSocial(i, 'url', e.target.value)}
                                    placeholder={`https://www.${s.platform.toLowerCase()}.com/yourpage`} />
                            </Field>
                            {s.url && s.url !== '#' && !s.url.startsWith('http') && (
                                <p className="text-[11px] text-amber-500 font-semibold mt-1 flex items-center gap-1">
                                    ⚠ Add <span className="font-mono">https://</span> at the start — e.g. <span className="font-mono">https://{s.url}</span>
                                </p>
                            )}
                        </div>
                        <button onClick={() => removeSocial(i)}
                            className="text-red-400 hover:text-red-600 mb-5 flex-shrink-0">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button onClick={addSocial}
                    className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline mt-1">
                    <PlusCircle size={16} /> Add Social Link
                </button>
            </Card>

            {/* ── Nav Columns ── */}
            <Card title="Navigation Columns">
                <p className="text-xs text-slate-400 mb-5">Each column appears in the footer grid. Rename columns, reorder links, add URLs, or remove entire columns.</p>
                {form.columns.map((col, ci) => (
                    <div key={ci} className="mb-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 overflow-hidden">
                        {/* Column header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
                            <Input
                                value={col.title}
                                onChange={e => setColumnTitle(ci, e.target.value)}
                                placeholder="Column Title"
                                className="font-bold flex-1 !py-2"
                            />
                            <button onClick={() => removeColumn(ci)}
                                className="text-red-400 hover:text-red-600 flex-shrink-0 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title="Remove column">
                                <Trash2 size={15} />
                            </button>
                        </div>
                        {/* Links */}
                        <div className="px-4 py-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Link Label</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">URL</span>
                            </div>
                            {col.links.map((lk, li) => (
                                <div key={li} className="flex gap-2 items-center">
                                    <Input
                                        value={lk.label}
                                        onChange={e => setLink(ci, li, 'label', e.target.value)}
                                        placeholder="e.g. About Us"
                                        className="flex-1 !py-2"
                                    />
                                    <Input
                                        value={lk.url}
                                        onChange={e => setLink(ci, li, 'url', e.target.value)}
                                        placeholder="/page or https://..."
                                        className="flex-1 !py-2"
                                    />
                                    <button onClick={() => removeLink(ci, li)}
                                        className="text-red-400 hover:text-red-600 flex-shrink-0">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => addLink(ci)}
                                className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline pt-1">
                                <PlusCircle size={13} /> Add Link
                            </button>
                        </div>
                    </div>
                ))}
                <button onClick={addColumn}
                    className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                    <PlusCircle size={16} /> Add Column
                </button>
            </Card>

            {/* ── Bottom Bar Links ── */}
            <Card title="Bottom Bar Links">
                <p className="text-xs text-slate-400 mb-4">Small links on the right side of the copyright bar (e.g. Privacy, Terms, Sitemap).</p>
                <div className="grid grid-cols-2 gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Label</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">URL</span>
                </div>
                {form.bottomLinks.map((l, i) => (
                    <div key={i} className="flex gap-2 items-center mb-2">
                        <Input
                            value={l.label}
                            onChange={e => setBottomLink(i, 'label', e.target.value)}
                            placeholder="Privacy"
                            className="flex-1 !py-2"
                        />
                        <Input
                            value={l.url}
                            onChange={e => setBottomLink(i, 'url', e.target.value)}
                            placeholder="/privacy or https://..."
                            className="flex-1 !py-2"
                        />
                        <button onClick={() => removeBottomLink(i)}
                            className="text-red-400 hover:text-red-600 flex-shrink-0">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                <button onClick={addBottomLink}
                    className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline mt-2">
                    <PlusCircle size={16} /> Add Link
                </button>
            </Card>

            {/* ── Copyright ── */}
            <Card title="Copyright Text">
                <Field label="Custom Copyright Line"
                    hint={`Leave blank to auto-generate: "© ${new Date().getFullYear()} [Site Name] Inc. All rights reserved."`}>
                    <Input
                        value={form.copyrightText}
                        onChange={e => set('copyrightText', e.target.value)}
                        placeholder={`© ${new Date().getFullYear()} YourSite Inc. All rights reserved.`}
                    />
                </Field>
            </Card>

            {/* ── Live Preview ── */}
            <Card title="Live Preview">
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="px-5 py-6" style={{ backgroundColor: 'var(--hm-footer-bg)', borderTop: '1px solid var(--hm-footer-border)' }}>
                        <div className={`grid grid-cols-${Math.min(form.columns.length + 1, 4)} gap-6 mb-5`}>
                            <div>
                                <div className="font-bold text-base mb-2" style={{ color: 'var(--hm-footer-heading)' }}>🏨 {(form.tagline || '').slice(0, 36)}{(form.tagline || '').length > 36 ? '…' : ''}</div>
                                <div className="flex gap-2 mt-3">
                                    {form.socials.slice(0, 3).map((s, i) => (
                                        <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                                            style={{ background: 'var(--hm-card-bg)', border: '1px solid var(--hm-footer-border)', color: 'var(--hm-footer-text)' }}>
                                            {s.platform[0]}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {form.columns.slice(0, 3).map((col, ci) => (
                                <div key={ci}>
                                    <div className="font-black uppercase tracking-wider text-[10px] mb-2" style={{ color: 'var(--hm-footer-heading)' }}>{col.title}</div>
                                    {col.links.slice(0, 4).map((lk, li) => (
                                        <div key={li} className="mb-1 font-medium" style={{ color: 'var(--hm-footer-text)' }}>{lk.label}</div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between pt-4" style={{ borderTop: '1px solid var(--hm-footer-border)', color: 'var(--hm-footer-text)' }}>
                            <span>© {new Date().getFullYear()} {form.copyrightText || 'YourSite Inc.'}</span>
                            <div className="flex gap-4">
                                {form.bottomLinks.map((l, i) => <span key={i}>{l.label}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Preview reflects current footer colours from Theme & Colours settings.</p>
            </Card>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PrivatePage = () => {
    const { user, signOut } = useAuth();
    const [active, setActive] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const activeNav = NAV.find(n => n.id === active) || NAV[0];

    const renderSection = () => {
        switch (active) {
            case 'overview':     return <OverviewSection user={user} setActive={setActive} />;
            case 'branding':     return <BrandingSection />;
            case 'theme':        return <ThemeSection />;
            case 'popup':        return <PopupSection />;
            case 'about':        return <AboutSection />;
            case 'noticebar':    return <NoticeBarSection />;
            case 'hero':         return <HeroSection />;
            case 'destinations': return <DestinationsSection />;
            case 'footer':       return <FooterSection />;
            default:             return null;
        }
    };

    return (
        <div className="min-h-screen bg-page-bg dark:bg-slate-950 pt-16 flex">
            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 border-r flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
                style={{ backgroundColor: 'var(--hm-sidebar-bg)', borderColor: 'var(--hm-card-border)' }}
            >
                {/* Admin identity */}
                <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--hm-card-border)' }}>
                    <div className="flex items-center gap-3">
                        {user?.picture
                            ? <img src={user.picture} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                            : <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{user?.given_name?.[0] || '?'}</div>
                        }
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.given_name || user?.name}</p>
                            <p className="text-[11px] text-primary font-semibold uppercase tracking-wider">Admin</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {NAV.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => { setActive(id); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active === id
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}>
                            <Icon size={17} />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* Sign out */}
                <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--hm-card-border)' }}>
                    <button onClick={signOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                        <LogOut size={17} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 md:ml-64 flex flex-col">
                {/* Top bar */}
                <header className="border-b px-6 py-4 flex items-center gap-4 sticky top-16 z-30"
                    style={{ backgroundColor: 'var(--hm-sidebar-bg)', borderColor: 'var(--hm-card-border)' }}>
                    <button className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setSidebarOpen(o => !o)}>
                        <Menu size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <activeNav.icon size={18} className="text-primary" />
                    <h2 className="text-base font-black text-slate-800 dark:text-white">{activeNav.label}</h2>
                    <div className="ml-auto">
                        <a href="/" target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
                            <Globe size={14} /> View Site
                        </a>
                    </div>
                </header>

                <main className="flex-1 px-6 py-6 max-w-4xl w-full">
                    {renderSection()}
                </main>
            </div>
        </div>
    );
};

export default PrivatePage;
