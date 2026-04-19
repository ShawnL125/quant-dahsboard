import { describe, it, expect } from 'vitest';
import { CHART_COLORS, LINE_SERIES_DEFAULTS, CHART_GRID, CHART_TOOLTIP } from '@/utils/chart-theme';

describe('chart-theme', () => {
  it('exports CHART_COLORS with required keys', () => {
    expect(CHART_COLORS.primary).toBe('#3b82f6');
    expect(CHART_COLORS.success).toBe('#10b981');
    expect(CHART_COLORS.error).toBe('#ef4444');
    expect(CHART_COLORS.warning).toBe('#f59e0b');
    expect(CHART_COLORS.muted).toBe('#94a3b8');
    expect(CHART_COLORS.grid).toBe('#f0f2f5');
  });

  it('exports LINE_SERIES_DEFAULTS with smooth and symbol', () => {
    expect(LINE_SERIES_DEFAULTS.smooth).toBe(true);
    expect(LINE_SERIES_DEFAULTS.symbol).toBe('none');
    expect(LINE_SERIES_DEFAULTS.lineStyle.color).toBe(CHART_COLORS.primary);
    expect(LINE_SERIES_DEFAULTS.lineStyle.width).toBe(2.5);
  });

  it('exports LINE_SERIES_DEFAULTS with areaStyle gradient', () => {
    const area = LINE_SERIES_DEFAULTS.areaStyle!.color as any;
    expect(area.type).toBe('linear');
    expect(area.colorStops).toHaveLength(2);
    expect(area.colorStops[0].offset).toBe(0);
    expect(area.colorStops[1].offset).toBe(1);
  });

  it('exports CHART_GRID with layout values', () => {
    expect(CHART_GRID.left).toBe('3%');
    expect(CHART_GRID.right).toBe('4%');
    expect(CHART_GRID.top).toBe('8%');
    expect(CHART_GRID.bottom).toBe('3%');
    expect(CHART_GRID.containLabel).toBe(true);
  });

  it('exports CHART_TOOLTIP with axis trigger', () => {
    expect(CHART_TOOLTIP.trigger).toBe('axis');
    expect(CHART_TOOLTIP.backgroundColor).toBe('#fff');
    expect(CHART_TOOLTIP.textStyle.fontSize).toBe(12);
  });
});
