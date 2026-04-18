import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HealthStatus from '@/components/system/HealthStatus.vue';
import type { HealthStatus as HealthStatusType } from '@/types';

const healthyLiveness: HealthStatusType = {
  status: 'ok',
  uptime_seconds: 172800, // 2 days
};

const readyReadiness: HealthStatusType = {
  status: 'ready',
  uptime_seconds: 0,
};

function mountComponent(props: {
  liveness: HealthStatusType | null;
  readiness?: HealthStatusType | null;
}) {
  return mount(HealthStatus, {
    props: {
      readiness: props.readiness ?? null,
      liveness: props.liveness,
    },
  });
}

describe('HealthStatus', () => {
  it('renders liveness status as ok', () => {
    const wrapper = mountComponent({
      liveness: healthyLiveness,
      readiness: readyReadiness,
    });
    expect(wrapper.text()).toContain('ok');
  });

  it('renders readiness status', () => {
    const wrapper = mountComponent({
      liveness: healthyLiveness,
      readiness: readyReadiness,
    });
    expect(wrapper.text()).toContain('ready');
  });

  it('shows uptime in days format', () => {
    const wrapper = mountComponent({
      liveness: { status: 'ok', uptime_seconds: 172800 },
      readiness: null,
    });
    // 172800s = 2d 0h 0m 0s
    expect(wrapper.text()).toContain('2d 0h 0m 0s');
  });

  it('shows uptime in hours format when less than a day', () => {
    const wrapper = mountComponent({
      liveness: { status: 'ok', uptime_seconds: 5400 },
      readiness: null,
    });
    // 5400s = 1h 30m 0s
    expect(wrapper.text()).toContain('1h 30m 0s');
  });

  it('shows uptime in minutes format when less than an hour', () => {
    const wrapper = mountComponent({
      liveness: { status: 'ok', uptime_seconds: 125 },
      readiness: null,
    });
    // 125s = 2m 5s
    expect(wrapper.text()).toContain('2m 5s');
  });

  it('shows dash for zero uptime', () => {
    const wrapper = mountComponent({
      liveness: { status: 'ok', uptime_seconds: 0 },
      readiness: null,
    });
    expect(wrapper.text()).toContain('-');
  });

  it('shows dash when liveness is null', () => {
    const wrapper = mountComponent({
      liveness: null,
      readiness: null,
    });
    expect(wrapper.text()).toContain('-');
  });

  it('shows Unknown status text when liveness is null', () => {
    const wrapper = mountComponent({
      liveness: null,
      readiness: null,
    });
    expect(wrapper.text()).toContain('Unknown');
  });

  it('shows Unknown status text when readiness is null', () => {
    const wrapper = mountComponent({
      liveness: healthyLiveness,
      readiness: null,
    });
    // Readiness should show Unknown
    const statusTexts = wrapper.findAll('.status-text');
    // Second .status-text is readiness
    const readinessText = statusTexts[1];
    expect(readinessText.text()).toBe('Unknown');
  });

  it('applies dot-ok class for healthy liveness', () => {
    const wrapper = mountComponent({
      liveness: { status: 'ok', uptime_seconds: 100 },
      readiness: null,
    });
    const dot = wrapper.findAll('.status-dot')[0];
    expect(dot.classes()).toContain('dot-ok');
  });

  it('applies dot-error class for unhealthy liveness', () => {
    const wrapper = mountComponent({
      liveness: { status: 'error', uptime_seconds: 100 },
      readiness: null,
    });
    const dot = wrapper.findAll('.status-dot')[0];
    expect(dot.classes()).toContain('dot-error');
  });

  it('recognizes healthy status text as well', () => {
    const wrapper = mountComponent({
      liveness: { status: 'healthy', uptime_seconds: 100 },
      readiness: null,
    });
    const dot = wrapper.findAll('.status-dot')[0];
    expect(dot.classes()).toContain('dot-ok');
  });

  it('recognizes ready status for readiness', () => {
    const wrapper = mountComponent({
      liveness: healthyLiveness,
      readiness: { status: 'ready', uptime_seconds: 0 },
    });
    const dot = wrapper.findAll('.status-dot')[1];
    expect(dot.classes()).toContain('dot-ok');
  });

  it('renders all three health cards', () => {
    const wrapper = mountComponent({
      liveness: healthyLiveness,
      readiness: readyReadiness,
    });
    const cards = wrapper.findAll('.health-card');
    expect(cards).toHaveLength(3);
  });

  it('renders labels for Liveness, Readiness, and Uptime', () => {
    const wrapper = mountComponent({
      liveness: healthyLiveness,
      readiness: readyReadiness,
    });
    expect(wrapper.text()).toContain('Liveness');
    expect(wrapper.text()).toContain('Readiness');
    expect(wrapper.text()).toContain('Uptime');
  });
});
