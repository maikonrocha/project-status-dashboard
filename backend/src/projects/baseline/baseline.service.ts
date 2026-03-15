import { Injectable } from '@nestjs/common';
import { addWeeks, differenceInWeeks } from 'date-fns';

export interface BaselinePoint {
  week: Date;
  value: number;
}

@Injectable()
export class BaselineService {
  /**
   * Compute baseline series — pure function, no DB access.
   * Baseline is a straight line from totalTasks → 0 over the project duration.
   */
  computeBaseline(
    totalTasks: number,
    beginDate: Date,
    previewFinishDate: Date,
  ): BaselinePoint[] {
    const totalWeeks = differenceInWeeks(previewFinishDate, beginDate);

    if (totalWeeks <= 0) {
      return [{ week: beginDate, value: totalTasks }];
    }

    const weeklyBurn = totalTasks / totalWeeks;
    const series: BaselinePoint[] = [];

    for (let i = 0; i <= totalWeeks; i++) {
      const week = addWeeks(beginDate, i);
      const value = Math.max(0, totalTasks - i * weeklyBurn);
      series.push({ week, value });
    }

    return series;
  }
}
