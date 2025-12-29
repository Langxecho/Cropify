'use client';

import React, { useEffect, useState } from 'react';
import {
    useImageUpload,
    useAppState,
    useCropParams,
    useViewSettings,
    useOutputSettings,
    useBatchProcessor,
    useResizeScaling,
    useImageFilter, // New hook
} from '@/hooks';
import {
    ImageImportManager,
    ImageInfoPanel,
    PreviewSystem,
    CropDemo,
    CropControlPanel,
    ViewSettings,
    AdvancedCropOptions,
    QualityControlPanel,
    BatchProcessor,
    ImageNavigationPanel,
    ImageFilterPanel, // New component
    BatchResizeView, // New component
} from '@/components/modules';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { ExportUtils } from '@/utils/exportUtils';
import { ProcessTask, AppTab } from '@/types';

/**
 * Cropify 主应用组件
 */
export const CropifyApp: React.FC = () => {
    const { images, isUploading, errors, addImages, updateImage, removeImage, clearImages, clearErrors, dismissError } =
        useImageUpload();

    const { selectedImageId, selectedImage, batchSummary, selectImage } =
        useAppState(images);
    
    // 筛选功能
    const { filterSettings, setFilterSettings, filteredImages, activeFilterCount, resetFilters } = useImageFilter(images);

    // Tab 状态
    const [activeTab, setActiveTab] = useState<AppTab>('crop');

    const { cropParams, setCropParams, resetCropParams, applyCropAnchor, applyPresetSize, applyPresetRatio } =
        useCropParams(selectedImage);

    const { zoom, showGrid, gridType, setZoom, setShowGrid, setGridType } = useViewSettings();

    const { outputSettings, setOutputSettings } = useOutputSettings();

    const {
        tasks: batchTasks,
        isProcessing,
        startBatch,
        startResizeBatch, // New
        pauseBatch,
        cancelBatch,
        retryFailed,
    } = useBatchProcessor(error => dismissError(error.id));

    const { resizeSettings, setResizeSettings } = useResizeScaling(selectedImage);

    // 左右侧面板收起状态
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

    // 当筛选结果变化，如果当前选中图片不在筛选结果中，尝试选中第一个
    useEffect(() => {
        if (filteredImages.length > 0 && selectedImageId) {
            const exists = filteredImages.find(img => img.id === selectedImageId);
            if (!exists) {
                selectImage(filteredImages[0].id);
            }
        } else if (filteredImages.length > 0 && !selectedImageId) {
             selectImage(filteredImages[0].id);
        }
    }, [filteredImages, selectedImageId, selectImage]);

    // 当选中图片变化时，重置裁剪参数（优先使用已保存的参数）
    useEffect(() => {
        resetCropParams(selectedImage, selectedImage?.cropParams);
    }, [selectedImage, resetCropParams]);

    // 自动保存裁剪参数到图片对象 (使用防抖避免频繁更新)
    useEffect(() => {
        if (selectedImageId && cropParams) {
             const timer = setTimeout(() => {
                updateImage(selectedImageId, { cropParams });
             }, 500);
             return () => clearTimeout(timer);
        }
    }, [cropParams, selectedImageId, updateImage]);

    // 自动保存缩放设置到图片对象
    useEffect(() => {
        if (selectedImageId && resizeSettings) {
            // 这里不需要防抖，因为设置改变通常通过点击触发，频率低
            updateImage(selectedImageId, { resizeTarget: resizeSettings });
        }
    }, [resizeSettings, selectedImageId, updateImage]);


    // 上一张/下一张逻辑 (基于 filteredImages)
    const handlePrevious = () => {
        if (!selectedImageId) return;
        const index = filteredImages.findIndex(img => img.id === selectedImageId);
        if (index > 0) {
            selectImage(filteredImages[index - 1].id);
        }
    };

    const handleNext = () => {
        if (!selectedImageId) return;
        const index = filteredImages.findIndex(img => img.id === selectedImageId);
        if (index < filteredImages.length - 1) {
            selectImage(filteredImages[index + 1].id);
        }
    };

    // 删除逻辑
    const handleDelete = () => {
        if (!selectedImageId) return;
        const index = filteredImages.findIndex(img => img.id === selectedImageId);
        
        // 先删除
        removeImage(selectedImageId);
        
        // 尝试跳转到下一张
        if (filteredImages.length > 1) {
             // 逻辑略微复杂，因为 removeImage 是异步更新 images，filteredImages 也会更新
             // 这里的 index 是删除前的索引
             // 实际上最好的体验是自动选择被删除后的下一张
             // 由于 React 状态更新机制，简单的 index + 1 可能不够，依赖 useEffect 自动修正选择可能更好
             // 但为了立即响应，我们可以手动计算
        }
    };

    // 判断是否为编辑模式
    const isEditMode = images && images.length > 0;
    
    // 当前索引
    const currentIndex = selectedImageId ? filteredImages.findIndex(img => img.id === selectedImageId) : -1;

    // 导出相关函数 ... (省略不变)
    const handleSingleDownload = (task: ProcessTask) => {
        if (!task.processedBlob) return;
        const originalImage = images.find(img => img.id === task.imageId);
        const originalName = originalImage?.file.name || `image_${task.imageId}`;
        const filename = ExportUtils.generateFileName(task, 0, outputSettings, originalName);
        ExportUtils.downloadFile(task.processedBlob, filename);
    };

    const handleBatchDownload = async (tasks: ProcessTask[]) => {
        await ExportUtils.batchDownload(tasks, outputSettings);
    };

    const handleZipDownload = async (tasks: ProcessTask[]) => {
        await ExportUtils.downloadAsZip(tasks, outputSettings);
    };

    return (
        <div className={isEditMode ? "h-screen flex flex-col overflow-hidden pb-6" : "min-h-screen flex flex-col"}>
            <Header
                images={images}
                onClearImages={clearImages}
                isEditMode={isEditMode}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                cropParams={cropParams}
                outputSettings={outputSettings}
                tasks={batchTasks}
                isProcessing={isProcessing}
                onStartBatch={() => startBatch(filteredImages, cropParams, outputSettings)} // Default batch uses filtered images
                onPauseBatch={pauseBatch}
                onCancelBatch={cancelBatch}
                onRetryFailed={() => retryFailed(filteredImages, cropParams, outputSettings)}
                onSingleDownload={handleSingleDownload}
                onBatchDownload={handleBatchDownload}
                onZipDownload={handleZipDownload}
            />
            {isEditMode ? (
                <div className="flex-1 flex h-0 overflow-hidden">
                    {/* 左侧面板 */}
                    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
                        leftPanelCollapsed ? 'w-0' : 'w-86'
                    } overflow-hidden flex-shrink-0 flex flex-col`}>
                         <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white z-10 flex-shrink-0">
                                <h2 className="text-lg font-medium text-gray-900">图片管理</h2>
                                <button
                                    onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="收起左侧面板"
                                >
                                    <PanelLeftClose className="w-4 h-4 text-gray-500" />
                                </button>
                        </div>

                         {/* 图片筛选面板 */}
                        <ImageFilterPanel 
                            filterSettings={filterSettings}
                            onFilterChange={setFilterSettings}
                            activeCount={activeFilterCount}
                            totalCount={images.length}
                            filteredCount={filteredImages.length}
                            onReset={resetFilters}
                        />

                        {/* 图片导入管理 (使用筛选后的列表) */}
                        <div className="flex-1 flex flex-col p-4 min-h-0">
                            <ImageImportManager
                                images={filteredImages}
                                isUploading={isUploading}
                                errors={errors}
                                selectedImageId={selectedImageId}
                                addImages={addImages}
                                removeImage={removeImage}
                                clearImages={clearImages}
                                clearErrors={clearErrors}
                                dismissError={dismissError}
                                onSelectImage={selectImage}
                            />
                        </div>
                    </div>

                    {/* 左侧面板收起时的展开按钮 */}
                    {leftPanelCollapsed && (
                        <div className="flex-shrink-0 w-8 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                            <button
                                onClick={() => setLeftPanelCollapsed(false)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="展开左侧面板"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    )}

                    {/* MAIN CONTENT AREA */}
                    {activeTab === 'crop' ? (
                        <>
                            {/* 中间主内容区域 - CROP MODE */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 flex flex-col p-4 lg:p-6 gap-4 overflow-hidden">
                                    <ImageNavigationPanel
                                        currentIndex={currentIndex}
                                        totalImages={filteredImages.length}
                                        onPrevious={handlePrevious}
                                        onNext={handleNext}
                                        onDelete={handleDelete}
                                    />
                                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-0">
                                        <PreviewSystem
                                            selectedImage={selectedImage}
                                            cropParams={cropParams}
                                            onCropChange={setCropParams}
                                            zoom={zoom}
                                            showGrid={showGrid}
                                            gridType={gridType}
                                            onZoomChange={setZoom}
                                        />
                                    </div>
                                    <div className="flex-shrink-0 h-64">
                                        <CropDemo selectedImage={selectedImage} cropParams={cropParams} />
                                    </div>
                                </div>
                            </div>

                             {/* 右侧面板收起时的展开按钮 */}
                            {rightPanelCollapsed && (
                                <div className="flex-shrink-0 w-8 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
                                    <button
                                        onClick={() => setRightPanelCollapsed(false)}
                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        title="展开右侧面板"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            )}

                            {/* 右侧面板 - CROP MODE */}
                            <div className={`bg-white border-l border-gray-200 transition-all duration-300 ${
                                rightPanelCollapsed ? 'w-0' : 'w-96'
                            } overflow-hidden flex-shrink-0`}>
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white z-10 flex-shrink-0">
                                        <h2 className="text-lg font-medium text-gray-900">工具面板</h2>
                                        <button
                                            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <PanelRightClose className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <div className="space-y-6">
                                            <CropControlPanel
                                                selectedImage={selectedImage}
                                                cropParams={cropParams}
                                                onCropChange={setCropParams}
                                                onApplyCropAnchor={applyCropAnchor}
                                                onApplyPresetSize={applyPresetSize}
                                                onApplyPresetRatio={applyPresetRatio}
                                                onReset={resetCropParams}
                                            />
                                            <div className="border-t border-gray-200"></div>
                                            <AdvancedCropOptions cropParams={cropParams} onCropChange={setCropParams} />
                                            <div className="border-t border-gray-200"></div>
                                            <ViewSettings
                                                zoom={zoom}
                                                showGrid={showGrid}
                                                gridType={gridType}
                                                onZoomChange={setZoom}
                                                onGridToggle={setShowGrid}
                                                onGridTypeChange={setGridType}
                                            />
                                            <div className="border-t border-gray-200"></div>
                                            <QualityControlPanel 
                                                outputSettings={outputSettings} 
                                                onSettingsChange={setOutputSettings}
                                                resizeSettings={resizeSettings}
                                                onResizeSettingsChange={setResizeSettings}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                         /* RESIZE MODE - FULL WIDTH */
                         <BatchResizeView
                            filteredImages={filteredImages}
                            onStartBatch={(settings) => startResizeBatch(filteredImages, settings, outputSettings)}
                            isProcessing={isProcessing}
                            onUpdateImage={updateImage}
                         />
                    )}
                </div>
            ) : (
                <EmptyState
                    images={images}
                    isUploading={isUploading}
                    errors={errors}
                    selectedImageId={selectedImageId}
                    addImages={addImages}
                    removeImage={removeImage}
                    clearImages={clearImages}
                    clearErrors={clearErrors}
                    dismissError={dismissError}
                    onSelectImage={selectImage}
                />
            )}
        </div>
    );
};
