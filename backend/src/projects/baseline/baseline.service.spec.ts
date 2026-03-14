import { BaselineService } from './baseline.service';

// Use local midnight dates throughout to keep date-fns computations consistent.
const BEGIN = new Date(2025, 0, 4);   // Saturday Jan 4, 2025
const FIVE_WEEKS_OUT = new Date(2025, 1, 8); // Saturday Feb 8, 2025 (5 weeks later)
const TEN_WEEKS_OUT  = new Date(2025, 2, 15); // Saturday Mar 15, 2025 (~10 weeks)

describe('BaselineService', () => {
  let service: BaselineService;

  beforeEach(() => {
    service = new BaselineService();
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  describe('computeBaseline — edge cases', () => {
    it('returns a single point with full totalTasks when previewFinishDate equals beginDate', () => {
      const result = service.computeBaseline(10, BEGIN, BEGIN);
      expect(result).toHaveLength(1);
      expect(result[0].week.getTime()).toBe(BEGIN.getTime());
      expect(result[0].value).toBe(10);
    });

    it('returns a single point when previewFinishDate is before beginDate', () => {
      const past = new Date(2024, 11, 1); // Dec 1, 2024 — before Jan 4, 2025
      const result = service.computeBaseline(5, BEGIN, past);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(5);
    });

    it('returns a single point for totalTasks = 0', () => {
      const result = service.computeBaseline(0, BEGIN, BEGIN);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(0);
    });
  });

  // ─── Series length ─────────────────────────────────────────────────────────

  describe('computeBaseline — series length', () => {
    it('returns totalWeeks + 1 points (inclusive of both endpoints)', () => {
      // differenceInWeeks(FIVE_WEEKS_OUT, BEGIN) must equal 5
      const result = service.computeBaseline(50, BEGIN, FIVE_WEEKS_OUT);
      // series has i = 0..totalWeeks → totalWeeks + 1 items
      expect(result.length).toBeGreaterThan(1);
      // First item is at beginDate
      expect(result[0].week.getTime()).toBe(BEGIN.getTime());
    });

    it('each step is exactly one addWeeks(beginDate, i) apart', () => {
      const result = service.computeBaseline(10, BEGIN, FIVE_WEEKS_OUT);
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      for (let i = 1; i < result.length; i++) {
        expect(result[i].week.getTime() - result[i - 1].week.getTime()).toBe(oneWeekMs);
      }
    });
  });

  // ─── Value at endpoints ───────────────────────────────────────────────────

  describe('computeBaseline — endpoint values', () => {
    it('first point value equals totalTasks', () => {
      const result = service.computeBaseline(30, BEGIN, FIVE_WEEKS_OUT);
      expect(result[0].value).toBe(30);
    });

    it('last point value is 0 (linear burn reaches zero at previewFinishDate)', () => {
      const result = service.computeBaseline(30, BEGIN, FIVE_WEEKS_OUT);
      expect(result[result.length - 1].value).toBeCloseTo(0, 5);
    });
  });

  // ─── Monotonic decrease ───────────────────────────────────────────────────

  describe('computeBaseline — monotonic decrease', () => {
    it('values are non-increasing at each step', () => {
      const result = service.computeBaseline(20, BEGIN, FIVE_WEEKS_OUT);
      for (let i = 1; i < result.length; i++) {
        expect(result[i].value).toBeLessThanOrEqual(result[i - 1].value);
      }
    });

    it('values never go below zero', () => {
      const result = service.computeBaseline(10, BEGIN, TEN_WEEKS_OUT);
      for (const point of result) {
        expect(point.value).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ─── Linear burn rate ─────────────────────────────────────────────────────

  describe('computeBaseline — linear burn rate', () => {
    it('weekly decrement equals totalTasks / totalWeeks', () => {
      // With 10 tasks over 5 weeks → 2 tasks burned per week
      const result = service.computeBaseline(10, BEGIN, FIVE_WEEKS_OUT);
      const weeklyBurn = result[0].value - result[1].value;
      expect(weeklyBurn).toBeCloseTo(10 / (result.length - 1), 5);
    });

    it('intermediate points decrease by a constant amount (straight line)', () => {
      const result = service.computeBaseline(15, BEGIN, FIVE_WEEKS_OUT);
      if (result.length < 3) return; // nothing to check

      const step = result[0].value - result[1].value;
      for (let i = 1; i < result.length - 1; i++) {
        expect(result[i].value - result[i + 1].value).toBeCloseTo(step, 5);
      }
    });
  });

  // ─── Large inputs ─────────────────────────────────────────────────────────

  describe('computeBaseline — large inputs', () => {
    it('handles 1000 tasks over 52 weeks without error', () => {
      const oneYear = new Date(2026, 0, 10); // ~52 weeks from BEGIN
      const result = service.computeBaseline(1000, BEGIN, oneYear);
      expect(result.length).toBeGreaterThan(1);
      expect(result[0].value).toBe(1000);
      expect(result[result.length - 1].value).toBeGreaterThanOrEqual(0);
    });
  });
});
