import React, { useEffect, useState, useRef } from 'react';
import { Search, FileText, ArrowRight, Command } from 'lucide-react';
import { DocCategory } from '../types';

interface SpotlightProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpotlightSearch: React.FC<SpotlightProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock results
  const allItems = [
    { type: 'Doc', title: 'Kalender Pendidikan 2024', sub: DocCategory.PERENCANAAN },
    { type: 'Doc', title: 'SK Tim Kurikulum', sub: DocCategory.SK_REGULASI },
    { type: 'Doc', title: 'Modul Ajar IPA Kelas 9', sub: DocCategory.PEMBELAJARAN },
    { type: 'Page', title: 'Dashboard', sub: 'Navigation' },
    { type: 'Page', title: 'Settings', sub: 'System' },
  ];

  const filteredItems = query 
    ? allItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
    : allItems.slice(0, 3); // Show recent if empty

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in transform transition-all">
        
        {/* Input Header */}
        <div className="flex items-center px-4 py-4 border-b border-gray-200/50">
          <Search className="text-gray-400 w-5 h-5 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 placeholder-gray-400"
            placeholder="Cari dokumen, menu, atau guru..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-1">
             <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">ESC</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                    Tidak ada hasil ditemukan untuk "{query}"
                </div>
            ) : (
                <>
                    <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">
                        {query ? 'Hasil Pencarian' : 'Baru dibuka'}
                    </div>
                    {filteredItems.map((item, idx) => (
                        <button 
                            key={idx}
                            className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-blue-500 hover:text-white transition-colors group text-left"
                            onClick={() => {
                                alert(`Opening ${item.title}...`);
                                onClose();
                            }}
                        >
                            <div className={`p-2 rounded-lg mr-3 ${item.type === 'Page' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-500'} group-hover:bg-white/20 group-hover:text-white`}>
                                {item.type === 'Page' ? <Command size={16}/> : <FileText size={16}/>}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium group-hover:text-white text-gray-800">{item.title}</h4>
                                <p className="text-xs group-hover:text-white/80 text-gray-500">{item.sub}</p>
                            </div>
                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </>
            )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-500">
           <span>Sistem Database Kurikulum</span>
           <div className="flex gap-2">
              <span>Navigate <span className="font-bold">↓↑</span></span>
              <span>Select <span className="font-bold">↵</span></span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightSearch;