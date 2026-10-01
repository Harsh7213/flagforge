import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useOnClickOutside } from '../useOnClickOutside';
import { fireEvent } from '@testing-library/react';

describe('useOnClickOutside', () => {
  it('should call handler when mousedown occurs outside the ref element', () => {
    const handler = vi.fn();
    const outerDiv = document.createElement('div');
    const innerDiv = document.createElement('div');
    outerDiv.appendChild(innerDiv);
    document.body.appendChild(outerDiv);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(innerDiv);
      useOnClickOutside(ref, handler);
    });

    // Click outside (on body directly)
    fireEvent.mouseDown(outerDiv);

    expect(handler).toHaveBeenCalledTimes(1);

    unmount();
    document.body.removeChild(outerDiv);
  });

  it('should NOT call handler when mousedown occurs inside the ref element', () => {
    const handler = vi.fn();
    const container = document.createElement('div');
    const button = document.createElement('button');
    container.appendChild(button);
    document.body.appendChild(container);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(container);
      useOnClickOutside(ref, handler);
    });

    // Click inside the ref element
    fireEvent.mouseDown(button);

    expect(handler).not.toHaveBeenCalled();

    unmount();
    document.body.removeChild(container);
  });

  it('should call handler on touchstart outside the ref element', () => {
    const handler = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(container);
      useOnClickOutside(ref, handler);
    });

    // Touch outside (directly on body)
    fireEvent.touchStart(document.body);

    expect(handler).toHaveBeenCalledTimes(1);

    unmount();
    document.body.removeChild(container);
  });

  it('should NOT call handler on touchstart inside the ref element', () => {
    const handler = vi.fn();
    const container = document.createElement('div');
    const child = document.createElement('span');
    container.appendChild(child);
    document.body.appendChild(container);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(container);
      useOnClickOutside(ref, handler);
    });

    fireEvent.touchStart(child);

    expect(handler).not.toHaveBeenCalled();

    unmount();
    document.body.removeChild(container);
  });

  it('should stop listening after component unmounts', () => {
    const handler = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(container);
      useOnClickOutside(ref, handler);
    });

    unmount();

    // Should not call after unmount
    fireEvent.mouseDown(document.body);
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });
});
