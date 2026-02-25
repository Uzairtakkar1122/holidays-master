import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Check, Globe, CreditCard } from 'lucide-react';
import { currencies, countries } from '../data/geoData';

const GlobalSelectorModal = ({ isOpen, onClose, currentType, onSelect, currentCurrency, currentResidency }) => {
    const [activeTab, setActiveTab] = useState(currentType || 'residency');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (currentType) setActiveTab(currentType);
            setSearchQuery('');
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, currentType]);

    const filteredItems = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'currency') {
            return currencies.filter(curr =>
                curr.name.toLowerCase().includes(query) ||
                curr.code.toLowerCase().includes(query)
            );
        } else {
            return countries.filter(country =>
                country.name.toLowerCase().includes(query) ||
                country.code.toLowerCase().includes(query)
            );
        }
    }, [activeTab, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            ></div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl min-h-[500px] max-h-[90vh] overflow-hidden relative z-10 shadow-2xl flex flex-col animate-scale-in transition-colors duration-300">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
                                {activeTab === 'currency' ? 'Select Currency' : 'Select Country'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-[12px] sm:text-sm">
                                {activeTab === 'currency'
                                    ? 'Choose your preferred currency'
                                    : 'Select your country of residency'
                                }
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-100 dark:border-slate-800 shadow-sm"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto transition-colors">
                            <button
                                onClick={() => { setActiveTab('residency'); setSearchQuery(''); }}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'residency' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Globe size={14} />
                                Country
                            </button>
                            <button
                                onClick={() => { setActiveTab('currency'); setSearchQuery(''); }}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'currency' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <CreditCard size={14} />
                                Currency
                            </button>
                        </div>

                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'currency' ? 'currencies' : 'countries'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 transition-all text-sm font-medium text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {filteredItems.map((item) => {
                            const isSelected = activeTab === 'currency'
                                ? currentCurrency?.code === item.code
                                : currentResidency?.code === item.code;

                            return (
                                <button
                                    key={item.code}
                                    onClick={() => onSelect(activeTab, item)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${isSelected
                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 ring-1 ring-emerald-500 shadow-sm'
                                        : 'border-white dark:border-slate-900 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-slate-100 bg-slate-900 shadow-inner group-hover:scale-110 transition-transform flex items-center justify-center">
                                            <img
                                                src={`https://flagcdn.com/w80/${item.flag.toLowerCase()}.png`}
                                                alt={item.name}
                                                className="w-full h-full object-cover scale-110"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-900 dark:text-white truncate">
                                                {item.code}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider truncate">
                                                {item.name}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected ? (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 ml-2">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    ) : (
                                        activeTab === 'currency' && (
                                            <span className="font-serif font-bold text-lg text-slate-300 ml-2">
                                                {item.symbol}
                                            </span>
                                        )
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Search size={24} />
                            </div>
                            <h4 className="text-slate-900 font-bold">No results found</h4>
                            <p className="text-slate-500 text-sm">Try searching for something else</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center transition-colors">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                        Prices will be shown in {currentCurrency?.code}. Your residency is {currentResidency?.name}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GlobalSelectorModal;
