/**
 * Shared ECharts dataZoom — thin, single-border range slider used across Options Lab charts.
 */
import type { DataZoomComponentOption } from 'echarts';

export type ThinDataZoomAccent = 'teal' | 'blue' | 'sky';

const ACCENTS: Record<
  ThinDataZoomAccent,
  { fill: string; handle: string; selectedLine: string; selectedArea: string }
> = {
  teal: {
    fill: 'rgba(15, 118, 110, 0.16)',
    handle: '#0F766E',
    selectedLine: '#0F766E',
    selectedArea: 'rgba(15, 118, 110, 0.1)',
  },
  blue: {
    fill: 'rgba(37, 99, 235, 0.14)',
    handle: '#2563EB',
    selectedLine: '#2563EB',
    selectedArea: 'rgba(37, 99, 235, 0.1)',
  },
  sky: {
    fill: 'rgba(2, 132, 199, 0.14)',
    handle: '#0284C7',
    selectedLine: '#0284C7',
    selectedArea: 'rgba(2, 132, 199, 0.1)',
  },
};

/** Compact vertical handle — no bulky square thumbs */
const THIN_HANDLE =
  'path://M -1.2 -5.5 L 1.2 -5.5 L 1.2 5.5 L -1.2 5.5 Z';

export function thinInsideZoom(opts?: {
  xAxisIndex?: number | number[];
  start?: number;
  end?: number;
  filterMode?: 'none' | 'filter' | 'weakFilter' | 'empty';
}): DataZoomComponentOption {
  return {
    type: 'inside',
    xAxisIndex: opts?.xAxisIndex ?? 0,
    start: opts?.start,
    end: opts?.end,
    filterMode: opts?.filterMode ?? 'none',
    zoomOnMouseWheel: true,
    moveOnMouseMove: true,
    moveOnMouseWheel: false,
  };
}

export function thinSliderZoom(opts?: {
  xAxisIndex?: number | number[];
  start?: number;
  end?: number;
  bottom?: number;
  accent?: ThinDataZoomAccent;
  filterMode?: 'none' | 'filter' | 'weakFilter' | 'empty';
}): DataZoomComponentOption {
  const accent = ACCENTS[opts?.accent ?? 'teal'];
  return {
    type: 'slider',
    xAxisIndex: opts?.xAxisIndex ?? 0,
    start: opts?.start,
    end: opts?.end,
    height: 8,
    bottom: opts?.bottom ?? 2,
    borderColor: 'transparent',
    backgroundColor: '#F1F5F9',
    fillerColor: accent.fill,
    handleIcon: THIN_HANDLE,
    handleSize: 14,
    handleStyle: {
      color: accent.handle,
      borderColor: accent.handle,
      borderWidth: 0,
      shadowBlur: 0,
      opacity: 1,
    },
    moveHandleSize: 0,
    showDetail: false,
    showDataShadow: true,
    brushSelect: false,
    dataBackground: {
      lineStyle: { color: '#94A3B8', width: 0.6, opacity: 0.45 },
      areaStyle: { color: '#CBD5E1', opacity: 0.22 },
    },
    selectedDataBackground: {
      lineStyle: { color: accent.selectedLine, width: 0.7, opacity: 0.7 },
      areaStyle: { color: accent.selectedArea },
    },
    textStyle: { color: 'transparent', fontSize: 0 },
    filterMode: opts?.filterMode ?? 'none',
  };
}

/** inside + thin slider pair for standard charts */
export function thinChartDataZoom(opts?: {
  xAxisIndex?: number | number[];
  start?: number;
  end?: number;
  bottom?: number;
  accent?: ThinDataZoomAccent;
  filterMode?: 'none' | 'filter' | 'weakFilter' | 'empty';
}): DataZoomComponentOption[] {
  return [
    thinInsideZoom({
      xAxisIndex: opts?.xAxisIndex,
      start: opts?.start,
      end: opts?.end,
      filterMode: opts?.filterMode,
    }),
    thinSliderZoom(opts),
  ];
}
