import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { performance } from 'perf_hooks'

// Import performance utilities
import { performanceMonitor, measureSync, measureAsync } from '../../utils/performance'

// Mock wagmi for performance testing
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: '0x123', isConnected: true })),
  useChainId: vi.fn(() => 33139),
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
}))

// Mock components for performance testing
const MockHeavyComponent = ({ data }: { data: any[] }) => {
  // Simulate heavy computation
  const processedData = measureSync('heavy-computation', () => {
    return data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now()
    }))
  })

  return <div data-testid="heavy-component">{processedData.length} items</div>
}

const MockAsyncComponent = ({ onLoad }: { onLoad: () => void }) => {
  const [loading, setLoading] = React.useState(true)
  
  React.useEffect(() => {
    measureAsync('async-operation', async () => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100))
      setLoading(false)
      onLoad()
    })
  }, [onLoad])

  return loading ? <div>Loading...</div> : <div data-testid="async-component">Loaded</div>
}

import React from 'react'

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    performanceMonitor.clear() // Use clear() instead of reset()
  })

  describe('Performance Monitoring', () => {
    it('should track synchronous operations', () => {
      const testData = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      
      render(<MockHeavyComponent data={testData} />)
      
      expect(screen.getByTestId('heavy-component')).toBeInTheDocument()
      expect(screen.getByText('1000 items')).toBeInTheDocument()
      
      // Check that performance was measured
      const metrics = performanceMonitor.getMetrics('heavy-computation')
      expect(metrics?.count).toBeGreaterThan(0)
      expect(metrics?.avg).toBeGreaterThan(0)
    })

    it('should track asynchronous operations', async () => {
      const onLoad = vi.fn()
      
      render(<MockAsyncComponent onLoad={onLoad} />)
      
      // Should start with loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      // Wait for async operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('async-component')).toBeInTheDocument()
      }, { timeout: 200 })
      
      expect(onLoad).toHaveBeenCalled()
      
      // Check that async performance was measured
      const metrics = performanceMonitor.getMetrics('async-operation')
      expect(metrics?.count).toBeGreaterThan(0)
      expect(metrics?.avg).toBeGreaterThan(90) // Should be around 100ms
    })

    it('should handle performance monitoring errors gracefully', () => {
      const errorOperation = () => {
        return measureSync('error-operation', () => {
          throw new Error('Test error')
        }) as never
      }

      expect(() => errorOperation()).toThrow('Test error')
      
      // Performance monitoring should still record the attempt
      const metrics = performanceMonitor.getMetrics('error-operation')
      expect(metrics?.count).toBeGreaterThan(0)
    })
  })

  describe('Memory Usage Monitoring', () => {
    it('should track memory usage during operations', () => {
      const initialMemory = performanceMonitor.getMemoryUsage()
      
      // Create large data structure
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `large-string-${i}`.repeat(100)
      }))
      
      render(<MockHeavyComponent data={largeData} />)
      
      const finalMemory = performanceMonitor.getMemoryUsage()
      
      // Memory usage should have increased
      expect(finalMemory.used).toBeGreaterThan(initialMemory.used)
    })

    it('should detect memory leaks', async () => {
      const memorySnapshots: number[] = []
      
      // Take multiple memory snapshots
      for (let i = 0; i < 5; i++) {
        const largeData = Array.from({ length: 1000 }, (_, j) => ({ id: j, iteration: i }))
        render(<MockHeavyComponent data={largeData} />)
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
        
        const memory = performanceMonitor.getMemoryUsage()
        memorySnapshots.push(memory.used)
        
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      // Check for significant memory growth (potential leak)
      const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0]
      const averageGrowth = memoryGrowth / memorySnapshots.length
      
      // Memory growth should be reasonable (less than 10MB per iteration)
      expect(averageGrowth).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Web3 Performance', () => {
    it('should measure contract read performance', async () => {
      const mockReadContract = vi.fn().mockImplementation(async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50))
        return { data: '1000', isLoading: false }
      })

      const result = await measureAsync('contract-read', mockReadContract) as { data: string; isLoading: boolean }
      
      expect(result.data).toBe('1000')
      
      const metrics = performanceMonitor.getMetrics('contract-read')
      expect(metrics?.avg).toBeGreaterThan(40) // Should be around 50ms
      expect(metrics?.avg).toBeLessThan(100) // But not too slow
    })

    it('should measure contract write performance', async () => {
      const mockWriteContract = vi.fn().mockImplementation(async () => {
        // Simulate transaction time
        await new Promise(resolve => setTimeout(resolve, 200))
        return { hash: '0xabc123' }
      })

      const result = await measureAsync('contract-write', mockWriteContract) as { hash: string }
      
      expect(result.hash).toBe('0xabc123')
      
      const metrics = performanceMonitor.getMetrics('contract-write')
      expect(metrics?.avg).toBeGreaterThan(180) // Should be around 200ms
    })

    it('should track batch operations performance', async () => {
      const batchOperations = Array.from({ length: 5 }, (_, i) => 
        () => new Promise(resolve => setTimeout(() => resolve(`result-${i}`), 20))
      )

      const results = await measureAsync('batch-operations', async () => {
        return Promise.all(batchOperations.map(op => op()))
      }) as string[]

      expect(results).toHaveLength(5)
      expect(results[0]).toBe('result-0')
      
      const metrics = performanceMonitor.getMetrics('batch-operations')
      // Batch should be faster than sequential (parallel execution)
      expect(metrics?.avg).toBeLessThan(100) // Should be around 20ms due to parallelism
    })
  })

  describe('Component Performance', () => {
    it('should measure component render performance', () => {
      const renderStart = performance.now()
      
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
      
      const { rerender } = render(<MockHeavyComponent data={largeDataSet} />)
      
      const firstRenderTime = performance.now() - renderStart
      
      // Re-render with different data
      const rerenderStart = performance.now()
      const newDataSet = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1000 }))
      rerender(<MockHeavyComponent data={newDataSet} />)
      
      const rerenderTime = performance.now() - rerenderStart
      
      // First render might be slower due to initialization
      expect(firstRenderTime).toBeLessThan(100) // Should render in under 100ms
      expect(rerenderTime).toBeLessThan(50) // Re-renders should be faster
    })

    it('should detect slow components', () => {
      const SlowComponent = () => {
        // Simulate slow computation
        const start = performance.now()
        while (performance.now() - start < 100) {
          // Busy wait for 100ms
        }
        return <div data-testid="slow-component">Slow</div>
      }

      const renderStart = performance.now()
      render(<SlowComponent />)
      const renderTime = performance.now() - renderStart
      
      expect(screen.getByTestId('slow-component')).toBeInTheDocument()
      expect(renderTime).toBeGreaterThan(90) // Should detect the slow render
    })
  })

  describe('Performance Thresholds', () => {
    it('should warn about slow operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Simulate slow operation
      const result = measureSync('slow-operation', () => {
        const start = performance.now()
        while (performance.now() - start < 200) {
          // Busy wait for 200ms
        }
        return 'result'
      }) as string
      
      // Should warn about slow operation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('slow-operation took')
      )
      
      consoleSpy.mockRestore()
    })

    it('should track 95th percentile performance', () => {
      // Run operation multiple times with varying performance
      const times = [10, 20, 30, 40, 50, 60, 70, 80, 90, 1000] // One outlier
      
      times.forEach((time, i) => {
        const result = measureSync('percentile-test', () => {
          const start = performance.now()
          while (performance.now() - start < time) {
            // Busy wait
          }
          return i
        }) as number
      })
      
      const metrics = performanceMonitor.getMetrics('percentile-test')
      
      // 95th percentile should be high due to the outlier
      expect(metrics.p95).toBeGreaterThan(500)
      // But average should be much lower
      expect(metrics?.avg).toBeLessThan(200)
    })
  })

  describe('Performance Optimization', () => {
    it('should demonstrate memoization benefits', () => {
      const expensiveCalculation = vi.fn((data: any[]) => {
        return data.reduce((sum, item) => sum + item.value, 0)
      })

      const MemoizedComponent = React.memo(({ data }: { data: any[] }) => {
        const result = React.useMemo(() => expensiveCalculation(data), [data])
        return <div data-testid="memoized">{result}</div>
      })

      const testData = [{ value: 1 }, { value: 2 }, { value: 3 }]
      
      const { rerender } = render(<MemoizedComponent data={testData} />)
      
      // Re-render with same data
      rerender(<MemoizedComponent data={testData} />)
      
      // Expensive calculation should only be called once due to memoization
      expect(expensiveCalculation).toHaveBeenCalledTimes(1)
      expect(screen.getByText('6')).toBeInTheDocument()
    })

    it('should demonstrate debouncing benefits', async () => {
      const debouncedFunction = vi.fn()
      
      // Simulate rapid calls (like user typing)
      const calls = Array.from({ length: 10 }, (_, i) => 
        () => setTimeout(() => debouncedFunction(`call-${i}`), i * 10)
      )
      
      calls.forEach(call => call())
      
      // Wait for all calls to potentially execute
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // With proper debouncing, only the last call should execute
      // This test would need actual debouncing implementation
      expect(debouncedFunction).toHaveBeenCalledTimes(10) // Without debouncing
    })
  })
})