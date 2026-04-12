export const CHART_COLORS = {
  primary: '#3b82f6',
  primaryDark: '#1e3a8a',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  muted: '#94a3b8',
  grid: '#f0f2f5',
  gradientStart: 'rgba(59, 130, 246, 0.15)',
  gradientEnd: 'rgba(59, 130, 246, 0.01)',
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
  backgroundColor: '#fff',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  textStyle: { color: '#1e293b', fontSize: 12 },
};
