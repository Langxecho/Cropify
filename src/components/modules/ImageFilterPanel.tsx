'use client';

import React from 'react';
import { FilterSettings } from '@/types';
import { Filter, X } from 'lucide-react';

interface ImageFilterPanelProps {
  filterSettings: FilterSettings;
  onFilterChange: (settings: FilterSettings) => void;
  activeCount: number;
  totalCount: number;
  filteredCount: number;
  onReset: () => void;
}

export const ImageFilterPanel: React.FC<ImageFilterPanelProps> = ({
  filterSettings,
  onFilterChange,
  activeCount,
  totalCount,
  filteredCount,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // 处理输入变化
  const handleInputChange = (field: keyof FilterSettings, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value);
    onFilterChange({
      ...filterSettings,
      [field]: numValue,
    });
  };

  if (totalCount === 0) return null;

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* 头部 toggle */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Filter className={`w-4 h-4 ${activeCount > 0 ? 'text-blue-500' : 'text-gray-500'}`} />
          <span className="text-sm font-medium text-gray-700">图片筛选</span>
          {activeCount > 0 && (
             <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
               已筛选 {filteredCount}/{totalCount}
             </span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {isExpanded ? '收起' : '展开'}
        </div>
      </div>

      {/* 筛选内容区域 */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">最小宽度 (px)</label>
              <input
                type="number"
                value={filterSettings.minWidth || ''}
                onChange={(e) => handleInputChange('minWidth', e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">最小高度 (px)</label>
              <input
                type="number"
                value={filterSettings.minHeight || ''}
                onChange={(e) => handleInputChange('minHeight', e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {activeCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="flex items-center text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                清空筛选
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
