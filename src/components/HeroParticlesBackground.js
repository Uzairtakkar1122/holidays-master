import React, { useEffect, useMemo, useRef } from 'react';

function parseRgb(color) {
    // Supports: rgb(r, g, b) or rgba(r, g, b, a)
    const match = String(color).match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (!match) return { r: 255, g: 255, b: 255 };
    return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

const HeroParticlesBackground = ({ className = '' }) => {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const colorProbe1Ref = useRef(null);
    const colorProbe2Ref = useRef(null);

    const reduceMotion = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    useEffect(() => {
        if (reduceMotion) return;

        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const getThemeColors = () => {
            const probe1 = colorProbe1Ref.current;
            const probe2 = colorProbe2Ref.current;
            const c1 = probe1 ? window.getComputedStyle(probe1).color : 'rgb(16, 185, 129)';
            const c2 = probe2 ? window.getComputedStyle(probe2).color : 'rgb(56, 189, 248)';
            return {
                a: parseRgb(c1),
                b: parseRgb(c2),
                isDark: document.documentElement.classList.contains('dark') || document.body.classList.contains('dark')
            };
        };

        const pointer = { x: 0, y: 0, active: false };
        const updatePointerFromEvent = (e) => {
            const rect = wrapper.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
            pointer.active = inside;
            if (inside) {
                pointer.x = x;
                pointer.y = y;
            }
        };

        // Listen on window so interaction works even when the SearchWidget overlays the background.
        const onPointerMove = (e) => updatePointerFromEvent(e);
        const onPointerDown = (e) => updatePointerFromEvent(e);
        const onScrollOrResize = () => {
            // If layout shifts, re-evaluate if pointer is still inside.
            if (!pointer.active) return;
            // Keep current coordinates but confirm bounds on next move.
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize, { passive: true });

        let width = 0;
        let height = 0;
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

        const resize = () => {
            const rect = wrapper.getBoundingClientRect();
            width = Math.max(1, Math.floor(rect.width));
            height = Math.max(1, Math.floor(rect.height));
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const ro = new ResizeObserver(resize);
        ro.observe(wrapper);
        resize();

        const baseCount = () => {
            const area = width * height;
            // Very high density (requested). Keep a cap for performance.
            return clamp(Math.round(area / 6500), 110, 230);
        };

        const particles = [];
        const resetParticles = () => {
            particles.length = 0;
            const count = baseCount();
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.12,
                    vy: (Math.random() - 0.5) * 0.12,
                    r: 1.2 + Math.random() * 2.6,
                    t: Math.random() * Math.PI * 2,
                    s: 0.2 + Math.random() * 0.5,
                    mix: Math.random()
                });
            }
        };

        resetParticles();

        let rafId = 0;
        let lastTs = performance.now();

        const draw = (ts) => {
            const dt = Math.min(32, ts - lastTs);
            lastTs = ts;

            const { a, b, isDark } = getThemeColors();

            ctx.clearRect(0, 0, width, height);

            // Subtle vignette to keep SearchWidget readable
            ctx.save();
            const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.1, width / 2, height / 2, Math.max(width, height) * 0.7);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, isDark ? 'rgba(2,6,23,0.55)' : 'rgba(15,23,42,0.35)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();

            const mx = pointer.active ? pointer.x : width / 2;
            const my = pointer.active ? pointer.y : height / 2;
            const minSide = Math.min(width, height);
            const repelRadius = minSide * 0.22;
            const influenceRadius = minSide * 0.55;
            const repelRadiusSq = repelRadius * repelRadius;
            const influenceRadiusSq = influenceRadius * influenceRadius;

            // Draw connections first (so dots appear on top)
            const connectionMaxDist = particles.length > 200 ? 56 : particles.length > 160 ? 62 : 72;
            const connectionMaxDistSq = connectionMaxDist * connectionMaxDist;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x;
                    const dy = p.y - q.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq > connectionMaxDistSq) continue;
                    const dist = Math.sqrt(distSq);
                    const alpha = (1 - dist / connectionMaxDist) * (isDark ? 0.22 : 0.12);
                    if (alpha <= 0) continue;
                    ctx.strokeStyle = `rgba(${a.r}, ${a.g}, ${a.b}, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Gentle drift
                p.t += p.s * (dt / 1000);
                p.vx += Math.cos(p.t) * 0.0009;
                p.vy += Math.sin(p.t) * 0.0009;

                // Mouse interaction (anti-gravity feel)
                const dxm = p.x - mx;
                const dym = p.y - my;
                const dSq = dxm * dxm + dym * dym;
                if (pointer.active && dSq < influenceRadiusSq) {
                    const d = Math.max(14, Math.sqrt(dSq));
                    if (dSq < repelRadiusSq) {
                        // Strong repulsion close to cursor
                        const force = (1 - d / repelRadius) * 1.25;
                        p.vx += (dxm / d) * force * 0.14;
                        p.vy += (dym / d) * force * 0.14;
                    } else {
                        // Gentle attraction further away to create noticeable "flow" with mouse movement
                        const force = (1 - d / influenceRadius) * 0.10;
                        p.vx += (-dxm / d) * force * 0.08;
                        p.vy += (-dym / d) * force * 0.08;
                    }
                }

                // Damping
                p.vx *= 0.972;
                p.vy *= 0.972;

                p.x += p.vx * dt;
                p.y += p.vy * dt;

                // Wrap edges
                if (p.x < -10) p.x = width + 10;
                if (p.x > width + 10) p.x = -10;
                if (p.y < -10) p.y = height + 10;
                if (p.y > height + 10) p.y = -10;

                // Mix between two theme colors
                const rr = Math.round(a.r + (b.r - a.r) * p.mix);
                const gg = Math.round(a.g + (b.g - a.g) * p.mix);
                const bb = Math.round(a.b + (b.b - a.b) * p.mix);

                const dotAlpha = isDark ? 0.75 : 0.55;
                ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${dotAlpha})`;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            rafId = window.requestAnimationFrame(draw);
        };

        rafId = window.requestAnimationFrame(draw);

        const onVisibility = () => {
            if (document.hidden) {
                window.cancelAnimationFrame(rafId);
            } else {
                lastTs = performance.now();
                rafId = window.requestAnimationFrame(draw);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.cancelAnimationFrame(rafId);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('scroll', onScrollOrResize);
            window.removeEventListener('resize', onScrollOrResize);
            ro.disconnect();
        };
    }, [reduceMotion]);

    return (
        <div ref={wrapperRef} className={`absolute inset-0 ${className}`} aria-hidden="true">
            {/* Color probes (read Tailwind token colors without hardcoding) */}
            <span ref={colorProbe1Ref} className="absolute opacity-0 pointer-events-none text-emerald-400 dark:text-emerald-300">.</span>
            <span ref={colorProbe2Ref} className="absolute opacity-0 pointer-events-none text-sky-400 dark:text-sky-300">.</span>
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        </div>
    );
};

export default HeroParticlesBackground;
