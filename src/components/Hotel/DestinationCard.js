import React, { useMemo } from 'react';

const DestinationCard = ({ title, count, image, onClick }) => {
    const fallbackImage = useMemo(() => {
        const encodedTitle = encodeURIComponent(title || 'Destination');
        return `https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80&sig=${encodedTitle}`;
    }, [title]);

    return (
    <div
        className="group relative overflow-hidden rounded-2xl cursor-pointer h-80 w-full"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
            if (!onClick) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
            }
        }}
    >
        <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors z-10" />
        <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
                if (e.currentTarget?.src === fallbackImage) return;
                e.currentTarget.src = fallbackImage;
            }}
        />
        <div className="absolute bottom-0 left-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform">
            <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
            <p className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                {count != null ? `${count} Properties` : 'Explore Hotels'}
            </p>
        </div>
    </div>
    );
};

export default DestinationCard;
