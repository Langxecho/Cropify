import React from 'react';
import { OutputSettings, ResizeSettings } from '@/types';

interface QualityControlPanelProps {
  outputSettings: OutputSettings;
  resizeSettings?: ResizeSettings;
  onSettingsChange: (settings: OutputSettings) => void;
  onResizeSettingsChange?: (settings: ResizeSettings) => void;
}

/**
 * 图像质量控制模块 - JPG/PNG 压缩设置 & 对当前图片的缩放设置
 */
export const QualityControlPanel: React.FC<QualityControlPanelProps> = ({
  outputSettings,
  resizeSettings,
  onSettingsChange,
  onResizeSettingsChange,
}) => {
  // 处理全局输出设置变化
  const handleSettingChange = (field: keyof OutputSettings, value: string | number | boolean) => {
    onSettingsChange({
      ...outputSettings,
      [field]: value,
    });
  };

  // 获取文件大小估算
  const getEstimatedSize = () => {
    const baseSize = 1024; // 1KB 基础大小
    const qualityMultiplier = outputSettings.quality / 100;

    switch (outputSettings.format) {
      case 'jpg':
        return Math.round(baseSize * qualityMultiplier * 0.8);
      case 'png':
        return Math.round(baseSize * (outputSettings.quality / 9 + 1) * 1.2);
      case 'webp':
        return Math.round(baseSize * qualityMultiplier * 0.6);
      default:
        return baseSize;
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">输出配置</h3>
      <div className="space-y-3">
        {/* 输出格式选择 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">输出格式 (全局)</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'jpg', label: 'JPG', icon: '📷' },
              { value: 'png', label: 'PNG', icon: '🖼️' },
              { value: 'webp', label: 'WebP', icon: '🚀' },
            ].map((format) => (
              <button
                key={format.value}
                onClick={() => handleSettingChange('format', format.value as 'jpg' | 'png' | 'webp')}
                className={`flex flex-col items-center p-3 border rounded-lg transition-colors ${
                  outputSettings.format === format.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="text-lg mb-1">{format.icon}</span>
                <span className="text-sm font-medium">{format.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 质量设置 */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {outputSettings.format === 'png' ? '压缩级别' : '输出质量'}
          </h4>

          {/* 质量滑块 */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                {outputSettings.format === 'png' ? '压缩级别' : '质量'}
              </span>
              <span>
                {outputSettings.format === 'png'
                  ? `${outputSettings.quality}/9`
                  : `${outputSettings.quality}%`
                }
              </span>
            </div>
            <input
              type="range"
              min={outputSettings.format === 'png' ? 0 : 1}
              max={outputSettings.format === 'png' ? 9 : 100}
              step={1}
              value={outputSettings.quality}
              onChange={(e) => handleSettingChange('quality', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* 目标尺寸缩放设置 (单图设置) */}
        {resizeSettings && onResizeSettingsChange && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                <span>目标尺寸缩放 (当前图片)</span>
                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">独立设置</span>
            </h4>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={resizeSettings.enabled}
                  onChange={(e) => {
                      onResizeSettingsChange({
                          ...resizeSettings,
                          enabled: e.target.checked
                      });
                  }}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">启用强制缩放</span>
              </label>

              {resizeSettings.enabled && (
                 <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">宽度 (px)</label>
                     <input
                       type="number"
                       value={resizeSettings.width}
                       onChange={(e) => {
                          onResizeSettingsChange({
                              ...resizeSettings,
                              width: parseInt(e.target.value) || 0
                          });
                       }}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">高度 (px)</label>
                     <input
                       type="number"
                       value={resizeSettings.height}
                       onChange={(e) => {
                          onResizeSettingsChange({
                              ...resizeSettings,
                              height: parseInt(e.target.value) || 0
                          });
                       }}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                 </div>
              )}
              <p className="text-xs text-gray-500">
                {resizeSettings.enabled 
                    ? `将导出为 ${resizeSettings.width} x ${resizeSettings.height}。切换图片时会自动记住此选项。` 
                    : "导出时不改变尺寸。切换图片时会自动记住此选项。"}
              </p>
            </div>
          </div>
        )}

        {/* 文件命名设置 (全局) */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">文件命名 (全局)</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={outputSettings.maintainOriginalName || false}
                onChange={(e) => handleSettingChange('maintainOriginalName', e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">保持原文件名</span>
            </label>

            {!outputSettings.maintainOriginalName && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">文件名前缀</label>
                  <input
                    type="text"
                    value={outputSettings.filenamePrefix || ''}
                    onChange={(e) => handleSettingChange('filenamePrefix', e.target.value)}
                    placeholder="例如: cropped_"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">文件名后缀</label>
                  <input
                    type="text"
                    value={outputSettings.filenameSuffix || ''}
                    onChange={(e) => handleSettingChange('filenameSuffix', e.target.value)}
                    placeholder="例如: _small"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 预估信息 */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">输出预估</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>输出格式:</span>
              <span className="font-medium">{outputSettings.format.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>质量设置:</span>
              <span className="font-medium">
                {outputSettings.format === 'png'
                  ? `压缩级别 ${outputSettings.quality}`
                  : `${outputSettings.quality}% 质量`
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>预估文件大小:</span>
              <span className="font-medium">~{getEstimatedSize()}KB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
