'use client';

import { useRouter } from 'next/navigation';
import { type Project, type StatusDashboard } from '@/lib/api-client';
import { formatDate, formatPercentage } from '@/lib/utils';
import ReactECharts from 'echarts-for-react';

interface Props {
  projectId: string;
  data: StatusDashboard;
  projects: Project[];
}

export function StatusDashboardClient({ projectId, data, projects }: Props) {
  const router = useRouter();

  // Parse date as local midnight to avoid UTC timezone shift in ECharts
  const toLocalTs = (d: string | Date): number => {
    const s = typeof d === 'string' ? d : d.toISOString();
    const [y, mo, day] = s.substring(0, 10).split('-').map(Number);
    return new Date(y, mo - 1, day).getTime();
  };

  // Calculate the chart X-axis boundaries
  const chartMin = toLocalTs(data.project.beginDate);
  let chartMax: number | undefined = undefined;

  if (data.kpis.predictedFinish) {
    // Parse as local midnight to avoid UTC timezone shift (same as toLocalTs)
    const p95Date = new Date(toLocalTs(data.kpis.predictedFinish));
    const day = p95Date.getDay();
    const daysUntilNextSat = day === 6 ? 7 : 6 - day;
    const nextSat = new Date(p95Date);
    nextSat.setDate(p95Date.getDate() + daysUntilNextSat);
    nextSat.setHours(23, 59, 59, 999);
    // eslint-disable-next-line react-hooks/purity
    chartMax = Math.max(nextSat.getTime(), Date.now());
  }

  // ECharts burndown configuration (dark theme)
  const chartOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Burndown com Baseline',
      textStyle: { color: '#94a3b8', fontSize: 16, fontWeight: 500 },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      textStyle: { color: '#e2e8f0' },
    },
    legend: {
      data: ['Burndown Real', 'Baseline (P95)'],
      textStyle: { color: '#64748b' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      min: chartMin,
      max: chartMax,
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    yAxis: {
      type: 'value',
      name: 'Tarefas Restantes',
      nameTextStyle: { color: '#64748b' },
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: 'Burndown Real',
        type: 'line',
        data: (data.chartData?.burndown || []).map((d) => [
          toLocalTs(d.week),
          d.remaining,
        ]),
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
            ],
          },
        },
        smooth: true,
      },
      {
        name: 'Baseline (P95)', // technical term, kept as-is
        type: 'line',
        data: (data.chartData?.baseline || []).map((d) => [
          toLocalTs(d.week),
          d.value,
        ]),
        itemStyle: { color: '#ec4899' },
        lineStyle: { width: 2, type: 'dashed' },
      },
    ],
  };

  // Throughput bar chart
  const throughputChartOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Throughput Semanal',
      textStyle: { color: '#94a3b8', fontSize: 16, fontWeight: 500 },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      textStyle: { color: '#e2e8f0' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    yAxis: {
      type: 'value',
      name: 'Tarefas Concluídas',
      nameTextStyle: { color: '#64748b' },
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        type: 'bar',
        data: (data.tables?.weeklyThroughput || []).map((w) => [
          toLocalTs(w.weekEnding),
          w.throughput,
        ]),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: '#3b82f6' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <div>
      {/* Sub-nav: project switcher */}
      <div className="border-b border-white/5 bg-white/3">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-blue-300/50 hover:text-blue-300 transition-colors text-xs flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Todos os Projetos
            </button>
            <span className="text-white/10">|</span>
            <select
              value={projectId}
              id="project-selector"
              onChange={(e) =>
                router.push(`/projects/${e.target.value}/status`)
              }
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs
                                       text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40
                                       appearance-none cursor-pointer [color-scheme:dark]"
            >
              {projects.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  className="bg-slate-900 text-white"
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 text-xs text-blue-300/40">
            <span>{data.project.squadName}</span>
            <span className="text-white/10">•</span>
            <span>Equipe: {data.project.teamSize}</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Project Info */}
        <div>
          <h1 className="text-2xl font-bold text-white">{data.project.name}</h1>
          <p className="text-blue-300/50 text-sm mt-1">
            Epic: {data.project.epicId}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            label="Total de Tarefas"
            value={data.kpis.totalTasks}
            color="blue"
          />
          <KpiCard
            label="Concluídas"
            value={data.kpis.completed}
            subtitle={formatPercentage(data.kpis.completionPercentage)}
            color="green"
          />
          <KpiCard
            label="Restantes"
            value={data.kpis.remaining}
            color="orange"
          />
          <KpiCard
            label="Throughput Médio"
            value={data.kpis.avgWeeklyThroughput.toFixed(1)}
            subtitle={`Esta semana: ${data.kpis.currentWeekThroughput}`}
            color="indigo"
          />
          <KpiCard
            label="Iniciado"
            value={formatDate(data.project.beginDate)}
            color="sky"
            small
          />
          <KpiCard
            label="Revisão de Término"
            value={formatDate(data.kpis.predictedFinish)}
            color="pink"
            small
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-5">
            {data.chartData?.burndown?.length > 0 ? (
              <ReactECharts option={chartOption} style={{ height: '400px' }} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-blue-300/40 gap-2">
                <svg
                  className="w-10 h-10 opacity-40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
                <p className="text-sm">Nenhum dado de burndown disponível</p>
                <p className="text-xs opacity-60">
                  Verifique se o filtro de backlog do Jira está configurado
                  corretamente
                </p>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            {data.tables?.weeklyThroughput?.length > 0 ? (
              <ReactECharts
                option={throughputChartOption}
                style={{ height: '400px' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-blue-300/40 gap-2">
                <svg
                  className="w-10 h-10 opacity-40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
                <p className="text-sm">Nenhum dado de throughput disponível</p>
                <p className="text-xs opacity-60">
                  Verifique se o filtro de throughput do Jira está configurado
                  corretamente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Remaining Tasks */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold mb-4 text-blue-100">
              Tarefas Restantes
            </h2>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-blue-300/60 font-medium">
                      Chave
                    </th>
                    <th className="text-left p-2 text-blue-300/60 font-medium">
                      Resumo
                    </th>
                    <th className="text-left p-2 text-blue-300/60 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data.tables?.remainingTasks || []).map((task) => (
                    <tr
                      key={task.key}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-2 font-mono text-xs text-blue-300">
                        {task.key}
                      </td>
                      <td className="p-2 text-xs text-slate-300">
                        {task.summary}
                      </td>
                      <td className="p-2 text-xs">
                        <span className="px-2 py-0.5 bg-orange-500/15 text-orange-300 rounded text-[10px]">
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data.tables?.remainingTasks ||
                    data.tables.remainingTasks.length === 0) && (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-4 text-center text-blue-300/40 text-xs"
                      >
                        Nenhuma tarefa restante
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Throughput Table */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold mb-4 text-blue-100">
              Histórico de Throughput Semanal
            </h2>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2 text-blue-300/60 font-medium">
                      Semana
                    </th>
                    <th className="text-right p-2 text-blue-300/60 font-medium">
                      Throughput
                    </th>
                    <th className="text-right p-2 text-blue-300/60 font-medium">
                      Cumulativo
                    </th>
                    <th className="text-right p-2 text-blue-300/60 font-medium">
                      Restante
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data.tables?.weeklyThroughput || [])
                    .slice()
                    .reverse()
                    .map((week, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="p-2 text-slate-300">
                          {formatDate(week.weekEnding)}
                        </td>
                        <td className="p-2 text-right font-semibold text-indigo-300">
                          {week.throughput}
                        </td>
                        <td className="p-2 text-right text-slate-400">
                          {week.cumulative}
                        </td>
                        <td className="p-2 text-right text-slate-400">
                          {week.remaining}
                        </td>
                      </tr>
                    ))}
                  {(!data.tables?.weeklyThroughput ||
                    data.tables.weeklyThroughput.length === 0) && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-blue-300/40 text-xs"
                      >
                        Nenhum dado de throughput ainda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Reusable KPI card component */
function KpiCard({
  label,
  value,
  subtitle,
  color,
  small,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  small?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-400/20',
    green: 'from-emerald-500/10 to-emerald-600/5 border-emerald-400/20',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-400/20',
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-400/20',
    sky: 'from-sky-500/10 to-sky-600/5 border-sky-400/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-400/20',
    pink: 'from-pink-500/10 to-pink-600/5 border-pink-400/20',
  };

  const textColorMap: Record<string, string> = {
    blue: 'text-blue-300',
    green: 'text-emerald-300',
    orange: 'text-orange-300',
    indigo: 'text-indigo-300',
    sky: 'text-sky-300',
    purple: 'text-purple-300',
    pink: 'text-pink-300',
  };

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-4 ${colorMap[color] || colorMap.blue}`}
    >
      <div className="text-[11px] uppercase tracking-wider text-blue-300/50 font-medium">
        {label}
      </div>
      <div
        className={`${small ? 'text-sm' : 'text-2xl'} font-bold mt-1 ${textColorMap[color] || textColorMap.blue}`}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] text-blue-300/40 mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}
