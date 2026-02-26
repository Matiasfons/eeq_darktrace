'use client';

import { useState } from 'react';
import { Filter, Download, ChevronDown } from 'lucide-react';
import { Filters, ActionType, ACTION_TYPE_LABELS } from '@/lib/types';

interface FilterSidebarProps {
  filters: Filters;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
}

export default function FilterSidebar({ filters, updateFilter }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const formatDateForInput = (epoch: number | null) => {
    if (!epoch) return '';
    const d = new Date(epoch);
    return d.toISOString().slice(0, 16);
  };

  const handleDateChange = (key: 'dateFrom' | 'dateTo', value: string) => {
    if (!value) {
      updateFilter(key, null);
    } else {
      updateFilter(key, new Date(value).getTime());
    }
  };

  const formatDisplay = (epoch: number | null, placeholder: string) => {
    if (!epoch) return placeholder;
    const d = new Date(epoch);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const typeOptions: { value: ActionType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    ...Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({
      value: value as ActionType,
      label,
    })),
  ];

  return (
    <div className="flex h-full border-r border-dt-border bg-dt-bg shrink-0">
      {/* Narrow Strip */}
      <div className="w-12 border-dt-border flex flex-col items-center py-2 bg-[#121318] z-10 relative shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full aspect-square flex items-center justify-center transition-colors border-l-2 ${
            isOpen
              ? 'bg-[#22232b] text-dt-text border-dt-purple'
              : 'bg-transparent text-dt-text-secondary hover:bg-[#22232b] border-transparent hover:text-white'
          }`}
        >
          <Filter size={18} />
        </button>
        <button className="w-full aspect-square flex items-center justify-center text-dt-text-secondary hover:text-dt-text transition-colors mt-2">
          <Download size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={`bg-[#181920] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden border-r border-dt-border ${
          isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0'
        }`}
      >
        <div className="w-64 flex flex-col h-full shrink-0">
          <div className="h-12 border-b border-dt-border flex items-center px-4 shrink-0">
            <h2 className="text-sm font-semibold text-dt-text">Filters</h2>
          </div>

          <div className="p-4 flex flex-col gap-6 overflow-y-auto">
            {/* Date Range */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-dt-text-secondary">Show actions from:</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={formatDateForInput(filters.dateFrom)}
                  onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                  className="w-full bg-[#0b0c10] border border-dt-border rounded px-3 py-2 text-xs text-[#e2e8f0] focus:outline-none focus:border-[#7b61ff] transition-colors [color-scheme:dark]"
                />
              </div>

              <label className="text-xs text-dt-text-secondary mt-2">to:</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={formatDateForInput(filters.dateTo)}
                  onChange={(e) => handleDateChange('dateTo', e.target.value)}
                  className="w-full bg-[#0b0c10] border border-dt-border rounded px-3 py-2 text-xs text-[#e2e8f0] focus:outline-none focus:border-[#7b61ff] transition-colors [color-scheme:dark]"
                />
              </div>

              {(filters.dateFrom || filters.dateTo) && (
                <button
                  onClick={() => {
                    updateFilter('dateFrom', null);
                    updateFilter('dateTo', null);
                  }}
                  className="text-[10px] text-[#7b61ff] hover:text-white transition-colors text-left mt-1"
                >
                  Clear date filters
                </button>
              )}
            </div>

            {/* Type Selector */}
            <div className="flex flex-col gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full bg-[#0b0c10] border border-dt-border rounded px-3 py-2 text-xs flex justify-between items-center cursor-pointer hover:border-[#383944] transition-colors"
                >
                  <span className="text-[#e2e8f0]">
                    Type: {filters.actionType === 'all' ? 'All' : ACTION_TYPE_LABELS[filters.actionType]}
                  </span>
                  <ChevronDown size={12} className={`text-dt-text-secondary transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showTypeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-[#1e1e24] border border-[#2c2d36] rounded shadow-xl z-20 overflow-hidden">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          updateFilter('actionType', opt.value);
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-[#2a2a32] transition-colors ${
                          filters.actionType === opt.value
                            ? 'text-[#7b61ff] bg-[#7b61ff]/10'
                            : 'text-[#e2e8f0]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#0b0c10]/50 border border-dt-border/50 rounded px-3 py-2 text-xs flex justify-between items-center cursor-not-allowed opacity-50">
                <span className="text-dt-text-secondary">Inhibitors: Select a type</span>
                <ChevronDown size={12} className="text-dt-text-secondary" />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-dt-text-secondary">Show Manual Actions</span>
              <Toggle
                active={filters.showManual}
                onToggle={() => updateFilter('showManual', !filters.showManual)}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-dt-text-secondary">Show Blocked Status</span>
              <Toggle
                active={filters.showBlocked}
                onToggle={() => updateFilter('showBlocked', !filters.showBlocked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-8 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${
        active ? 'bg-dt-purple' : 'bg-[#33333d]'
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full bg-white transition-transform ${
          active ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
