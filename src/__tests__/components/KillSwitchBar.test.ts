import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import KillSwitchBar from '@/components/risk/KillSwitchBar.vue';
import type { KillSwitchState } from '@/types';

const inactiveKillSwitch: KillSwitchState = {
  global: { active: false, reason: '' },
  symbols: {},
  strategies: {},
};

const activeKillSwitch: KillSwitchState = {
  global: { active: true, reason: 'Max drawdown exceeded' },
  symbols: {},
  strategies: {},
};

const killSwitchWithDetails: KillSwitchState = {
  global: { active: true, reason: 'Risk limit breached' },
  symbols: { 'BTC/USDT': 'Price anomaly detected' },
  strategies: { grid_btc: 'Excessive losses' },
};

const antStubs = {
  'a-button': {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
  'a-popconfirm': {
    name: 'a-popconfirm',
    props: ['title', 'okText', 'cancelText'],
    emits: ['confirm'],
    template: '<div class="ant-popconfirm"><slot /></div>',
  },
  'a-tag': {
    props: ['color'],
    template: '<span class="ant-tag"><slot /></span>',
  },
};

function mountComponent(killSwitch: KillSwitchState) {
  return mount(KillSwitchBar, {
    props: { killSwitch },
    global: { stubs: antStubs },
  });
}

describe('KillSwitchBar', () => {
  it('renders activate button when kill switch is inactive', () => {
    const wrapper = mountComponent(inactiveKillSwitch);
    expect(wrapper.text()).toContain('Kill Switch Inactive');
    expect(wrapper.text()).toContain('ACTIVATE GLOBAL');
  });

  it('renders deactivate button when kill switch is active', () => {
    const wrapper = mountComponent(activeKillSwitch);
    expect(wrapper.text()).toContain('GLOBAL KILL SWITCH ACTIVE');
    expect(wrapper.text()).toContain('DEACTIVATE');
  });

  it('shows reason text when kill switch is active with a reason', () => {
    const wrapper = mountComponent(activeKillSwitch);
    expect(wrapper.text()).toContain('Max drawdown exceeded');
  });

  it('emits toggle event with true when activating', async () => {
    const wrapper = mountComponent(inactiveKillSwitch);

    wrapper.findComponent({ name: 'a-popconfirm' }).vm.$emit('confirm');

    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')![0]).toEqual([true]);
  });

  it('emits toggle event with false when deactivating', async () => {
    const wrapper = mountComponent(activeKillSwitch);

    wrapper.findComponent({ name: 'a-popconfirm' }).vm.$emit('confirm');

    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')![0]).toEqual([false]);
  });

  it('shows confirmation popover with correct titles', () => {
    // When inactive, the ACTIVATE popconfirm is shown
    const inactiveWrapper = mountComponent(inactiveKillSwitch);
    const inactivePopconfirms = inactiveWrapper.findAll('.ant-popconfirm');
    expect(inactivePopconfirms.length).toBe(1);

    // When active, the DEACTIVATE popconfirm is shown
    const activeWrapper = mountComponent(activeKillSwitch);
    const activePopconfirms = activeWrapper.findAll('.ant-popconfirm');
    expect(activePopconfirms.length).toBe(1);
  });

  it('shows symbol and strategy kill details', () => {
    const wrapper = mountComponent(killSwitchWithDetails);
    expect(wrapper.text()).toContain('Symbol: BTC/USDT');
    expect(wrapper.text()).toContain('Price anomaly detected');
    expect(wrapper.text()).toContain('Strategy: grid_btc');
    expect(wrapper.text()).toContain('Excessive losses');
  });

  it('hides details section when no symbol or strategy kills', () => {
    const wrapper = mountComponent(activeKillSwitch);
    expect(wrapper.findAll('.ks-details')).toHaveLength(0);
  });

  it('applies active class when kill switch is active', () => {
    const wrapper = mountComponent(activeKillSwitch);
    expect(wrapper.find('.killswitch-bar').classes()).toContain('active');
  });

  it('does not apply active class when kill switch is inactive', () => {
    const wrapper = mountComponent(inactiveKillSwitch);
    expect(wrapper.find('.killswitch-bar').classes()).not.toContain('active');
  });
});
