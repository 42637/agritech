import React from 'react';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { Farm } from '../services/api';

interface InsightsScreenProps {
  farms: Farm[];
  onBack: () => void;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({ farms, onBack }) => {
  const chartData = farms.map((f) => ({
    name: f.village,
    acres: f.acreage,
    ph: f.soil_ph || 6.5
  }));

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-[#102D20]" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-[#102D20]">Farm Insights</h2>
          <p className="text-xs text-[#5A6E65]">Grow smarter with data analytics</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-[#102D20]">Farm Acreage Distribution</h3>
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#5A6E65" fontSize={11} />
              <YAxis stroke="#5A6E65" fontSize={11} />
              <Tooltip />
              <Bar dataKey="acres" fill="#087A3D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
