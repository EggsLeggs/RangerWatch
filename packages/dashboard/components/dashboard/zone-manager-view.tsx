"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "../ui/card";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../ui/command";
import { ZoneProgressBar } from "./zone-progress-bar";
import type { ZoneData } from "../../hooks/use-zone-health";
import type { SpeciesIndexEntry } from "../../hooks/use-species-index";

interface ZoneManagerViewProps {
  zones: ZoneData[];
  totalAnimals: number;
  zonesLoading: boolean;
  species: SpeciesIndexEntry[];
  speciesLoading: boolean;
}

export function ZoneManagerView({
  zones,
  totalAnimals,
  zonesLoading,
  species,
  speciesLoading,
}: ZoneManagerViewProps) {
  const [search, setSearch] = useState("");
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);
  const [highlightedSpecies, setHighlightedSpecies] = useState<string | null>(null);

  const zoneRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const speciesRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    if (highlightedZone) {
      const el = zoneRefs.current.get(highlightedZone);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedZone]);

  useEffect(() => {
    if (highlightedSpecies) {
      const el = speciesRefs.current.get(highlightedSpecies);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedSpecies]);

  const atRiskCount = useMemo(() => zones.filter((z) => z.atRisk).length, [zones]);

  const lowerSearch = search.toLowerCase();
  const zoneMatches = useMemo(
    () =>
      lowerSearch
        ? zones.filter(
            (z) =>
              z.id.toLowerCase().includes(lowerSearch) ||
              z.name.toLowerCase().includes(lowerSearch),
          )
        : zones,
    [zones, lowerSearch],
  );
  const speciesMatches = useMemo(
    () =>
      lowerSearch
        ? species.filter(
            (s) =>
              s.name.toLowerCase().includes(lowerSearch) ||
              s.lastZone.toLowerCase().includes(lowerSearch),
          )
        : species,
    [species, lowerSearch],
  );

  const handleZoneSelect = (zoneId: string) => {
    setSearch("");
    setHighlightedSpecies(null);
    setHighlightedZone(zoneId);
  };

  const handleSpeciesSelect = (name: string) => {
    setSearch("");
    setHighlightedZone(null);
    setHighlightedSpecies(name);
  };

  return (
    <div className="space-y-6">
      {/* Command search */}
      <Command
        className="border border-ranger-border rounded-xl bg-ranger-card"
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Search zones and species..."
          value={search}
          onValueChange={setSearch}
          autoFocus
        />
        {search.length > 0 && (
          <CommandList>
            <CommandEmpty>No zones or species found.</CommandEmpty>
            {zoneMatches.length > 0 && (
              <CommandGroup heading="Zones">
                {zoneMatches.map((z) => (
                  <CommandItem
                    key={z.id}
                    value={`zone-${z.id}`}
                    onSelect={() => handleZoneSelect(z.id)}
                  >
                    <span className="font-mono text-xs text-ranger-muted mr-2">{z.id}</span>
                    <span className="text-ranger-text">{z.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {speciesMatches.length > 0 && (
              <CommandGroup heading="Animals">
                {speciesMatches.map((s) => (
                  <CommandItem
                    key={s.name}
                    value={`species-${s.name}`}
                    onSelect={() => handleSpeciesSelect(s.name)}
                  >
                    <span className="text-ranger-text">{s.name}</span>
                    <span className="ml-auto text-xs text-ranger-muted">{s.lastZone}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Zones" value={zones.length} />
        <StatPill label="At Risk" value={atRiskCount} variant="warning" />
        <StatPill label="Total Animals" value={totalAnimals} />
      </div>

      {/* Zone cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {zonesLoading && zones.length === 0
          ? Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="animate-pulse p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-5 w-12 rounded bg-ranger-border/40" />
                  <div className="h-5 w-32 rounded bg-ranger-border/40" />
                </div>
                <div className="h-2 w-full rounded-full bg-ranger-border/30" />
              </Card>
            ))
          : zones.map((zone) => (
              <div
                key={zone.id}
                ref={(el: HTMLDivElement | null) => {
                  if (el) zoneRefs.current.set(zone.id, el);
                }}
              >
              <Card
                className={`flex h-full flex-col p-4 transition-all ${
                  highlightedZone === zone.id
                    ? "ring-1 ring-ranger-moss"
                    : ""
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-ranger-border px-1.5 py-0.5 font-mono text-xs text-ranger-muted">
                    {zone.id}
                  </span>
                  <span className="flex-1 text-sm font-medium text-ranger-text truncate">
                    {zone.name}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      zone.atRisk ? "bg-ranger-apricot" : "bg-ranger-moss"
                    }`}
                  />
                </div>
                <ZoneProgressBar
                  name=""
                  coverage={zone.coverage}
                  color={zone.color}
                  visible={true}
                  delay={0}
                />
                <div className="mt-auto pt-2 min-h-[28px]">
                  {zone.atRisk && (
                    <span className="inline-flex items-center gap-1.5 rounded bg-ranger-apricot/20 px-2 py-0.5 text-xs font-medium text-ranger-apricot">
                      <span className="h-1.5 w-1.5 rounded-full bg-ranger-apricot" />
                      At Risk{zone.atRiskReason ? ` \u00B7 ${zone.atRiskReason}` : ""}
                    </span>
                  )}
                </div>
              </Card>
              </div>
            ))}
      </div>

      {/* Species table */}
      <Card className="overflow-hidden">
        <div className="p-4 pb-2">
          <h3 className="text-lg font-semibold text-ranger-text">Species Index</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ranger-border text-left">
                <th className="px-4 py-2 font-medium text-ranger-muted">Species</th>
                <th className="px-4 py-2 font-medium text-ranger-muted">Last Zone</th>
                <th className="px-4 py-2 font-medium text-ranger-muted text-right">Total Sightings</th>
                <th className="px-4 py-2 font-medium text-ranger-muted">IUCN Status</th>
                <th className="px-4 py-2 font-medium text-ranger-muted text-right">Avg Confidence</th>
              </tr>
            </thead>
            <tbody>
              {speciesLoading && species.length === 0
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b border-ranger-border/40">
                      <td className="px-4 py-3">
                        <div className="h-4 w-28 animate-pulse rounded bg-ranger-border/40" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 animate-pulse rounded bg-ranger-border/40" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="ml-auto h-4 w-8 animate-pulse rounded bg-ranger-border/40" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-10 animate-pulse rounded bg-ranger-border/40" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="ml-auto h-4 w-12 animate-pulse rounded bg-ranger-border/40" />
                      </td>
                    </tr>
                  ))
                : species.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-ranger-muted">
                        No species data yet
                      </td>
                    </tr>
                  )
                  : species.map((s) => (
                    <tr
                      key={s.name}
                      ref={(el) => {
                        if (el) speciesRefs.current.set(s.name, el);
                      }}
                      className={`border-b border-ranger-border/40 transition-colors ${
                        highlightedSpecies === s.name
                          ? "bg-ranger-border/40"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-2.5 text-ranger-text">{s.name}</td>
                      <td className="px-4 py-2.5 text-ranger-muted">{s.lastZone}</td>
                      <td className="px-4 py-2.5 text-right text-ranger-text">{s.totalSightings}</td>
                      <td className="px-4 py-2.5">
                        <IucnBadge status={s.iucnStatus} />
                      </td>
                      <td className="px-4 py-2.5 text-right text-ranger-muted">
                        {(s.avgConfidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatPill({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "warning";
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-2 ${
        variant === "warning"
          ? "border-ranger-apricot/30 bg-ranger-apricot/10"
          : "border-ranger-border bg-ranger-card"
      }`}
    >
      <div className="text-xs text-ranger-muted">{label}</div>
      <div
        className={`text-xl font-semibold ${
          variant === "warning" ? "text-ranger-apricot" : "text-ranger-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

const IUCN_COLORS: Record<string, string> = {
  CR: "bg-ranger-cr/20 text-ranger-cr",
  EN: "bg-ranger-en/20 text-ranger-en",
  VU: "bg-ranger-vu/20 text-ranger-vu",
  NT: "bg-ranger-nt/20 text-ranger-nt",
  LC: "bg-ranger-moss/20 text-ranger-moss",
};

function IucnBadge({ status }: { status: string }) {
  const color = IUCN_COLORS[status] ?? "bg-ranger-border text-ranger-muted";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
