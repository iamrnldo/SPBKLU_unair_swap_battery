import React from 'react';

const Card = ({ title, value, icon: Icon, description, trend, color = 'emerald' }) => {
  // Map color schemes for border and background
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      shadow: 'shadow-emerald-500/5'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      shadow: 'shadow-blue-500/5'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-100',
      shadow: 'shadow-orange-500/5'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      shadow: 'shadow-purple-500/5'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      shadow: 'shadow-rose-500/5'
    }
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`bg-white rounded-xl border border-slate-150 p-6 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow duration-150 ${scheme.shadow}`}>
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{title}</span>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
        
        {/* Detail/Trend row */}
        <div className="flex items-center gap-1.5 pt-1">
          {trend && (
            <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
              {trend}
            </span>
          )}
          <span className="text-xs font-medium text-slate-500">{description}</span>
        </div>
      </div>

      <div className={`p-3 rounded-lg ${scheme.bg} ${scheme.text} border ${scheme.border} flex items-center justify-center`}>
        {Icon && <Icon className="h-6 w-6" />}
      </div>
    </div>
  );
};

export default Card;
