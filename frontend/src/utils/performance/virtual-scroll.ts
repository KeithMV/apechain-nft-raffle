/**
 * Virtual Scrolling Utilities
 * Efficient rendering for large lists and datasets
 */

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  offsetY: number;
  totalHeight: number;
}

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollTop: number;
}

/**
 * Virtual scrolling helper for large lists
 */
export function useVirtualScrolling(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
): VirtualScrollResult {
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(itemCount, startIndex + visibleCount);
  
  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex,
    offsetY: startIndex * itemHeight,
    totalHeight: itemCount * itemHeight
  };
}

/**
 * Advanced virtual scrolling with variable item heights
 */
export class VariableVirtualScroller {
  private itemHeights: number[] = [];
  private itemOffsets: number[] = [];
  private totalHeight = 0;
  private averageHeight = 50;

  constructor(private defaultHeight: number = 50) {
    this.averageHeight = defaultHeight;
  }

  setItemHeight(index: number, height: number): void {
    const oldHeight = this.itemHeights[index] || this.defaultHeight;
    this.itemHeights[index] = height;
    
    // Update total height
    this.totalHeight += (height - oldHeight);
    
    // Recalculate offsets from this index onwards
    this.recalculateOffsets(index);
    
    // Update average height
    this.updateAverageHeight();
  }

  getVirtualItems(
    containerHeight: number,
    scrollTop: number,
    overscan: number = 5
  ): VirtualScrollResult {
    const startIndex = this.findStartIndex(scrollTop);
    const endIndex = this.findEndIndex(scrollTop + containerHeight);
    
    const overscanStart = Math.max(0, startIndex - overscan);
    const overscanEnd = Math.min(this.itemHeights.length, endIndex + overscan);
    
    return {
      startIndex: overscanStart,
      endIndex: overscanEnd,
      visibleItems: overscanEnd - overscanStart,
      offsetY: this.getOffsetAt(overscanStart),
      totalHeight: this.totalHeight
    };
  }

  private findStartIndex(scrollTop: number): number {
    let low = 0;
    let high = this.itemOffsets.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = this.getOffsetAt(mid);
      
      if (offset < scrollTop) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    return Math.max(0, high);
  }

  private findEndIndex(scrollBottom: number): number {
    let low = 0;
    let high = this.itemOffsets.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = this.getOffsetAt(mid);
      
      if (offset < scrollBottom) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    return Math.min(this.itemHeights.length, low);
  }

  private getOffsetAt(index: number): number {
    if (index >= this.itemOffsets.length) {
      // Estimate offset for items beyond measured ones
      const measuredHeight = this.itemOffsets[this.itemOffsets.length - 1] || 0;
      const unmeasuredCount = index - this.itemOffsets.length;
      return measuredHeight + (unmeasuredCount * this.averageHeight);
    }
    
    return this.itemOffsets[index] || 0;
  }

  private recalculateOffsets(fromIndex: number): void {
    let offset = fromIndex > 0 ? this.itemOffsets[fromIndex - 1] : 0;
    
    for (let i = fromIndex; i < this.itemHeights.length; i++) {
      this.itemOffsets[i] = offset;
      offset += this.itemHeights[i] || this.defaultHeight;
    }
  }

  private updateAverageHeight(): void {
    if (this.itemHeights.length === 0) return;
    
    const totalMeasuredHeight = this.itemHeights.reduce((sum, height) => sum + height, 0);
    this.averageHeight = totalMeasuredHeight / this.itemHeights.length;
  }

  getTotalHeight(): number {
    return this.totalHeight;
  }

  reset(): void {
    this.itemHeights = [];
    this.itemOffsets = [];
    this.totalHeight = 0;
    this.averageHeight = this.defaultHeight;
  }
}

/**
 * Simple virtual grid for 2D scrolling
 */
export interface VirtualGridResult {
  startRowIndex: number;
  endRowIndex: number;
  startColIndex: number;
  endColIndex: number;
  visibleRows: number;
  visibleCols: number;
  offsetY: number;
  offsetX: number;
}

export function useVirtualGrid(
  rowCount: number,
  colCount: number,
  rowHeight: number,
  colWidth: number,
  containerHeight: number,
  containerWidth: number,
  scrollTop: number,
  scrollLeft: number,
  overscan: number = 1
): VirtualGridResult {
  const visibleRows = Math.ceil(containerHeight / rowHeight);
  const visibleCols = Math.ceil(containerWidth / colWidth);
  
  const startRowIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRowIndex = Math.min(rowCount, startRowIndex + visibleRows + overscan * 2);
  
  const startColIndex = Math.max(0, Math.floor(scrollLeft / colWidth) - overscan);
  const endColIndex = Math.min(colCount, startColIndex + visibleCols + overscan * 2);
  
  return {
    startRowIndex,
    endRowIndex,
    startColIndex,
    endColIndex,
    visibleRows: endRowIndex - startRowIndex,
    visibleCols: endColIndex - startColIndex,
    offsetY: startRowIndex * rowHeight,
    offsetX: startColIndex * colWidth
  };
}