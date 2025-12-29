'use client';

import { useState, useCallback, useRef } from 'react';
import { ImageFile, CropParams, OutputSettings, ProcessTask, ProcessStatus, AppError, ProportionalResizeSettings } from '@/types';
import { generateId, ImageProcessor } from '@/utils';
import { ERROR_MESSAGES } from '@/constants';

interface UseBatchProcessorReturn {
  tasks: ProcessTask[];
  isProcessing: boolean;
  startBatch: (images: ImageFile[], cropParams: CropParams, outputSettings: OutputSettings) => void;
  startResizeBatch: (images: ImageFile[], resizeSettings: ProportionalResizeSettings, outputSettings: OutputSettings) => void; // New
  pauseBatch: () => void;
  cancelBatch: () => void;
  retryFailed: (images: ImageFile[], cropParams: CropParams, outputSettings: OutputSettings) => void;
  addError: (error: AppError) => void;
}

/**
 * 批处理管理 Hook
 */
export function useBatchProcessor(onError: (error: AppError) => void): UseBatchProcessorReturn {
  const [tasks, setTasks] = useState<ProcessTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 添加错误
  const addError = useCallback((error: AppError) => {
    onError(error);
  }, [onError]);

  // 更新任务状态
  const updateTask = useCallback((taskId: string, updates: Partial<ProcessTask>) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  // 处理单个图片
  const processImage = useCallback(async (
    image: ImageFile,
    task: ProcessTask,
    abortSignal: AbortSignal
  ): Promise<void> => {
    try {
      if (abortSignal.aborted) {
        updateTask(task.id, { status: ProcessStatus.CANCELLED });
        return;
      }

      updateTask(task.id, {
        status: ProcessStatus.PROCESSING,
        progress: 0
      });

      const img = new Image();
      img.crossOrigin = 'anonymous';

      const imagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = image.url;
      });

      const imageElement = await imagePromise;

      if (abortSignal.aborted) {
        updateTask(task.id, { status: ProcessStatus.CANCELLED });
        return;
      }

      updateTask(task.id, { progress: 25 });

      const processor = new ImageProcessor();

      updateTask(task.id, { progress: 50 });

      if (abortSignal.aborted) {
        updateTask(task.id, { status: ProcessStatus.CANCELLED });
        return;
      }

      let processedBlob: Blob;

      // 根据任务类型执行不同处理
      if (task.processType === 'resize' && task.resizeSettings) {
          // 执行等比例缩放
          processedBlob = await processor.resizeImageProportionally(imageElement, task.resizeSettings.scaleFactor);
      } else {
          // 执行裁剪 (默认)
          // 缩放设置：优先使用图片保存的 resizeTarget
          const resizeSettings = image.resizeTarget || { enabled: false, width: 1024, height: 1024 };
          // 确保 cropParams 存在
          const effectiveCropParams = task.cropParams || { width: 100, height: 100, x: 0, y: 0 };
          processedBlob = await processor.cropImage(imageElement, effectiveCropParams, resizeSettings);
      }

      updateTask(task.id, { progress: 75 });

      if (abortSignal.aborted) {
        updateTask(task.id, { status: ProcessStatus.CANCELLED });
        return;
      }

      // 转换为最终格式
      const finalBlob = await convertBlobFormat(processedBlob, task.outputSettings);
      const processedUrl = URL.createObjectURL(finalBlob);

      updateTask(task.id, {
        status: ProcessStatus.COMPLETED,
        progress: 100,
        processedBlob: finalBlob,
        processedUrl,
      });

    } catch (error) {
      console.error('处理图片失败:', error);
      updateTask(task.id, {
        status: ProcessStatus.FAILED,
        error: error instanceof Error ? error.message : '处理失败',
        progress: 0,
      });

      addError({
        id: generateId(),
        type: 'processing',
        message: ERROR_MESSAGES.PROCESSING_FAILED,
        details: `文件: ${image.name}`,
        timestamp: Date.now(),
      });
    }
  }, [updateTask, addError]);

  // 格式转换函数 (无需更改)
  const convertBlobFormat = async (
    blob: Blob,
    settings: OutputSettings
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const mimeType = `image/${settings.format === 'jpg' ? 'jpeg' : settings.format}`;
        const quality = settings.format === 'png'
          ? undefined 
          : settings.quality / 100;

        canvas.toBlob((convertedBlob) => {
          if (convertedBlob) {
            resolve(convertedBlob);
          } else {
            reject(new Error('格式转换失败'));
          }
        }, mimeType, quality);
      };

      img.onerror = () => reject(new Error('图片格式转换失败'));
      img.src = URL.createObjectURL(blob);
    });
  };

  // 通用批处理执行逻辑
  const executeBatch = useCallback(async (newTasks: ProcessTask[], images: ImageFile[]) => {
      if (isProcessing) return;

      setIsProcessing(true);
      processingRef.current = true;
      abortControllerRef.current = new AbortController();

      try {
        setTasks(newTasks);

        const pendingTasks = newTasks.filter(task =>
          task.status === ProcessStatus.PENDING || task.status === ProcessStatus.FAILED
        );

        for (const task of pendingTasks) {
          if (!processingRef.current || abortControllerRef.current?.signal.aborted) {
            break;
          }

          const image = images.find(img => img.id === task.imageId);
          if (!image) continue;

          await processImage(image, task, abortControllerRef.current.signal);

          await new Promise(resolve => setTimeout(resolve, 50));
        }

      } catch (error) {
        console.error('批处理出错:', error);
        addError({
          id: generateId(),
          type: 'processing',
          message: '批处理过程中出现错误',
          details: error instanceof Error ? error.message : '未知错误',
          timestamp: Date.now(),
        });
      } finally {
        setIsProcessing(false);
        processingRef.current = false;
        abortControllerRef.current = null;
      }
  }, [isProcessing, processImage, addError]);


  // 开始智能裁剪批处理
  const startBatch = useCallback(async (
    images: ImageFile[],
    cropParams: CropParams,
    outputSettings: OutputSettings
  ) => {
    const newTasks: ProcessTask[] = images.map(image => {
        const existingTask = tasks.find(t => t.imageId === image.id && t.processType === 'crop');
        if (existingTask && existingTask.status === ProcessStatus.COMPLETED) return existingTask;

        return {
          id: existingTask?.id || generateId(),
          imageId: image.id,
          status: ProcessStatus.PENDING,
          progress: 0,
          processType: 'crop',
          cropParams: image.cropParams ? { ...image.cropParams } : { ...cropParams },
          outputSettings: { ...outputSettings },
        };
      });
      
      await executeBatch(newTasks, images);
  }, [tasks, executeBatch]);

  // (NEW) 开始等比例缩放批处理
  const startResizeBatch = useCallback(async (
    images: ImageFile[],
    resizeSettings: ProportionalResizeSettings,
    outputSettings: OutputSettings
  ) => {
      const newTasks: ProcessTask[] = images.map(image => {
           // 优先使用图片个体的缩放倍数，如果没有则使用全局设置
           const effectiveResizeSettings = image.batchResizeScaleFactor ? {
               ...resizeSettings,
               scaleFactor: image.batchResizeScaleFactor
           } : { ...resizeSettings };

           return {
               id: generateId(),
               imageId: image.id,
               status: ProcessStatus.PENDING,
               progress: 0,
               processType: 'resize',
               resizeSettings: effectiveResizeSettings,
               outputSettings: { ...outputSettings },
               cropParams: { width: 0, height: 0, x: 0, y: 0 } 
           };
      });

      await executeBatch(newTasks, images);
  }, [executeBatch]);

  // 暂停批处理
  const pauseBatch = useCallback(() => {
    processingRef.current = false;
    abortControllerRef.current?.abort();
    setIsProcessing(false);
  }, []);

  // 取消/重置批处理
  const cancelBatch = useCallback(() => {
    processingRef.current = false;
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    setTasks([]);
  }, []);

  // 重试失败的任务 (仅针对 crop，resize 重试逻辑暂略，可复用但需判断类型)
  const retryFailed = useCallback(async (
    images: ImageFile[],
    cropParams: CropParams,
    outputSettings: OutputSettings
  ) => {
     // 简化逻辑：重试只针对智能裁剪，或者需要传入当前模式。
     // 目前保留原逻辑调用 startBatch
     await startBatch(images, cropParams, outputSettings);
  }, [startBatch]);

  return {
    tasks,
    isProcessing,
    startBatch,
    startResizeBatch, // Export new function
    pauseBatch,
    cancelBatch,
    retryFailed,
    addError,
  };
}
