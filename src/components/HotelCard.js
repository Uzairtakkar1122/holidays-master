import React from 'react';
import { Heart, MapPin, Star, ArrowRight } from 'lucide-react';

const HotelCard = ({ name, location, price, rating, image, tags = [] }) => (
    <div className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
        <div className="relative h-64 overflow-hidden">
            <img
                src={image}
                alt={name}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
            />
            <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
            </button>
            <div className="absolute top-4 left-4 flex gap-2">
                {tags.map(tag => (
                    <span key={tag} className="bg-slate-900/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-medium">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
        <div className="p-6">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{name}</h3>
                    <div className="flex items-center text-slate-500 text-sm gap-1">
                        <MapPin className="w-4 h-4" />
                        {location}
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                    <span className="font-bold text-slate-700">{rating}</span>
                </div>
            </div>
            <div className="w-full h-px bg-slate-100 my-4" />
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-sm text-slate-400 block">Start from</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">${price}</span>
                        <span className="text-slate-500">/night</span>
                    </div>
                </div>
                <button className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    View Details <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
);

export default HotelCard;
