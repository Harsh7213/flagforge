import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately (before delay elapses)', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('should still return the initial value before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' }
    });

    rerender({ value: 'updated' });

    // Only 100ms has passed — debounce should NOT have fired yet
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('initial');
  });

  it('should return the new value after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' }
    });

    rerender({ value: 'updated' });

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('updated');
  });

  it('should reset the timer when the value changes before delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' }
    });

    rerender({ value: 'second' });
    act(() => vi.advanceTimersByTime(200)); // 200ms — timer reset

    rerender({ value: 'third' });
    act(() => vi.advanceTimersByTime(200)); // only 200ms since last change

    // 400ms total but timer was reset, so debounced value should not have changed yet
    expect(result.current).toBe('first');

    // Now advance the remaining 100ms
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('third');
  });

  it('should handle numeric values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 0 }
    });

    rerender({ value: 42 });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe(42);
  });

  it('should handle object values by reference', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: obj1 }
    });

    rerender({ value: obj2 });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toEqual(obj2);
  });
});
