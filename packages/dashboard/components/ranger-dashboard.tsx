"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// ============ TYPES ============
type Breakpoint = "mobile" | "tablet" | "desktop";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  active?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ============ HOOKS ============
function useWindowSize() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint("mobile");
      } else if (width < 1080) {
        setBreakpoint("tablet");
      } else {
        setBreakpoint("desktop");
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}

function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return count;
}

function useStaggeredMount(itemCount: number, baseDelay: number = 100) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(
    Array(itemCount).fill(false)
  );

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    for (let i = 0; i < itemCount; i++) {
      timeouts.push(
        setTimeout(() => {
          setVisibleItems((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, baseDelay * (i + 1))
      );
    }

    return () => timeouts.forEach(clearTimeout);
  }, [itemCount, baseDelay]);

  return visibleItems;
}

// ============ ICONS ============
const Icons = {
  Dashboard: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Map: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  Alert: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Zone: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Animal: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
      <path d="M14.5 5.172C14.5 3.782 16.077 2.679 18 3c2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5" />
      <path d="M8 14v.5" />
      <path d="M16 14v.5" />
      <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
      <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306" />
    </svg>
  ),
  Species: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Sighting: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Dispatch: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  ),
  Report: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Logs: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Bell: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Support: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Menu: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Search: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  MoreVertical: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ArrowUp: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  ArrowDown: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  Filter: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Stable: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Risk: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

// ============ DATA ============
const navSections: NavSection[] = [
  {
    title: "MONITORING",
    items: [
      { name: "Dashboard", icon: <Icons.Dashboard />, active: true },
      { name: "Live Map", icon: <Icons.Map /> },
      { name: "Alert Feed", icon: <Icons.Alert /> },
      { name: "Zone Manager", icon: <Icons.Zone /> },
    ],
  },
  {
    title: "WILDLIFE",
    items: [
      { name: "Animal Tracker", icon: <Icons.Animal /> },
      { name: "Species Index", icon: <Icons.Species /> },
      { name: "Sighting Log", icon: <Icons.Sighting /> },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { name: "Ranger Dispatch", icon: <Icons.Dispatch /> },
      { name: "Reports", icon: <Icons.Report /> },
      { name: "Agent Logs", icon: <Icons.Logs /> },
    ],
  },
];

const agentPipeline = [
  { name: "Ingest Agent", status: "Polling", color: "#4a7c5a" },
  { name: "Vision Agent", status: "Classifying", color: "#4a7c5a" },
  { name: "Threat Agent", status: "1 Warning", color: "#B86F0A" },
  { name: "Alert Agent", status: "Active", color: "#4a7c5a" },
];

// deterministic demo data - avoids hydration mismatches
const sightingData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  sightings: 20 + ((i * 37 + 13) % 80),
  incidents: 5 + ((i * 17 + 7) % 15),
  resolved: -(3 + ((i * 11 + 5) % 12)),
}));

const zoneHealthData = [
  { name: "Northern Corridor", coverage: 87, color: "#4a7c5a" },
  { name: "Eastern Plains", coverage: 72, color: "#4a7c5a" },
  { name: "River Delta", coverage: 95, color: "#4a7c5a" },
  { name: "Southern Scrub", coverage: 58, color: "#B86F0A" },
];

const recentSightings = [
  { zone: "ZN-01", species: "African Elephant", threat: "INFO", time: "2 mins ago" },
  { zone: "ZN-03", species: "Lion Pride", threat: "WARNING", time: "8 mins ago" },
  { zone: "ZN-02", species: "Cape Buffalo", threat: "INFO", time: "15 mins ago" },
  { zone: "ZN-07", species: "Leopard", threat: "CRITICAL", time: "22 mins ago" },
  { zone: "ZN-04", species: "Cheetah", threat: "WARNING", time: "31 mins ago" },
  { zone: "ZN-09", species: "Black Rhino", threat: "CRITICAL", time: "45 mins ago" },
];

const frequencyData = Array.from({ length: 7 * 24 }, (_, i) => ({
  hour: i,
  elephant: Math.sin(i / 6) * 20 + 30,
  lion: Math.cos(i / 8) * 15 + 25,
  rhino: Math.sin(i / 10 + 2) * 12 + 18,
}));

// chart theme - colours matched to dark forest palette
const CHART = {
  grid: "#CBC8C0",
  axis: "#7A7670",
  tooltipBg: "#F2EFE8",
  tooltipBorder: "#CBC8C0",
  tooltipText: "#1C2417",
  bar1: "#4a7c5a",   // sightings - sage green
  bar2: "#B86F0A",   // incidents - amber
  bar3: "#9A9790",   // resolved - muted
  line1: "#1C2417",  // elephant - dark
  line2: "#B86F0A",  // lion - amber
  line3: "#4a7c5a",  // rhino - sage
} as const;

