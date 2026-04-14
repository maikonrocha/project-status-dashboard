import { Injectable } from '@nestjs/common';
import { addWeeks } from 'date-fns';

export interface SimulationParams {
  remainingTasks: number;
  startDate: Date;
  throughputDistribution: number[];
  numSimulations?: number;
  seed?: number;
}

export interface SimulationResults {
  p50Date: Date;
  p85Date: Date;
  p95Date: Date;
  distribution: Date[]; // Sample for charting
}

@Injectable()
export class MonteCarloService {
  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: Date[], pct: number): Date {
    const index = Math.ceil((pct / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Sample array to reduce size (for frontend display)
   */
  private sampleArray<T>(array: T[], sampleSize: number): T[] {
    if (array.length <= sampleSize) return array;
    const step = Math.floor(array.length / sampleSize);
    const sampled: T[] = [];
    for (let i = 0; i < array.length; i += step) {
      if (sampled.length < sampleSize) sampled.push(array[i]);
    }
    return sampled;
  }

  /**
   * Run Monte Carlo simulation — pure function, no DB access.
   * Always runs fresh on each call.
   */
  runSimulation(params: SimulationParams): SimulationResults {
    const {
      remainingTasks,
      startDate,
      throughputDistribution,
      numSimulations = 10000,
      seed,
    } = params;

    // Use a seeded RNG if provided, otherwise true random for fresh results
    let rng: () => number;
    if (seed !== undefined) {
      let s = seed;
      rng = () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0x100000000;
      };
    } else {
      rng = Math.random;
    }

    const finishDates: Date[] = [];

    for (let i = 0; i < numSimulations; i++) {
      let remaining = remainingTasks;
      let weekIndex = 0;

      while (remaining > 0 && weekIndex < 1000) {
        const index = Math.floor(rng() * throughputDistribution.length);
        const throughput = throughputDistribution[index];
        remaining -= throughput;
        weekIndex++;
      }

      finishDates.push(addWeeks(startDate, weekIndex));
    }

    finishDates.sort((a, b) => a.getTime() - b.getTime());

    return {
      p50Date: this.percentile(finishDates, 50),
      p85Date: this.percentile(finishDates, 85),
      p95Date: this.percentile(finishDates, 95),
      distribution: this.sampleArray(finishDates, 1000),
    };
  }
}
