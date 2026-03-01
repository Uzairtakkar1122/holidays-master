/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // CSS-var-based tokens — Tailwind v3 syntax with <alpha-value> for opacity modifiers
                // e.g. bg-primary, bg-primary/90, text-primary/50 all work correctly
                primary: 'rgb(var(--hm-primary-rgb) / <alpha-value>)',
                accent:  'rgb(var(--hm-accent-rgb)  / <alpha-value>)',
                'page-bg':    'var(--hm-page-bg)',
                'card-bg':    'var(--hm-card-bg)',
                'card-border':'var(--hm-card-border)',
                'nav-bg':     'var(--hm-nav-bg)',
                'nav-text':   'var(--hm-nav-text)',
            },
            fontFamily: {
                serif: ['"Cormorant Garamond"', 'serif'],
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'scroll-down': 'scrollDown 2s infinite',
                'float': 'float 6s ease-in-out infinite',
                'fade-in-down': 'fadeInDown 0.3s ease-out',
            },
            keyframes: {
                scrollDown: {
                    '0%': { transform: 'translateY(0)', opacity: '1' },
                    '100%': { transform: 'translateY(8px)', opacity: '0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                fadeInDown: {
                    'from': { opacity: '0', transform: 'translateY(-10px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
