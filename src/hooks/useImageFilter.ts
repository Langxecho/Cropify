import { useState, useMemo, useCallback } from 'react';
import { ImageFile, FilterSettings } from '@/types';

interface UseImageFilterReturn {
  filterSettings: FilterSettings;
  setFilterSettings: (settings: FilterSettings) => void;
  filteredImages: ImageFile[];
  activeFilterCount: number;
  resetFilters: () => void;
}

export function useImageFilter(images: ImageFile[]): UseImageFilterReturn {
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    minWidth: undefined,
    minHeight: undefined,
  });

  const filteredImages = useMemo(() => {
    return images.filter(image => {
      // 检查最小宽度
      if (filterSettings.minWidth !== undefined && filterSettings.minWidth > 0) {
        if (image.width <= filterSettings.minWidth) {
          return false;
        }
      }
      
      // 检查最小高度
      if (filterSettings.minHeight !== undefined && filterSettings.minHeight > 0) {
        if (image.height <= filterSettings.minHeight) {
          return false;
        }
      }

      return true;
    });
  }, [images, filterSettings]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterSettings.minWidth !== undefined && filterSettings.minWidth > 0) count++;
    if (filterSettings.minHeight !== undefined && filterSettings.minHeight > 0) count++;
    return count;
  }, [filterSettings]);

  const resetFilters = useCallback(() => {
    setFilterSettings({
      minWidth: undefined,
      minHeight: undefined,
    });
  }, []);

  return {
    filterSettings,
    setFilterSettings,
    filteredImages,
    activeFilterCount,
    resetFilters,
  };
}
