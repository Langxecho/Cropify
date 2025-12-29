'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

interface ImageNavigationPanelProps {
  currentIndex: number;
  totalImages: number;
  onPrevious: () => void;
  onNext: () => void;
  onDelete: () => void;
}

export const ImageNavigationPanel: React.FC<ImageNavigationPanelProps> = ({
  currentIndex,
  totalImages,
  onPrevious,
  onNext,
  onDelete,
}) => {
  if (totalImages === 0) return null;

  // 计算进度百分比
  const progress = totalImages > 0 ? ((currentIndex + 1) / totalImages) * 100 : 0;

  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
      {/* 左侧：进度信息 */}
      <div className="flex items-center space-x-4 flex-1">
        <div className="text-sm font-medium text-gray-700 w-24">
          {currentIndex + 1} / {totalImages}
        </div>
        <div className="flex-1 max-w-xs h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrevious}
          disabled={currentIndex <= 0}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="上一张"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <button
          onClick={onNext}
          disabled={currentIndex >= totalImages - 1}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="下一张"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-px h-4 bg-gray-300 mx-2" />

        <button
          onClick={onDelete}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="删除当前图片"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
