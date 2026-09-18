'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Axis = 'horizontal' | 'vertical';

interface PanelResizeHandleProps {
  axis: Axis;
  /** Called with pixel delta along the resize axis (positive = grow first panel). */
  onDrag: (deltaPx: number) => void;
  onDragEnd?: () => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

/**
 * Accessible drag handle for splitting adjacent panels.
 * Uses pointer events so it works with mouse and touch.
 */
export function PanelResizeHandle({
  axis,
  onDrag,
  onDragEnd,
  className = '',
  label,
  disabled = false,
}: PanelResizeHandleProps) {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      dragging.current = true;
      lastPos.current = axis === 'horizontal' ? e.clientX : e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.classList.add(
        axis === 'horizontal' ? 'sm-resizing-col' : 'sm-resizing-row',
      );
    },
    [axis, disabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const pos = axis === 'horizontal' ? e.clientX : e.clientY;
      const delta = pos - lastPos.current;
      if (delta !== 0) {
        lastPos.current = pos;
        onDrag(delta);
      }
    },
    [axis, onDrag],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      dragging.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      document.body.classList.remove('sm-resizing-col', 'sm-resizing-row');
      onDragEnd?.();
    },
    [onDragEnd],
  );

  return (
    <div
      role="separator"
      aria-orientation={axis === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-label={label || (axis === 'horizontal' ? 'Resize panels horizontally' : 'Resize panels vertically')}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      className={`sm-resize-handle sm-resize-handle--${axis === 'horizontal' ? 'col' : 'row'} ${disabled ? 'is-disabled' : ''} ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={(e) => {
        if (disabled) return;
        const step = e.shiftKey ? 40 : 16;
        if (axis === 'horizontal') {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onDrag(-step);
            onDragEnd?.();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            onDrag(step);
            onDragEnd?.();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          onDrag(-step);
          onDragEnd?.();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onDrag(step);
          onDragEnd?.();
        }
      }}
    >
      <span className="sm-resize-grip" aria-hidden />
    </div>
  );
}

const STORAGE_PREFIX = 'ff-options-lab-layout:v1';

export function usePersistedLayoutNumber(
  key: string,
  defaultValue: number,
  min: number,
  max: number,
): [number, (v: number | ((prev: number) => number)) => void] {
  const storageKey = `${STORAGE_PREFIX}:${key}`;
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw == null) return;
      const n = Number(raw);
      if (Number.isFinite(n)) {
        setValue(Math.min(max, Math.max(min, n)));
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, min, max]);

  const setAndPersist = useCallback(
    (next: number | ((prev: number) => number)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        const clamped = Math.min(max, Math.max(min, resolved));
        try {
          localStorage.setItem(storageKey, String(clamped));
        } catch {
          /* ignore */
        }
        return clamped;
      });
    },
    [storageKey, min, max],
  );

  return [value, setAndPersist];
}
