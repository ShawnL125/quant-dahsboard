import { describe, it, expect } from 'vitest';
import { formatMoney, formatPct, formatQty, formatTime, formatUptime } from '@/utils/format';

describe('formatMoney', () => {
  it('formats positive numbers with default 2 decimals', () => {
    expect(formatMoney(1234.56)).toBe('$1,234.56');
    expect(formatMoney(0.01)).toBe('$0.01');
    expect(formatMoney(1000000)).toBe('$1,000,000.00');
  });

  it('formats negative numbers', () => {
    expect(formatMoney(-1234.56)).toBe('$-1,234.56');
    expect(formatMoney(-0.01)).toBe('$-0.01');
  });

  it('handles string input', () => {
    expect(formatMoney('1234.56')).toBe('$1,234.56');
    expect(formatMoney('-1234.56')).toBe('$-1,234.56');
    expect(formatMoney('1000000')).toBe('$1,000,000.00');
  });

  it('returns "-" for NaN values', () => {
    expect(formatMoney(NaN)).toBe('-');
    expect(formatMoney('invalid')).toBe('-');
    expect(formatMoney(undefined as any)).toBe('-');
  });

  it('handles zero', () => {
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney('0')).toBe('$0.00');
  });

  it('respects custom decimals', () => {
    expect(formatMoney(1234.567, 0)).toBe('$1,235');
    expect(formatMoney(1234.567, 3)).toBe('$1,234.567');
    expect(formatMoney(1234.5, 1)).toBe('$1,234.5');
  });

  it('handles large numbers with commas', () => {
    expect(formatMoney(1234567890.12)).toBe('$1,234,567,890.12');
    expect(formatMoney(999999999999.99)).toBe('$999,999,999,999.99');
  });

  it('handles very small decimals', () => {
    expect(formatMoney(0.001, 4)).toBe('$0.0010');
    expect(formatMoney(0.0001, 4)).toBe('$0.0001');
  });
});

describe('formatPct', () => {
  it('formats positive percentages with + sign', () => {
    expect(formatPct(12.34)).toBe('+12.34%');
    expect(formatPct(0.01)).toBe('+0.01%');
    expect(formatPct(100)).toBe('+100.00%');
  });

  it('formats negative percentages with - sign', () => {
    expect(formatPct(-12.34)).toBe('-12.34%');
    expect(formatPct(-0.01)).toBe('-0.01%');
    expect(formatPct(-100)).toBe('-100.00%');
  });

  it('handles zero', () => {
    expect(formatPct(0)).toBe('+0.00%');
    expect(formatPct('0')).toBe('+0.00%');
  });

  it('handles string input', () => {
    expect(formatPct('12.34')).toBe('+12.34%');
    expect(formatPct('-12.34')).toBe('-12.34%');
    expect(formatPct('0')).toBe('+0.00%');
  });

  it('returns "-" for NaN values', () => {
    expect(formatPct(NaN)).toBe('-');
    expect(formatPct('invalid')).toBe('-');
    expect(formatPct(undefined as any)).toBe('-');
  });

  it('respects custom decimals', () => {
    expect(formatPct(12.345, 0)).toBe('+12%');
    expect(formatPct(12.345, 3)).toBe('+12.345%');
    expect(formatPct(-12.3, 1)).toBe('-12.3%');
  });

  it('handles edge cases', () => {
    expect(formatPct(0.001, 4)).toBe('+0.0010%');
    expect(formatPct(-0.001, 4)).toBe('-0.0010%');
  });
});

describe('formatQty', () => {
  it('formats basic quantities with default 4 decimals', () => {
    expect(formatQty(1.2345)).toBe('1.2345');
    expect(formatQty(0.0001)).toBe('0.0001');
    expect(formatQty(1000)).toBe('1000.0000');
  });

  it('handles string input', () => {
    expect(formatQty('1.2345')).toBe('1.2345');
    expect(formatQty('1000')).toBe('1000.0000');
  });

  it('returns "-" for NaN values', () => {
    expect(formatQty(NaN)).toBe('-');
    expect(formatQty('invalid')).toBe('-');
    expect(formatQty(undefined as any)).toBe('-');
  });

  it('handles zero', () => {
    expect(formatQty(0)).toBe('0.0000');
    expect(formatQty('0')).toBe('0.0000');
  });

  it('respects custom decimals', () => {
    expect(formatQty(1.234567, 2)).toBe('1.23');
    expect(formatQty(1.234567, 6)).toBe('1.234567');
    expect(formatQty(1000, 0)).toBe('1000');
  });

  it('handles negative quantities', () => {
    expect(formatQty(-1.2345)).toBe('-1.2345');
    expect(formatQty(-0.0001)).toBe('-0.0001');
  });
});

describe('formatTime', () => {
  it('formats valid ISO strings', () => {
    const iso = '2024-01-15T10:30:00Z';
    const result = formatTime(iso);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).not.toBe('-');
  });

  it('returns "-" for undefined', () => {
    expect(formatTime(undefined)).toBe('-');
  });

  it('returns "-" for empty string', () => {
    expect(formatTime('')).toBe('-');
  });

  it('handles various ISO formats', () => {
    expect(formatTime('2024-01-15T10:30:00.000Z')).not.toBe('-');
    expect(formatTime('2024-01-15T10:30:00+00:00')).not.toBe('-');
    expect(formatTime('2024-01-15')).not.toBe('-');
  });
});

describe('formatUptime', () => {
  it('formats seconds only', () => {
    expect(formatUptime(30)).toBe('30s');
    expect(formatUptime(59)).toBe('59s');
    expect(formatUptime(1)).toBe('1s');
  });

  it('formats minutes and seconds', () => {
    expect(formatUptime(60)).toBe('1m 0s');
    expect(formatUptime(90)).toBe('1m 30s');
    expect(formatUptime(125)).toBe('2m 5s');
    expect(formatUptime(3599)).toBe('59m 59s');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatUptime(3600)).toBe('1h 0m 0s');
    expect(formatUptime(3661)).toBe('1h 1m 1s');
    expect(formatUptime(7325)).toBe('2h 2m 5s');
    expect(formatUptime(86400)).toBe('24h 0m 0s');
  });

  it('handles zero', () => {
    expect(formatUptime(0)).toBe('0s');
  });

  it('handles exactly 60 seconds boundary', () => {
    expect(formatUptime(60)).toBe('1m 0s');
  });

  it('handles exactly 3600 seconds boundary', () => {
    expect(formatUptime(3600)).toBe('1h 0m 0s');
  });

  it('handles large values', () => {
    expect(formatUptime(90061)).toBe('25h 1m 1s');
    expect(formatUptime(172800)).toBe('48h 0m 0s');
  });
});
