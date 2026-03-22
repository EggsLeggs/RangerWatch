"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import { ThreatBadge } from "./threat-badge";
import type { TimelineSighting } from "../../hooks/use-wildlife-timeline";

const PAGE_SIZE = 20;

export function SightingLogTable({
  sightings,
  onSpeciesClick,
}: {
  sightings: TimelineSighting[];
  onSpeciesClick?: (species: string) => void;
}) {
  const [filterThreat, setFilterThreat] = useState("ALL");
  const [filterSpecies, setFilterSpecies] = useState("");
  const [page, setPage] = useState(0);

  const filtered = sightings.filter((s) => {
    if (filterThreat !== "ALL" && s.threatLevel !== filterThreat) return false;
    if (filterSpecies && s.species && !s.species.toLowerCase().includes(filterSpecies.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <Card className="flex flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Filter species..."
          value={filterSpecies}
          onChange={(e) => { setFilterSpecies(e.target.value); setPage(0); }}
          className="rounded border border-ranger-border bg-ranger-bg px-2 py-1 text-xs text-ranger-text focus:outline-none focus:ring-1 focus:ring-ranger-moss"
        />
        <select
          value={filterThreat}
          onChange={(e) => { setFilterThreat(e.target.value); setPage(0); }}
          className="rounded border border-ranger-border bg-ranger-bg px-2 py-1 text-xs text-ranger-text focus:outline-none"
        >
          <option value="ALL">All threats</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
          <option value="NEEDS_REVIEW">Needs review</option>
        </select>
        <span className="ml-auto text-xs text-ranger-muted">{filtered.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ranger-border text-left text-xs uppercase text-ranger-muted">
              <th className="pb-2 pr-3">Time</th>
              <th className="pb-2 pr-3">Species</th>
              <th className="pb-2 pr-3">Threat</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-xs text-ranger-muted">
                  No sightings match the filter
                </td>
              </tr>
            ) : (
              pageData.map((s, i) => (
                <tr
                  key={s.alertId ?? i}
                  className={`border-b border-ranger-border/50 last:border-0 text-sm ${
                    s.species ? "cursor-pointer hover:bg-ranger-border/20" : ""
                  }`}
                  onClick={() => s.species && onSpeciesClick?.(s.species)}
                >
                  <td className="py-2 pr-3 text-xs text-ranger-muted">
                    {s.timestamp ? new Date(s.timestamp).toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-3 text-ranger-text">{s.species ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <ThreatBadge level={s.threatLevel} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded border border-ranger-border px-2 py-1 text-xs text-ranger-muted hover:text-ranger-text disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-xs text-ranger-muted">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
            className="rounded border border-ranger-border px-2 py-1 text-xs text-ranger-muted hover:text-ranger-text disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </Card>
  );
}
