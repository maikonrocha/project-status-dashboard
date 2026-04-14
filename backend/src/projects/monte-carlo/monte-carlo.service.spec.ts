import {
  MonteCarloService,
  type SimulationParams,
} from './monte-carlo.service';

// Use local midnight to avoid timezone mismatches with date-fns addWeeks.
const START_DATE = new Date(2025, 5, 1); // June 1, 2025 (local)

const STEADY_DISTRIBUTION = [3, 3, 3, 3, 3]; // constant — always 3/week
const VARIED_DISTRIBUTION = [1, 2, 3, 4, 5];

describe('MonteCarloService', () => {
  let service: MonteCarloService;

  beforeEach(() => {
    service = new MonteCarloService();
  });

  // ─── Output shape ─────────────────────────────────────────────────────────

  describe('runSimulation — output shape', () => {
    it('returns p50Date, p85Date, p95Date and distribution', () => {
      const result = service.runSimulation({
        remainingTasks: 9,
        startDate: START_DATE,
        throughputDistribution: STEADY_DISTRIBUTION,
        numSimulations: 100,
        seed: 1,
      });

      expect(result).toHaveProperty('p50Date');
      expect(result).toHaveProperty('p85Date');
      expect(result).toHaveProperty('p95Date');
      expect(result).toHaveProperty('distribution');
      expect(result.p50Date).toBeInstanceOf(Date);
      expect(result.p85Date).toBeInstanceOf(Date);
      expect(result.p95Date).toBeInstanceOf(Date);
      expect(Array.isArray(result.distribution)).toBe(true);
    });

    it('distribution entries are Date instances', () => {
      const result = service.runSimulation({
        remainingTasks: 6,
        startDate: START_DATE,
        throughputDistribution: STEADY_DISTRIBUTION,
        numSimulations: 50,
        seed: 2,
      });

      expect(result.distribution.length).toBeGreaterThan(0);
      for (const d of result.distribution) {
        expect(d).toBeInstanceOf(Date);
      }
    });
  });

  // ─── Percentile ordering ─────────────────────────────────────────────────

  describe('runSimulation — percentile ordering', () => {
    it('p50Date <= p85Date <= p95Date', () => {
      const result = service.runSimulation({
        remainingTasks: 15,
        startDate: START_DATE,
        throughputDistribution: VARIED_DISTRIBUTION,
        numSimulations: 500,
        seed: 42,
      });

      expect(result.p50Date.getTime()).toBeLessThanOrEqual(
        result.p85Date.getTime(),
      );
      expect(result.p85Date.getTime()).toBeLessThanOrEqual(
        result.p95Date.getTime(),
      );
    });

    it('all percentile dates are on or after startDate', () => {
      const result = service.runSimulation({
        remainingTasks: 10,
        startDate: START_DATE,
        throughputDistribution: VARIED_DISTRIBUTION,
        numSimulations: 200,
        seed: 7,
      });

      expect(result.p50Date.getTime()).toBeGreaterThanOrEqual(
        START_DATE.getTime(),
      );
      expect(result.p85Date.getTime()).toBeGreaterThanOrEqual(
        START_DATE.getTime(),
      );
      expect(result.p95Date.getTime()).toBeGreaterThanOrEqual(
        START_DATE.getTime(),
      );
    });
  });

  // ─── Zero remaining tasks ────────────────────────────────────────────────

  describe('runSimulation — zero remaining tasks', () => {
    it('returns startDate for all percentiles when remainingTasks is 0', () => {
      const result = service.runSimulation({
        remainingTasks: 0,
        startDate: START_DATE,
        throughputDistribution: STEADY_DISTRIBUTION,
        numSimulations: 100,
        seed: 1,
      });

      // while(remaining > 0) never runs → weekIndex = 0 → addWeeks(start, 0) = start
      expect(result.p50Date.getTime()).toBe(START_DATE.getTime());
      expect(result.p85Date.getTime()).toBe(START_DATE.getTime());
      expect(result.p95Date.getTime()).toBe(START_DATE.getTime());
    });
  });

  // ─── Distribution sampling ────────────────────────────────────────────────

  describe('runSimulation — distribution sampling', () => {
    it('distribution length <= 1000 for large numSimulations', () => {
      const result = service.runSimulation({
        remainingTasks: 5,
        startDate: START_DATE,
        throughputDistribution: STEADY_DISTRIBUTION,
        numSimulations: 5000,
        seed: 99,
      });

      expect(result.distribution.length).toBeLessThanOrEqual(1000);
    });

    it('distribution length equals numSimulations when numSimulations <= 1000', () => {
      const result = service.runSimulation({
        remainingTasks: 5,
        startDate: START_DATE,
        throughputDistribution: STEADY_DISTRIBUTION,
        numSimulations: 200,
        seed: 3,
      });

      expect(result.distribution).toHaveLength(200);
    });

    it('distribution is sorted ascending', () => {
      const result = service.runSimulation({
        remainingTasks: 10,
        startDate: START_DATE,
        throughputDistribution: VARIED_DISTRIBUTION,
        numSimulations: 300,
        seed: 5,
      });

      for (let i = 1; i < result.distribution.length; i++) {
        expect(result.distribution[i].getTime()).toBeGreaterThanOrEqual(
          result.distribution[i - 1].getTime(),
        );
      }
    });
  });

  // ─── Seeded RNG determinism ───────────────────────────────────────────────

  describe('runSimulation — seeded RNG', () => {
    it('produces identical results for the same seed', () => {
      const params: SimulationParams = {
        remainingTasks: 20,
        startDate: START_DATE,
        throughputDistribution: VARIED_DISTRIBUTION,
        numSimulations: 1000,
        seed: 12345,
      };

      const r1 = service.runSimulation(params);
      const r2 = service.runSimulation(params);

      expect(r1.p50Date.getTime()).toBe(r2.p50Date.getTime());
      expect(r1.p85Date.getTime()).toBe(r2.p85Date.getTime());
      expect(r1.p95Date.getTime()).toBe(r2.p95Date.getTime());
    });

    it('produces different intermediate distributions for different seeds (raw distribution check)', () => {
      // Compare raw finish-date distributions — not just percentiles.
      // With 1000 sims and a wide distribution, at least one sampled date will differ.
      const base: Omit<SimulationParams, 'seed'> = {
        remainingTasks: 30,
        startDate: START_DATE,
        throughputDistribution: VARIED_DISTRIBUTION,
        numSimulations: 200,
      };

      const rA = service.runSimulation({ ...base, seed: 1 });
      const rB = service.runSimulation({ ...base, seed: 88888 });

      // Compare the full sorted distribution arrays — at least one entry should differ
      const anyDiffers = rA.distribution.some(
        (d, i) => d.getTime() !== rB.distribution[i].getTime(),
      );

      expect(anyDiffers).toBe(true);
    });
  });

  // ─── Uniform throughput — deterministic finish ────────────────────────────

  describe('runSimulation — uniform throughput', () => {
    it('finishes in exactly 3 weeks when tasks=9 and throughput is always 3', () => {
      const result = service.runSimulation({
        remainingTasks: 9,
        startDate: START_DATE,
        throughputDistribution: [3],
        numSimulations: 10,
        seed: 1,
      });

      const expectedMs = START_DATE.getTime() + 3 * 7 * 24 * 60 * 60 * 1000;
      expect(result.p50Date.getTime()).toBe(expectedMs);
      expect(result.p95Date.getTime()).toBe(expectedMs);
    });

    it('finishes in 1 week when single throughput value exceeds remaining tasks', () => {
      const result = service.runSimulation({
        remainingTasks: 3,
        startDate: START_DATE,
        throughputDistribution: [10],
        numSimulations: 10,
        seed: 1,
      });

      const expectedMs = START_DATE.getTime() + 1 * 7 * 24 * 60 * 60 * 1000;
      expect(result.p50Date.getTime()).toBe(expectedMs);
    });
  });

  // ─── Default numSimulations ───────────────────────────────────────────────

  describe('runSimulation — default parameters', () => {
    it('defaults to 10 000 simulations when numSimulations is omitted', () => {
      const result = service.runSimulation({
        remainingTasks: 5,
        startDate: START_DATE,
        throughputDistribution: STEADY_DISTRIBUTION,
        seed: 7,
      });

      // 10 000 sims → sampled to ≤ 1000
      expect(result.distribution.length).toBeLessThanOrEqual(1000);
      expect(result.p50Date).toBeInstanceOf(Date);
    });
  });

  // ─── Math.random fallback (no seed) ──────────────────────────────────────
  // Covers line 65: rng = Math.random — the else branch when seed is undefined.

  describe('runSimulation — unseeded (Math.random)', () => {
    it('returns valid results when no seed is provided', () => {
      const result = service.runSimulation({
        remainingTasks: 6,
        startDate: START_DATE,
        throughputDistribution: STEADY_DISTRIBUTION,
        numSimulations: 50,
        // no seed — forces the else branch: rng = Math.random
      });

      expect(result.p50Date).toBeInstanceOf(Date);
      expect(result.p85Date).toBeInstanceOf(Date);
      expect(result.p95Date).toBeInstanceOf(Date);
      expect(result.distribution.length).toBe(50);
    });
  });
});