// ============ COMPONENTS ============
function StatCard({
  title,
  value,
  subtitle,
  trend,
  visible,
  delay,
}: {
  title: string;
  value: number;
  subtitle: string;
  trend: "up" | "down";
  visible: boolean;
  delay: number;
}) {
  const count = useCountUp(visible ? value : 0, 1500);

  return (
    <div
      className="rounded-xl border border-ranger-border bg-ranger-card p-5 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="text-sm text-ranger-muted">{title}</div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-3xl font-semibold text-ranger-cream">{count}</span>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
            trend === "up"
              ? "bg-ranger-moss/20 text-ranger-moss"
              : "bg-ranger-apricot/20 text-ranger-apricot"
          }`}
        >
          {trend === "up" ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
        </span>
      </div>
      <div className="mt-1 text-sm text-ranger-muted">{subtitle}</div>
    </div>
  );
}

function ZoneProgressBar({
  name,
  coverage,
  color,
  visible,
  delay,
}: {
  name: string;
  coverage: number;
  color: string;
  visible: boolean;
  delay: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setWidth(coverage), delay);
      return () => clearTimeout(timer);
    }
  }, [visible, coverage, delay]);

  return (
    <div className="py-2">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-ranger-cream">{name}</span>
        <span className="text-ranger-muted">{coverage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-ranger-border">
        <div
          className="h-2 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ThreatBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    CRITICAL: "bg-ranger-spice text-ranger-cream",
    WARNING: "bg-ranger-apricot text-ranger-cream",
    INFO: "bg-ranger-moss text-ranger-cream",
  };

  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[level]}`}>
      {level}
    </span>
  );
}

