import { describe, it, expect } from 'vitest';
import { formatDate, formatPercentage } from './utils';

describe('formatDate', () => {
    it('returns "-" for null', () => {
        expect(formatDate(null)).toBe('-');
    });

    it('returns "-" for empty string', () => {
        expect(formatDate('')).toBe('-');
    });

    it('formats a Date object in pt-BR (dd/mm/yyyy) using UTC', () => {
        // UTC date: 2025-01-15
        const date = new Date('2025-01-15T00:00:00.000Z');
        expect(formatDate(date)).toBe('15/01/2025');
    });

    it('formats an ISO string in pt-BR (dd/mm/yyyy) using UTC', () => {
        expect(formatDate('2024-06-01T00:00:00.000Z')).toBe('01/06/2024');
    });

    it('handles end-of-month dates correctly', () => {
        expect(formatDate('2024-02-29T00:00:00.000Z')).toBe('29/02/2024');
    });

    it('handles December 31', () => {
        expect(formatDate('2025-12-31T00:00:00.000Z')).toBe('31/12/2025');
    });
});

describe('formatPercentage', () => {
    it('formats integer to one decimal place', () => {
        expect(formatPercentage(75)).toBe('75.0%');
    });

    it('formats float to one decimal place', () => {
        expect(formatPercentage(66.666)).toBe('66.7%');
    });

    it('formats 0', () => {
        expect(formatPercentage(0)).toBe('0.0%');
    });

    it('formats 100', () => {
        expect(formatPercentage(100)).toBe('100.0%');
    });

    it('rounds a repeating decimal correctly', () => {
        // 1/3 * 100 = 33.333... → toFixed(1) = '33.3%'
        expect(formatPercentage(100 / 3)).toBe('33.3%');
    });

    it('formats negative value', () => {
        expect(formatPercentage(-5.5)).toBe('-5.5%');
    });
});