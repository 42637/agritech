import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export const SavedScreen: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.getSaved().then(setItems).catch(console.error);
  }, []);

  const handleDelete = async (id: number) => {
    await api.deleteSaved(id);
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-[#087A3D]">
          <Bookmark className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-[#102D20]">Saved Items</h2>
          <p className="text-xs text-[#5A6E65]">Saved recommendations & AI advice</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#102D20]">{item.title}</h3>
              <button onClick={() => handleDelete(item.id)} className="text-rose-500 hover:text-rose-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-snug">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
