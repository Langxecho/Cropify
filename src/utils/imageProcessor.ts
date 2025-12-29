import { CropParams } from '@/types';

/**
 * 图片裁剪处理工具类
 */
export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = context;
  }

  /**
   * 应用裁剪参数到图片
   * @param imageElement 原始图片元素
   * @param cropParams 裁剪参数
   * @param outputSettings 输出设置（可选）
   * @returns Promise<Blob> 处理后的图片Blob
   */
  async cropImage(imageElement: HTMLImageElement, cropParams: CropParams, outputSettings?: { resizeTarget?: { enabled: boolean; width: number; height: number } }): Promise<Blob> {
    const { 
      width, 
      height, 
      x, 
      y, 
      rotation = 0, 
      flipHorizontal = false, 
      flipVertical = false,
      borderRadius = 0
    } = cropParams;
    
    // 设置画布尺寸
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 清空画布
    this.ctx.clearRect(0, 0, width, height);
    
    // 保存当前状态
    this.ctx.save();
    
    // 移动到画布中心进行变换
    this.ctx.translate(width / 2, height / 2);
    
    // 应用旋转
    if (rotation !== 0) {
      this.ctx.rotate((rotation * Math.PI) / 180);
    }
    
    // 应用翻转
    const scaleX = flipHorizontal ? -1 : 1;
    const scaleY = flipVertical ? -1 : 1;
    this.ctx.scale(scaleX, scaleY);
    
    // 如果有圆角，设置裁剪路径
    if (borderRadius > 0) {
      this.ctx.restore();
      this.ctx.save();
      
      // 将百分比转换为实际像素半径
      const actualRadius = Math.min(width, height) * borderRadius / 2;
      
      // 创建圆角矩形裁剪路径
      this.createRoundedRectPath(0, 0, width, height, actualRadius);
      this.ctx.clip();
      
      // 重新应用变换
      this.ctx.translate(width / 2, height / 2);
      if (rotation !== 0) {
        this.ctx.rotate((rotation * Math.PI) / 180);
      }
      this.ctx.scale(scaleX, scaleY);
    }
    
    // 绘制裁剪的图片部分
    this.ctx.drawImage(
      imageElement,
      x, y, width, height, // 源图片裁剪区域
      -width / 2, -height / 2, width, height // 目标画布区域
    );
    
    // 恢复状态
    this.ctx.restore();

    // 处理缩放
    if (outputSettings?.resizeTarget?.enabled) {
        const { width: targetWidth, height: targetHeight } = outputSettings.resizeTarget;
        
        // 创建临时画布进行缩放
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
            // 使用高质量插值算法 (如果浏览器支持)
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            
            // 将原始裁剪结果绘制到缩放画布
            tempCtx.drawImage(this.canvas, 0, 0, width, height, 0, 0, targetWidth, targetHeight);
            
            // 将缩放后的结果复制回主画布（或者直接返回tempCanvas的blob）
            // 这里我们直接利用 tempCanvas 生成 blob
            return new Promise((resolve, reject) => {
                tempCanvas.toBlob((blob) => {
                    if (blob) {
                         resolve(blob);
                    } else {
                         reject(new Error('图片缩放失败'));
                    }
                }, 'image/png'); // 这里可以根据 outputSettings.format 优化，目前暂定png
            });
        }
    }
    
    // 转换为Blob
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('图片处理失败'));
        }
      }, 'image/png');
    });
  }

  /**
   * 生成预览图片URL
   * @param imageElement 原始图片元素  
   * @param cropParams 裁剪参数
   * @returns 预览图片的Data URL
   */
  generatePreview(imageElement: HTMLImageElement, cropParams: CropParams): string {
    const { 
      width, 
      height, 
      x, 
      y, 
      rotation = 0, 
      flipHorizontal = false, 
      flipVertical = false,
      borderRadius = 0
    } = cropParams;
    
    // 创建小尺寸预览
    const previewSize = Math.min(300, Math.max(width, height));
    const scale = previewSize / Math.max(width, height);
    
    const previewWidth = width * scale;
    const previewHeight = height * scale;
    
    this.canvas.width = previewWidth;
    this.canvas.height = previewHeight;
    
    this.ctx.clearRect(0, 0, previewWidth, previewHeight);
    this.ctx.save();
    
    // 移动到中心
    this.ctx.translate(previewWidth / 2, previewHeight / 2);
    
    // 应用变换
    if (rotation !== 0) {
      this.ctx.rotate((rotation * Math.PI) / 180);
    }
    
    const scaleX = flipHorizontal ? -1 : 1;
    const scaleY = flipVertical ? -1 : 1;
    this.ctx.scale(scaleX, scaleY);
    
    // 处理圆角
    if (borderRadius > 0) {
      this.ctx.restore();
      this.ctx.save();
      
      // 将百分比转换为实际像素半径
      const actualRadius = Math.min(previewWidth, previewHeight) * borderRadius / 2;
      
      this.createRoundedRectPath(0, 0, previewWidth, previewHeight, actualRadius);
      this.ctx.clip();
      
      this.ctx.translate(previewWidth / 2, previewHeight / 2);
      if (rotation !== 0) {
        this.ctx.rotate((rotation * Math.PI) / 180);
      }
      this.ctx.scale(scaleX, scaleY);
    }
    
    this.ctx.drawImage(
      imageElement,
      x, y, width, height,
      -previewWidth / 2, -previewHeight / 2, previewWidth, previewHeight
    );
    
    this.ctx.restore();
    
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * 创建圆角矩形路径
   * @param x X坐标
   * @param y Y坐标
   * @param width 宽度
   * @param height 高度
   * @param radius 圆角半径
   */
  private createRoundedRectPath(x: number, y: number, width: number, height: number, radius: number): void {
    const actualRadius = Math.min(radius, width / 2, height / 2);
    
    this.ctx.beginPath();
    this.ctx.moveTo(x + actualRadius, y);
    this.ctx.lineTo(x + width - actualRadius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + actualRadius);
    this.ctx.lineTo(x + width, y + height - actualRadius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - actualRadius, y + height);
    this.ctx.lineTo(x + actualRadius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - actualRadius);
    this.ctx.lineTo(x, y + actualRadius);
    this.ctx.quadraticCurveTo(x, y, x + actualRadius, y);
    this.ctx.closePath();
  }

  /**
   * 计算旋转后的图片尺寸
   * @param width 原始宽度
   * @param height 原始高度
   * @param rotation 旋转角度（度）
   * @returns 旋转后的尺寸
   */
  static calculateRotatedSize(width: number, height: number, rotation: number): { width: number; height: number } {
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    
    const rotatedWidth = width * cos + height * sin;
    const rotatedHeight = width * sin + height * cos;
    
    return {
      width: Math.ceil(rotatedWidth),
      height: Math.ceil(rotatedHeight)
    };
  }
}