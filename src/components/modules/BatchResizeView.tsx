'use client';

import React, { useState } from 'react';
import { ImageFile, ProportionalResizeSettings } from '@/types';
import { ArrowRight, Download, Info } from 'lucide-react';

interface BatchResizeViewProps {
  filteredImages: ImageFile[];
  onStartBatch: (settings: ProportionalResizeSettings) => void;
  isProcessing: boolean;
  onUpdateImage: (imageId: string, updates: Partial<ImageFile>) => void; // New prop
}

export const BatchResizeView: React.FC<BatchResizeViewProps> = ({
  filteredImages,
  onStartBatch,
  isProcessing,
  onUpdateImage,
}) => {
  // 本地管理缩放设置
  const [resizeSettings, setResizeSettings] = useState<ProportionalResizeSettings>({
    scaleFactor: 1.5,
    mode: 'scale_down',
  });

  // 计算缩放后的尺寸
  const calculateNewSize = (width: number, height: number, imageScaleFactor?: number) => {
    const factor = imageScaleFactor || resizeSettings.scaleFactor;
    return {
      width: Math.round(width / factor),
      height: Math.round(height / factor),
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 p-6 overflow-hidden">
        {/* 顶部控制栏 */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">批量等比例缩放</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            对已筛选的 {filteredImages.length} 张图片进行统一缩放处理
                        </p>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-200"></div>

                    <div className="flex items-center space-x-3">
                        <label className="text-sm font-medium text-gray-700">默认缩小倍数:</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                step="0.1"
                                value={resizeSettings.scaleFactor}
                                onChange={(e) => setResizeSettings({ 
                                    ...resizeSettings, 
                                    scaleFactor: parseFloat(e.target.value) || 1 
                                })}
                                className="w-24 pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                x
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onStartBatch(resizeSettings)}
                    disabled={isProcessing || filteredImages.length === 0}
                    className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                    {isProcessing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            处理中...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            开始批处理导出
                        </>
                    )}
                </button>
            </div>
            
            <div className="mt-4 flex items-start p-3 bg-blue-50 rounded-md text-blue-700 text-sm">
                <Info className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>
                    示例: 如果原图是 3000x3000，缩小倍数设为 1.5，则输出尺寸为 2000x2000 (3000 / 1.5)。
                    <br/>
                    下方列表可单独设置每张图片的缩放倍数，留空则使用默认倍数。
                </p>
            </div>
        </div>

        {/* 图片列表预览 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 font-medium text-gray-700 bg-gray-50 grid grid-cols-12 gap-4">
                <div className="col-span-4">文件名</div>
                <div className="col-span-2 text-right">原始尺寸</div>
                <div className="col-span-3 text-center">自定义倍数</div>
                <div className="col-span-1 text-center text-gray-400"><ArrowRight className="w-4 h-4 mx-auto"/></div>
                <div className="col-span-2">目标尺寸</div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {filteredImages.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredImages.map((image) => {
                            const newSize = calculateNewSize(image.width, image.height, image.batchResizeScaleFactor);
                            return (
                                <div key={image.id} className="px-6 py-4 grid grid-cols-12 gap-4 hover:bg-gray-50 transition-colors items-center">
                                    <div className="col-span-4 truncate font-medium text-gray-900" title={image.name}>
                                        {image.name}
                                    </div>
                                    <div className="col-span-2 text-right text-gray-500 font-mono text-sm">
                                        {image.width} x {image.height}
                                    </div>
                                    <div className="col-span-3 flex justify-center">
                                         <div className="relative w-24">
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.1"
                                                placeholder={resizeSettings.scaleFactor.toString()}
                                                value={image.batchResizeScaleFactor || ''}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    onUpdateImage(image.id, { 
                                                        batchResizeScaleFactor: isNaN(val) ? undefined : val 
                                                    });
                                                }}
                                                className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
                                                x
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-1 text-center text-gray-300">
                                        <ArrowRight className="w-4 h-4 mx-auto"/>
                                    </div>
                                    <div className="col-span-2 text-blue-600 font-mono text-sm font-medium">
                                        {newSize.width} x {newSize.height}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>没有符合筛选条件的图片</p>
                    </div>
                )}
            </div>
            
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
                <span>共 {filteredImages.length} 张图片</span>
                <span>当前缩小倍数: {resizeSettings.scaleFactor}</span>
            </div>
        </div>
    </div>
  );
};