function Sidebar({
  isOpen,
  onClose,
  breakpoint,
}: {
  isOpen: boolean;
  onClose: () => void;
  breakpoint: Breakpoint;
}) {
  const sidebarContent = (
    <div className="flex h-full flex-col bg-ranger-card">
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-3 border-b border-ranger-border px-4">
        <span className="text-lg font-semibold text-ranger-cream">RangerAI</span>
        {breakpoint === "mobile" && (
          <button
            onClick={onClose}
            className="ml-auto text-ranger-muted hover:text-ranger-cream"
          >
            <Icons.Close />
          </button>
        )}
      </div>

      {/* Zone Selector */}
      <div className="border-b border-ranger-border p-4">
        <button className="flex w-full items-center justify-between rounded-lg bg-ranger-border/50 p-3 text-left">
          <div>
            <div className="text-sm font-medium text-ranger-cream">Serengeti Reserve</div>
            <div className="text-xs text-ranger-muted">12 zones monitored</div>
          </div>
          <span className="text-ranger-cream"><Icons.ChevronDown /></span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="mb-2 px-3 text-xs font-medium uppercase tracking-widest text-ranger-muted">
              {section.title}
            </div>
            {section.items.map((item) => (
              <button
                key={item.name}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.active
                    ? "border border-ranger-moss/30 bg-ranger-border/50 text-ranger-cream"
                    : "text-ranger-muted hover:bg-ranger-border/30 hover:text-ranger-cream"
                }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-ranger-border p-3">
        <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-ranger-muted hover:bg-ranger-border/30 hover:text-ranger-cream">
          <div className="flex items-center gap-3">
            <Icons.Bell />
            Notifications
          </div>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ranger-apricot px-1.5 text-xs font-medium text-ranger-cream">
            8
          </span>
        </button>
        {/* User Profile */}
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-ranger-border/30 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ranger-moss text-sm font-medium text-ranger-cream">
            AD
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-ranger-cream">Amara Diallo</div>
            <div className="text-xs text-ranger-muted">Head Ranger</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (breakpoint === "mobile") {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
        )}
        <div
          className={`fixed left-0 top-0 z-50 h-full w-[280px] transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-[calc(100%-40px)] w-[220px]">
      {sidebarContent}
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function RangerDashboard() {
  const breakpoint = useWindowSize();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [frequencyTab, setFrequencyTab] = useState("7 Days");
  const cardsVisible = useStaggeredMount(3, 150);
  const zonesVisible = useStaggeredMount(4, 100);
  // hoisted out of JSX to satisfy React rules of hooks
  const zoneAnimalCount = useCountUp(847, 1500);

  const isMobile = breakpoint === "mobile";
  const isDesktop = breakpoint === "desktop";

  return (
    <div className="flex h-screen flex-col bg-ranger-bg font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        breakpoint={breakpoint}
      />

      {/* Main Content */}
      <div className={`flex flex-1 flex-col overflow-hidden ${isDesktop ? "ml-[220px]" : ""}`}>
        {/* Scrollable Content */}
        <div className="ranger-scrollbar flex-1 overflow-y-auto pb-10">
          {/* Header */}
          <header className="sticky top-0 z-30 h-[72px] border-b border-ranger-border bg-ranger-bg px-4 md:px-6">
            <div className="flex h-full items-center justify-between">
              <div className="flex items-center gap-4">
                {!isDesktop && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-ranger-muted hover:text-ranger-cream"
                  >
                    <Icons.Menu />
                  </button>
                )}
                <h1 className="text-xl font-semibold text-ranger-cream md:text-2xl">
                  Dashboard
                </h1>
              </div>

              {/* Search & Menu */}
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-lg border border-ranger-border bg-ranger-card px-3 py-2 sm:flex">
                  <Icons.Search />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-32 bg-transparent text-sm text-ranger-cream placeholder-ranger-muted outline-none lg:w-48"
                  />
                </div>
                <button className="rounded-lg p-2 text-ranger-muted hover:bg-ranger-border/30 hover:text-ranger-cream">
                  <Icons.MoreVertical />
                </button>
              </div>
            </div>
          </header>

          {/* Agent Pipeline Status */}
          <div className="border-b border-ranger-border bg-ranger-card/50 px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {agentPipeline.map((agent) => (
                  <div
                    key={agent.name}
                    className="flex items-center gap-2 rounded-full border border-ranger-border bg-ranger-bg px-3 py-1.5"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    />
                    <span className="text-xs text-ranger-muted">{agent.name}</span>
                    <span className="text-xs font-medium text-ranger-cream">{agent.status}</span>
                  </div>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="animate-pulse-live h-2 w-2 rounded-full bg-ranger-moss" />
                <span className="font-mono text-xs uppercase tracking-widest text-ranger-moss">
                  LIVE
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="p-4 md:p-6">
            {/* Stat Cards */}
            <div className={`mb-6 grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
              <StatCard
                title="Active Zones"
                value={3}
                subtitle="of 12 zones online"
                trend="up"
                visible={cardsVisible[0]}
                delay={0}
              />
              <StatCard
                title="Species Tracked"
                value={847}
                subtitle="across all species"
                trend="up"
                visible={cardsVisible[1]}
                delay={100}
              />
              <StatCard
                title="Alerts Today"
                value={14}
                subtitle="6 resolved, 8 open"
                trend="down"
                visible={cardsVisible[2]}
                delay={200}
              />
            </div>

            {/* Charts Row */}
            <div className={`mb-6 grid gap-6 ${isDesktop ? "grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
              {/* Sighting Activity Chart */}
              <div className="rounded-xl border border-ranger-border bg-ranger-card p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-ranger-cream">Sighting Activity</h2>
                  <div className="flex items-center gap-2">
                    <select className="rounded-lg border border-ranger-border bg-ranger-bg px-3 py-1.5 text-sm text-ranger-cream outline-none">
                      <option>All Zones</option>
                      <option>Northern Corridor</option>
                      <option>Eastern Plains</option>
                    </select>
                    <select className="rounded-lg border border-ranger-border bg-ranger-bg px-3 py-1.5 text-sm text-ranger-cream outline-none">
                      <option>30 Days</option>
                      <option>7 Days</option>
                      <option>90 Days</option>
                    </select>
                    <button className="rounded-lg border border-ranger-border p-1.5 text-ranger-muted hover:bg-ranger-border/30 hover:text-ranger-cream">
                      <Icons.Filter />
                    </button>
                  </div>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sightingData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={CHART.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: CHART.axis, fontSize: 10 }}
                        tickLine={{ stroke: CHART.grid }}
                        axisLine={{ stroke: CHART.grid }}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fill: CHART.axis, fontSize: 10 }}
                        tickLine={{ stroke: CHART.grid }}
                        axisLine={{ stroke: CHART.grid }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART.tooltipBg,
                          border: `1px solid ${CHART.tooltipBorder}`,
                          borderRadius: "8px",
                          color: CHART.tooltipText,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, color: CHART.axis }} />
                      <ReferenceLine y={0} stroke={CHART.grid} />
                      <Bar dataKey="sightings" fill={CHART.bar1} name="Sightings" animationDuration={1000} />
                      <Bar dataKey="incidents" fill={CHART.bar2} name="Incidents" animationDuration={1000} />
                      <Bar dataKey="resolved" fill={CHART.bar3} name="Resolved" animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sighting Frequency */}
              <div className="rounded-xl border border-ranger-border bg-ranger-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-ranger-cream">Sighting Frequency</h2>
                </div>
                <div className="mb-4 flex gap-1">
                  {["7 Days", "30 Days", "90 Days"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFrequencyTab(tab)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        frequencyTab === tab
                          ? "bg-ranger-border text-ranger-cream"
                          : "text-ranger-muted hover:text-ranger-cream"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={frequencyData.slice(0, 48)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={CHART.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: CHART.axis, fontSize: 10 }}
                        tickLine={{ stroke: CHART.grid }}
                        axisLine={{ stroke: CHART.grid }}
                        interval={11}
                      />
                      <YAxis
                        tick={{ fill: CHART.axis, fontSize: 10 }}
                        tickLine={{ stroke: CHART.grid }}
                        axisLine={{ stroke: CHART.grid }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART.tooltipBg,
                          border: `1px solid ${CHART.tooltipBorder}`,
                          borderRadius: "8px",
                          color: CHART.tooltipText,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: CHART.axis }} />
                      <Line
                        type="monotone"
                        dataKey="elephant"
                        stroke={CHART.line1}
                        strokeWidth={2}
                        dot={false}
                        name="Elephant"
                        animationDuration={1000}
                      />
                      <Line
                        type="monotone"
                        dataKey="lion"
                        stroke={CHART.line2}
                        strokeWidth={2}
                        dot={false}
                        name="Lion"
                        animationDuration={1000}
                      />
                      <Line
                        type="monotone"
                        dataKey="rhino"
                        stroke={CHART.line3}
                        strokeWidth={2}
                        dot={false}
                        name="Rhino"
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Panels */}
            <div className={`grid gap-6 ${isDesktop ? "grid-cols-2" : "grid-cols-1"}`}>
              {/* Zone Health */}
              <div className="rounded-xl border border-ranger-border bg-ranger-card p-5">
                <h2 className="mb-4 text-lg font-semibold text-ranger-cream">Zone Health</h2>
                <div className="mb-4">
                  <div className="text-3xl font-semibold text-ranger-cream">
                    {zoneAnimalCount} Animals
                  </div>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="text-ranger-moss">
                      <Icons.Stable />
                    </div>
                    <span className="text-sm text-ranger-muted">Stable Population</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-ranger-apricot">
                      <Icons.Risk />
                    </div>
                    <span className="text-sm text-ranger-muted">At Risk Population</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {zoneHealthData.map((zone, i) => (
                    <ZoneProgressBar
                      key={zone.name}
                      name={zone.name}
                      coverage={zone.coverage}
                      color={zone.color}
                      visible={zonesVisible[i]}
                      delay={i * 100}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Sightings */}
              <div className="rounded-xl border border-ranger-border bg-ranger-card p-5">
                <h2 className="mb-4 text-lg font-semibold text-ranger-cream">Recent Sightings</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ranger-border text-left text-xs uppercase text-ranger-muted">
                        <th className="pb-3 pr-4">Zone</th>
                        <th className="pb-3 pr-4">Species</th>
                        <th className="pb-3 pr-4">Threat</th>
                        <th className="pb-3 pr-4">Time</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSightings.map((sighting, i) => (
                        <tr
                          key={i}
                          className="border-b border-ranger-border/50 last:border-0"
                        >
                          <td className="py-3 pr-4 text-sm text-ranger-muted">{sighting.zone}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ranger-border text-xs font-medium text-ranger-cream">
                                {sighting.species[0]}
                              </div>
                              <span className="text-sm text-ranger-cream">{sighting.species}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <ThreatBadge level={sighting.threat} />
                          </td>
                          <td className="py-3 pr-4 text-sm text-ranger-muted">{sighting.time}</td>
                          <td className="py-3">
                            <button className="text-ranger-muted hover:text-ranger-cream">
                              <Icons.MoreVertical />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Guardrail Footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-10 items-center justify-between border-t border-ranger-border bg-ranger-footer px-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ranger-moss" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/civic-logo.png" alt="Civic" className="h-4 w-auto opacity-80" />
            <span className="font-mono text-xs uppercase tracking-widest text-ranger-muted">
              Guardrails Active
            </span>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <span className="rounded bg-ranger-border/50 px-2 py-0.5 font-mono text-xs uppercase tracking-widest text-ranger-muted">
              124 calls audited
            </span>
            <span className="rounded bg-ranger-border/50 px-2 py-0.5 font-mono text-xs uppercase tracking-widest text-ranger-muted">
              3 injections blocked
            </span>
            <span className="rounded bg-ranger-border/50 px-2 py-0.5 font-mono text-xs uppercase tracking-widest text-ranger-muted">
              0 errors
            </span>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-ranger-muted">
            civic-mcp v1.0
          </span>
        </footer>
      </div>
    </div>
  );
}
