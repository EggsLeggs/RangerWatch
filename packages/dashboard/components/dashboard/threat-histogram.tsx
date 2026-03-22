"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnomalyHistogramItem } from "../../hooks/use-threat-breakdown";
import { CHART } from "../../lib/constants";

function bucketColor(bucket: string): string {
  const start = parseInt(bucket.split("-")[0] ?? "0", 10);
  if (start >= 80) return "#A84E2A";
  if (start >= 50) return "#B86F0A";
  return "#4a7c5a";
}

export function ThreatHistogram({ data }: { data: AnomalyHistogramItem[] }) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-ranger-muted">
        No anomaly data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis
          dataKey="bucket"
          tick={{ fontSize: 10, fill: CHART.axis }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: CHART.axis }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: CHART.tooltipBg,
            border: `1px solid ${CHART.tooltipBorder}`,
            borderRadius: 6,
            fontSize: 12,
            color: CHART.tooltipText,
          }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={bucketColor(entry.bucket)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
