export const CHART_COLORS = {
  primary: '#2962ff',
  primaryDark: '#1e53e5',
  success: '#26a69a',
  error: '#ef5350',
  warning: '#ff9800',
  muted: '#787b86',
  grid: '#2a2e39',
  gradientStart: 'rgba(41, 98, 255, 0.15)',
  gradientEnd: 'rgba(41, 98, 255, 0.01)',
};

export const LINE_SERIES_DEFAULTS = {
  smooth: true,
  symbol: 'none' as const,
  lineStyle: { color: CHART_COLORS.primary, width: 2.5 },
  areaStyle: {
    color: {
      type: 'linear' as const,
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: CHART_COLORS.gradientStart },
        { offset: 1, color: CHART_COLORS.gradientEnd },
      ],
    },
  },
};

export const CHART_GRID = {
  left: '3%',
  right: '4%',
  top: '8%',
  bottom: '3%',
  containLabel: true,
};

export const CHART_TOOLTIP = {
  trigger: 'axis' as const,
  backgroundColor: '#1e222d',
  borderColor: '#2a2e39',
  borderWidth: 1,
  textStyle: { color: '#d1d4dc', fontSize: 12 },
};

export const CHART_AXIS_LABEL = {
  color: '#787b86',
  fontSize: 11,
};

export const CHART_SPLIT_LINE = {
  lineStyle: { color: '#2a2e39', type: 'dashed' as const },
};
