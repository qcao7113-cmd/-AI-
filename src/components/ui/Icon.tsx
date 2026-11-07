import type { SVGProps } from 'react'

/** 极简线性图标集（stroke 风格，统一 24×24 视口） */
type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (p: IconProps) => ({
  width: p.size ?? 18,
  height: p.size ?? 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
})

export const Icon = {
  Dashboard: (p: IconProps) => (
    <svg {...base(p)}><rect x="3" y="3" width="7" height="9" rx="1.6" /><rect x="14" y="3" width="7" height="5" rx="1.6" /><rect x="14" y="12" width="7" height="9" rx="1.6" /><rect x="3" y="16" width="7" height="5" rx="1.6" /></svg>
  ),
  Users: (p: IconProps) => (
    <svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16.5 4.6a3.2 3.2 0 0 1 0 6.4" /><path d="M18 14.2A6.5 6.5 0 0 1 21.5 20" /></svg>
  ),
  Shield: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 3 4.5 6v6c0 4.2 3.2 7.6 7.5 9 4.3-1.4 7.5-4.8 7.5-9V6L12 3Z" /><path d="m9 12 2 2 4-4" /></svg>
  ),
  Leaf: (p: IconProps) => (
    <svg {...base(p)}><path d="M11 20c0-6 3.5-11 9.5-13C21 14 16.5 20 11 20Z" /><path d="M11 20C7.5 18 4 15 4 11c0 0 2.5.2 4.3 1.6" /><path d="M11 20c0-3 1-5.5 3-7.5" /></svg>
  ),
  Bowl: (p: IconProps) => (
    <svg {...base(p)}><path d="M3 11h18a9 9 0 0 1-9 8.5A9 9 0 0 1 3 11Z" /><path d="M8 7.5c0-1.5 1.5-1.5 1.5-3M12 7c0-1.8 1.6-1.8 1.6-3.5M16 7.5c0-1.5 1.5-1.5 1.5-3" /></svg>
  ),
  Utensils: (p: IconProps) => (
    <svg {...base(p)}><path d="M6 3v8M9 3v8M6 11h3a1.5 1.5 0 0 0 0 0v10M17 3c-1.5 1.5-2 3.5-2 6s.5 3 2 3v9" /><path d="M17 3v18" /></svg>
  ),
  Heart: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 20s-7.5-4.4-7.5-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 3C19.5 15.6 12 20 12 20Z" /></svg>
  ),
  Stethoscope: (p: IconProps) => (
    <svg {...base(p)}><path d="M5 3v6a4 4 0 0 0 8 0V3" /><path d="M9 13v2a5 5 0 0 0 10 0v-2" /><circle cx="19" cy="10" r="2" /></svg>
  ),
  Scroll: (p: IconProps) => (
    <svg {...base(p)}><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V3Z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>
  ),
  Settings: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
  ),
  Bell: (p: IconProps) => (
    <svg {...base(p)}><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" /><path d="M10.5 19a2 2 0 0 0 3 0" /></svg>
  ),
  Search: (p: IconProps) => (
    <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
  ),
  Edit: (p: IconProps) => (
    <svg {...base(p)}><path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
  ),
  Trash: (p: IconProps) => (
    <svg {...base(p)}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /><path d="M10 11v5M14 11v5" /></svg>
  ),
  Close: (p: IconProps) => (
    <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
  ),
  ChevronLeft: (p: IconProps) => (
    <svg {...base(p)}><path d="m14 6-6 6 6 6" /></svg>
  ),
  ChevronRight: (p: IconProps) => (
    <svg {...base(p)}><path d="m10 6 6 6-6 6" /></svg>
  ),
  ChevronDown: (p: IconProps) => (
    <svg {...base(p)}><path d="m6 10 6 6 6-6" /></svg>
  ),
  Sun: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  ),
  Moon: (p: IconProps) => (
    <svg {...base(p)}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
  ),
  Download: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 4v11M8 11l4 4 4-4" /><path d="M4 19h16" /></svg>
  ),
  Refresh: (p: IconProps) => (
    <svg {...base(p)}><path d="M20 11a8 8 0 0 0-14.9-3.5M4 13a8 8 0 0 0 14.9 3.5" /><path d="M20 4v4h-4M4 20v-4h4" /></svg>
  ),
  LogOut: (p: IconProps) => (
    <svg {...base(p)}><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 17l-5-5 5-5M5 12h10" /></svg>
  ),
  Menu: (p: IconProps) => (
    <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base(p)}><path d="m5 13 4 4L19 7" /></svg>
  ),
  Alert: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v5M12 17h.01" /></svg>
  ),
  Info: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
  ),
  Eye: (p: IconProps) => (
    <svg {...base(p)}><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.6" /></svg>
  ),
  Filter: (p: IconProps) => (
    <svg {...base(p)}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" /></svg>
  ),
  Clock: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  Sparkle: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></svg>
  ),
  Droplet: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3Z" /></svg>
  ),
  Flask: (p: IconProps) => (
    <svg {...base(p)}><path d="M9 3h6M10 3v5.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 8.5V3" /><path d="M7.5 14h9" /></svg>
  ),
  Chart: (p: IconProps) => (
    <svg {...base(p)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
  ),
}

export type IconName = keyof typeof Icon
