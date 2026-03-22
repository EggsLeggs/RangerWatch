"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import { SpeciesCard } from "./species-card";
import { useSpeciesIndex } from "../../hooks/use-species-index";

const PAGE_SIZE = 24;

export function SpeciesIndexView() {
  const { species, loading, error } = useSpeciesIndex();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = species.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search species..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-ranger-border bg-ranger-card px-3 py-2 text-sm text-ranger-text placeholder:text-ranger-muted focus:outline-none focus:ring-1 focus:ring-ranger-moss"
        />
        <span className="text-xs text-ranger-muted">{filtered.length} species</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-ranger-border/40" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-ranger-apricot">Failed to load species index.</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-ranger-muted">
            {search ? "No species match your search." : "No species data yet."}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((entry) => (
              <SpeciesCard key={entry.name} entry={entry} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded border border-ranger-border px-3 py-1.5 text-xs text-ranger-muted hover:text-ranger-text disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-xs text-ranger-muted">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
                className="rounded border border-ranger-border px-3 py-1.5 text-xs text-ranger-muted hover:text-ranger-text disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
