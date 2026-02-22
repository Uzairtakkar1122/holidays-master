import React from 'react';

const DestinationCard = ({ title, count, image }) => (
    <div className="group relative overflow-hidden rounded-2xl cursor-pointer h-80 w-full">
        <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors z-10" />
        <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute bottom-0 left-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform">
            <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
            <p className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                {count} Properties
            </p>
        </div>
    </div>
);

export default DestinationCard;
