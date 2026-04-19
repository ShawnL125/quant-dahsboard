import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WindowsTable from '@/components/walkforward/WindowsTable.vue';
import type { WalkForwardWindow, WalkForwardBestParams } from '@/types';

function makeWindow(overrides: Partial<WalkForwardWindow> = {}): WalkForwardWindow {
  return {
    run_id: 'run-1',
    window_index: 0,
    train_start: '2026-01-01T00:00:00Z',
    train_end: '2026-02-01T00:00:00Z',
    test_start: '2026-02-01T00:00:00Z',
    test_end: '2026-03-01T00:00:00Z',
    best_params: { period: 14, multiplier: 2.5 },
    train_metrics: {},
    test_metrics: {},
    objective_score: 1.2345,
    overfitting_ratio: 0.1,
    ...overrides,
  };
}

function makeBestParams(overrides: Partial<WalkForwardBestParams> = {}): WalkForwardBestParams {
  return {
    window_index: 0,
    best_params: { period: 14 },
    objective_score: 1.5,
    overfitting_ratio: 0.3,
    ...overrides,
  };
}

function mountTable(windows: WalkForwardWindow[] = [], bestParams: WalkForwardBestParams[] = []) {
  return mount(WindowsTable, { props: { windows, bestParams } });
}

describe('WindowsTable', () => {
  it('renders .windows-section container with section title', () => {
    const wrapper = mountTable();
    expect(wrapper.find('.windows-section').exists()).toBe(true);
    expect(wrapper.find('.section-title').text()).toContain('Windows (0)');
  });

  it('renders a table row for each window', () => {
    const windows = [makeWindow({ window_index: 0 }), makeWindow({ window_index: 1 })];
    const wrapper = mountTable(windows);
    const rows = wrapper.findAll('.data-table').at(0)!.findAll('tbody tr');
    expect(rows).toHaveLength(2);
  });

  it('displays window index starting from 1', () => {
    const wrapper = mountTable([makeWindow({ window_index: 0 })]);
    const cell = wrapper.findAll('.data-table').at(0)!.findAll('tbody tr')[0].findAll('td')[0];
    expect(cell.text()).toBe('1');
  });

  it('applies overfit-high class when ratio > 0.5', () => {
    const wrapper = mountTable([makeWindow({ overfitting_ratio: 0.6 })]);
    const badge = wrapper.find('.overfit-badge');
    expect(badge.classes()).toContain('overfit-high');
    expect(badge.text()).toBe('60.0%');
  });

  it('applies overfit-mid class when ratio > 0.2 and <= 0.5', () => {
    const wrapper = mountTable([makeWindow({ overfitting_ratio: 0.35 })]);
    const badge = wrapper.find('.overfit-badge');
    expect(badge.classes()).toContain('overfit-mid');
  });

  it('applies overfit-low class when ratio <= 0.2', () => {
    const wrapper = mountTable([makeWindow({ overfitting_ratio: 0.1 })]);
    const badge = wrapper.find('.overfit-badge');
    expect(badge.classes()).toContain('overfit-low');
  });

  it('formats best_params as key=value pairs', () => {
    const wrapper = mountTable([makeWindow({ best_params: { period: 14, multiplier: 2.5 } })]);
    const paramsCell = wrapper.find('.params-cell');
    expect(paramsCell.text()).toContain('period=14.0000');
    expect(paramsCell.text()).toContain('multiplier=2.5000');
  });

  it('renders params section when bestParams provided', () => {
    const wrapper = mountTable([], [makeBestParams(), makeBestParams({ window_index: 1 })]);
    expect(wrapper.find('.params-section').exists()).toBe(true);
    expect(wrapper.find('.params-section').text()).toContain('Parameter Stability');
    const paramsRows = wrapper.find('.params-section').findAll('tbody tr');
    expect(paramsRows).toHaveLength(2);
  });

  it('does not render params section when bestParams empty', () => {
    const wrapper = mountTable([makeWindow()], []);
    expect(wrapper.find('.params-section').exists()).toBe(false);
  });
});
