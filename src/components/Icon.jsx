"use client";
/* ═══════════════════════════════════════════════════════════════
   ICON SYSTEM — Wrapper sobre lucide-react
   Mapea nombres semánticos del dominio neural a iconos SVG
   ═══════════════════════════════════════════════════════════════ */

import {
  Frown, Meh, Minus, Eye, Smile, Crosshair, Zap, RotateCcw,
  Wind, Brain, Heart, TrendingUp, Flame, ArrowRight, AlertTriangle,
  Star, Check, Clock, BarChart3, User, Settings, Briefcase, Download,
  Trophy, Activity, Radio, ChevronDown, Shuffle, BatteryLow,
  TrendingDown, Sparkles, Target, Shield, Waves, Sun, Moon,
  Volume2, VolumeX, Vibrate, Palette, FileText, RotateCw,
  Play, Pause, Square, ChevronRight, Info, X, Cpu, Gauge,
  Compass, Lightbulb, Fingerprint, CircleDot, Loader2, Leaf,
} from "lucide-react";
import { BIO_ICONS } from "./BioIcons";

const ICON_MAP = {
  // Mood states
  stress: Frown,
  drain: Meh,
  neutral: Minus,
  sharp: Eye,
  peak: Smile,

  // Neural domains
  calm: Waves,
  leaf: Leaf,
  focus: Crosshair,
  energy: Zap,
  reset: RotateCcw,
  breath: Wind,
  mind: Brain,
  body: Heart,
  heart: Heart,

  // Actions & indicators
  up: TrendingUp,
  down: TrendingDown,
  fire: Flame,
  rec: ArrowRight,
  alert: AlertTriangle,
  star: Star,
  check: Check,
  clock: Clock,
  bolt: Zap,
  chart: BarChart3,
  user: User,
  gear: Settings,
  brief: Briefcase,
  export: Download,
  trophy: Trophy,
  predict: Activity,
  radar: Radio,
  sparkle: Sparkles,
  target: Target,
  shield: Shield,
  sun: Sun,
  moon: Moon,

  // Media & controls
  "volume-on": Volume2,
  "volume-off": VolumeX,
  vibrate: Vibrate,
  palette: Palette,
  file: FileText,
  refresh: RotateCw,
  play: Play,
  pause: Pause,
  stop: Square,
  chevron: ChevronRight,
  "chevron-down": ChevronDown,
  info: Info,
  close: X,
  x: X,
  shuffle: Shuffle,

  // Neural-specific
  cpu: Cpu,
  gauge: Gauge,
  compass: Compass,
  lightbulb: Lightbulb,
  fingerprint: Fingerprint,
  dot: CircleDot,
  loader: Loader2,
  "battery-low": BatteryLow,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "alert-triangle": AlertTriangle,
};

export default function Icon({
  name,
  size = 16,
  color = "#64748B",
  className = "",
  strokeWidth = 1.8,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHiddenProp,
}) {
  const BioComponent = BIO_ICONS[name];
  if (BioComponent) {
    return <BioComponent size={size} color={color} strokeWidth={strokeWidth} aria={ariaLabel} />;
  }
  const Component = ICON_MAP[name];
  if (!Component) return null;
  const ariaHidden = ariaHiddenProp ?? !ariaLabel;
  return (
    <Component
      size={size}
      color={color}
      className={className}
      strokeWidth={strokeWidth}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ? "true" : undefined}
      role={ariaLabel ? "img" : undefined}
      focusable="false"
    />
  );
}
