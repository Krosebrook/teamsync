import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

const FilterControls = ({ dateRange, onDateRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState(dateRange);

  const presets = [
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
    { label: 'Last 90 Days', value: 90 },
    { label: 'Last 6 Months', value: 180 },
  ];

  const handlePreset = (days) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    onDateRangeChange({ start, end });
    setIsOpen(false);
  };

  const handleApply = () => {
    onDateRangeChange(tempRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    onDateRangeChange({ start, end });
    setTempRange({ start, end });
    setIsOpen(false);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors bg-white"
      >
        <Calendar className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">
          {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10">
          <div className="space-y-4">
            {/* Presets */}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Quick Presets</p>
              <div className="grid grid-cols-2 gap-2">
                {presets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => handlePreset(preset.value)}
                    className="px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Custom Range</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Start Date</label>
                  <input
                    type="date"
                    value={tempRange.start.toISOString().split('T')[0]}
                    onChange={(e) => setTempRange({
                      ...tempRange,
                      start: new Date(e.target.value)
                    })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded text-sm hover:border-slate-300 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">End Date</label>
                  <input
                    type="date"
                    value={tempRange.end.toISOString().split('T')[0]}
                    onChange={(e) => setTempRange({
                      ...tempRange,
                      end: new Date(e.target.value)
                    })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded text-sm hover:border-slate-300 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-slate-200 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;