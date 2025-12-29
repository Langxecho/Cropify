import { useState, useCallback, useRef, useEffect } from 'react';
import { ResizeSettings, ImageFile } from '@/types';

interface UseResizeScalingReturn {
  resizeSettings: ResizeSettings;
  setResizeSettings: (settings: ResizeSettings) => void;
  resetResizeSettings: (image?: ImageFile | null) => void;
}

export function useResizeScaling(selectedImage?: ImageFile | null): UseResizeScalingReturn {
  // 默认缩放设置
  const defaultSettings: ResizeSettings = {
    enabled: false,
    width: 1024,
    height: 1024,
  };

  const [resizeSettings, setResizeSettingsState] = useState<ResizeSettings>(defaultSettings);
  
  // 记忆上一次的设置 (用于新图片默认值)
  const lastSettingsRef = useRef<ResizeSettings>(defaultSettings);

  // 更新设置并同步到 ref
  const setResizeSettings = useCallback((settings: ResizeSettings) => {
    setResizeSettingsState(settings);
    
    // 如果设置被启用，或者之前就是启用状态，则更新记忆
    // 这样做的目的是：如果用户显式关闭了，我们也记住关闭状态（只要 enabled 变化了）
    // 或者简单点：总是记住最后一次的用户操作
    lastSettingsRef.current = settings;
  }, []);

  // 重置/加载设置
  const resetResizeSettings = useCallback((image?: ImageFile | null) => {
    if (!image) {
      setResizeSettingsState(defaultSettings);
      return;
    }

    if (image.resizeTarget) {
      // 1. 如果图片已有保存的设置，直接使用
      setResizeSettingsState(image.resizeTarget);
    } else {
      // 2. 如果图片没有设置（新图片），使用"记忆"的设置
      setResizeSettingsState(lastSettingsRef.current);
    }
  }, []);

  // 记录上一次的 Image ID，避免因 image 对象引用变化导致的重复重置
  const lastImageIdRef = useRef<string | undefined>(undefined);

  // 当选中图片 ID 变化时，重置
  useEffect(() => {
    // 只有当 ID 真正变化时才重置，忽略同个 ID 的对象更新
    if (selectedImage?.id !== lastImageIdRef.current) {
        lastImageIdRef.current = selectedImage?.id;
        resetResizeSettings(selectedImage);
    }
  }, [selectedImage, resetResizeSettings]);

  return {
    resizeSettings,
    setResizeSettings,
    resetResizeSettings,
  };
}
