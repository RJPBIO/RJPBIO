/* ═══════════════════════════════════════════════════════════════
   PWA Showcase — surfaces the end-user product on the marketing home.
   Three iPhone-style SVG mockups (Ignición · Runner · Perfil), a
   benefit grid, platform install badges (iOS · Android · Browser),
   Design Partner FOMO chip and dual CTA.

   Pure SVG + CSS: no raster assets, no runtime JS work. Tilted
   center-stage composition flattens to stacked on narrow screens via
   `.bi-pwa-stage` in globals.css.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";

export default function PWAShowcase({ T }) {
  return (
    <div className="bi-pwa-showcase">
      <div className="bi-pwa-header">
        <div className="bi-pwa-kicker">{T.kicker}</div>
        <h3 id="pwa-showcase" className="bi-pwa-h">{T.headline}</h3>
        <p className="bi-pwa-sub">{T.sub}</p>
      </div>

      <div className="bi-pwa-stage" role="img" aria-label={T.stageAria}>
        <PhoneFrame tilt={-5} variant="left"><IgnicionScreen T={T.screens.ignicion} /></PhoneFrame>
        <PhoneFrame tilt={0} variant="center" featured><RunnerScreen T={T.screens.runner} /></PhoneFrame>
        <PhoneFrame tilt={5} variant="right"><PerfilScreen T={T.screens.perfil} /></PhoneFrame>
      </div>

      <ol className="bi-pwa-caps" aria-label={T.stageCapsAria}>
        {T.stageCaps.map((c, i) => (
          <li key={i}>
            <span className="num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span className="txt">{c}</span>
          </li>
        ))}
      </ol>

      <ul className="bi-pwa-benefits" aria-label={T.benefitsAria}>
        {T.benefits.map((b, i) => (
          <li key={i} className="bi-pwa-benefit">
            <span className="bi-pwa-bgl" aria-hidden="true">
              <BenefitGlyph name={b.glyph} />
            </span>
            <div>
              <div className="bi-pwa-bt">{b.t}</div>
              <div className="bi-pwa-bd">{b.d}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="bi-pwa-platforms" aria-label={T.platformsAria}>
        <PlatformBadge
          icon={<IosGlyph />}
          label={T.platforms.ios.label}
          sub={T.platforms.ios.sub}
          href="/app"
        />
        <PlatformBadge
          icon={<AndroidGlyph />}
          label={T.platforms.android.label}
          sub={T.platforms.android.sub}
          href="/app"
        />
        <PlatformBadge
          icon={<BrowserGlyph />}
          label={T.platforms.web.label}
          sub={T.platforms.web.sub}
          href="/app"
          variant="soft"
        />
      </div>

      <div className="bi-pwa-cta">
        <div className="bi-pwa-fomo" role="status" aria-live="polite">
          <span className="dot" aria-hidden="true" />
          <span className="txt">{T.fomo}</span>
        </div>
        <div className="bi-pwa-cta-row">
          <Link href="/app" className="bi-pwa-cta-primary">
            {T.ctaPrimary}
          </Link>
          <Link href="/demo" className="bi-pwa-cta-secondary">
            {T.ctaSecondary}
          </Link>
        </div>
        <p className="bi-pwa-cta-foot">{T.ctaFoot}</p>
      </div>
    </div>
  );
}

/* ─── Phone frame ────────────────────────────────────────────── */

function PhoneFrame({ children, tilt = 0, variant = "center", featured }) {
  return (
    <div
      className={`bi-phone ${featured ? "is-featured" : ""}`}
      data-variant={variant}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="bi-phone-body">
        <div className="bi-phone-island" aria-hidden="true" />
        <div className="bi-phone-screen">{children}</div>
        <div className="bi-phone-glare" aria-hidden="true" />
      </div>
      <div className="bi-phone-shadow" aria-hidden="true" />
    </div>
  );
}

/* ─── Screens — simplified SVG renders of the PWA views ──────── */

function IgnicionScreen({ T }) {
  return (
    <svg viewBox="0 0 260 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="bi-phone-svg">
      <defs>
        <linearGradient id="igBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A0F17" />
          <stop offset="100%" stopColor="#06090E" />
        </linearGradient>
        <linearGradient id="igCard" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#12161D" />
          <stop offset="100%" stopColor="#0B0E13" />
        </linearGradient>
      </defs>
      <rect width="260" height="520" fill="url(#igBg)" rx="0" />
      {/* status bar */}
      <g>
        <text x="20" y="30" fontFamily="ui-monospace, monospace" fontSize="9" fill="#9CA3AF" fontWeight="700">9:41</text>
        <g transform="translate(212,22)">
          <rect width="14" height="8" rx="1.5" fill="none" stroke="#9CA3AF" strokeWidth="0.8" />
          <rect x="1.5" y="1.5" width="10" height="5" rx="0.5" fill="#22D3EE" />
          <rect x="15" y="3" width="1.5" height="2.5" fill="#9CA3AF" />
        </g>
      </g>
      {/* brand kicker pill */}
      <g transform="translate(130, 64)">
        <rect x="-52" y="-10" width="104" height="20" rx="10" fill="#22D3EE0F" stroke="#22D3EE22" />
        <circle cx="-40" cy="0" r="2" fill="#22D3EE" />
        <text x="-28" y="3" fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing="1.8" fill="#E5E7EB" fontWeight="800">BIO — IGNICIÓN</text>
      </g>
      {/* readiness ring */}
      <g transform="translate(130, 142)">
        <circle r="44" fill="none" stroke="#1A1F28" strokeWidth="3" />
        <circle r="44" fill="none" stroke="#22D3EE" strokeWidth="3" strokeDasharray="276 400" strokeLinecap="round" transform="rotate(-90)" />
        <text y="-4" fontFamily="ui-monospace, monospace" fontSize="7" fill="#6B7280" letterSpacing="2" textAnchor="middle">READINESS</text>
        <text y="12" fontFamily="Manrope, system-ui, sans-serif" fontSize="24" fontWeight="800" fill="#E5E7EB" textAnchor="middle">72</text>
        <text y="24" fontFamily="ui-monospace, monospace" fontSize="7" fill="#22D3EE" letterSpacing="1.5" textAnchor="middle">ÓPTIMO</text>
      </g>
      {/* 3 quick actions */}
      <g transform="translate(14, 214)">
        {["Suspiro", "HRV", "NSDR"].map((lbl, i) => (
          <g key={lbl} transform={`translate(${i * 77}, 0)`}>
            <rect width="72" height="52" rx="10" fill="url(#igCard)" stroke="#1F232B" />
            <circle cx="36" cy="20" r="7" fill="#22D3EE15" />
            <text x="36" y="23" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="#22D3EE" fontWeight="800">{lbl[0]}</text>
            <text x="36" y="41" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="8" fill="#E5E7EB" fontWeight="700">{lbl}</text>
          </g>
        ))}
      </g>
      {/* daily ignition card */}
      <g transform="translate(14, 284)">
        <rect width="232" height="82" rx="14" fill="url(#igCard)" stroke="#22D3EE22" />
        <text x="14" y="22" fontFamily="ui-monospace, monospace" fontSize="8" fill="#22D3EE" letterSpacing="2" fontWeight="700">IGNICIÓN · HOY</text>
        <text x="14" y="46" fontFamily="Manrope, system-ui, sans-serif" fontSize="15" fontWeight="800" fill="#E5E7EB">{T.todayLabel}</text>
        <text x="14" y="66" fontFamily="Manrope, system-ui, sans-serif" fontSize="9" fill="#9CA3AF" fontStyle="italic">{T.todayPhrase}</text>
        <circle cx="206" cy="46" r="14" fill="#22D3EE15" stroke="#22D3EE" strokeWidth="1" />
        <path d="M 200 46 L 206 40 L 212 46 M 206 40 L 206 52" stroke="#22D3EE" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* protocol selector row */}
      <g transform="translate(14, 382)">
        <rect width="156" height="42" rx="10" fill="url(#igCard)" stroke="#1F232B" />
        <rect x="8" y="8" width="26" height="26" rx="6" fill="#22D3EE10" />
        <text x="21" y="25" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="800" fill="#22D3EE">C</text>
        <text x="42" y="22" fontFamily="Manrope, system-ui, sans-serif" fontSize="9" fontWeight="700" fill="#E5E7EB">{T.protoLabel}</text>
        <text x="42" y="34" fontFamily="ui-monospace, monospace" fontSize="7" fill="#6B7280">{T.protoPhases}</text>
        <rect x="164" y="0" width="32" height="42" rx="10" fill="url(#igCard)" stroke="#1F232B" />
        <circle cx="180" cy="21" r="5" fill="none" stroke="#9CA3AF" strokeWidth="1" />
        <text x="180" y="24" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="7" fill="#9CA3AF" fontWeight="800">i</text>
        <rect x="200" y="0" width="32" height="42" rx="10" fill="url(#igCard)" stroke="#1F232B" />
        <circle cx="216" cy="21" r="4" fill="none" stroke="#9CA3AF" strokeWidth="1" />
        <circle cx="216" cy="21" r="1.5" fill="#9CA3AF" />
      </g>
      {/* bottom nav */}
      <g transform="translate(0, 466)">
        <rect width="260" height="54" fill="#0B0E13" />
        <line x1="0" y1="0" x2="260" y2="0" stroke="#1A1F28" strokeWidth="0.5" />
        {["IGNICIÓN", "Dashboard", "Perfil"].map((lbl, i) => {
          const x = 28 + i * 100;
          const active = i === 0;
          return (
            <g key={lbl} transform={`translate(${x}, 12)`}>
              {active && <circle cx="14" cy="0" r="1.8" fill="#22D3EE" />}
              <rect x="0" y="4" width="28" height="26" rx="8" fill={active ? "#22D3EE12" : "transparent"} />
              <circle cx="14" cy="17" r={active ? 4 : 3.5} fill={active ? "#22D3EE" : "#6B7280"} opacity={active ? 1 : 0.6} />
              <text x="14" y="42" textAnchor="middle" fontFamily={active ? "ui-monospace, monospace" : "Manrope, system-ui, sans-serif"} fontSize="7" fontWeight={active ? "800" : "600"} fill={active ? "#22D3EE" : "#6B7280"} letterSpacing={active ? "1.5" : "0"}>
                {lbl}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function RunnerScreen({ T }) {
  return (
    <svg viewBox="0 0 260 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="bi-phone-svg">
      <defs>
        <radialGradient id="rnBg" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#0E1823" />
          <stop offset="100%" stopColor="#040609" />
        </radialGradient>
        <radialGradient id="rnOrb" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#22D3EE" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rnWave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
          <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect width="260" height="520" fill="url(#rnBg)" />
      {/* scanline hint */}
      <g opacity="0.25">
        {Array.from({ length: 26 }).map((_, i) => (
          <rect key={i} y={i * 20} width="260" height="0.5" fill="#22D3EE" />
        ))}
      </g>
      {/* top phase label */}
      <g transform="translate(130, 90)">
        <text textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing="3" fill="#22D3EE" fontWeight="800">{T.phaseKicker}</text>
        <text textAnchor="middle" y="26" fontFamily="Manrope, system-ui, sans-serif" fontSize="22" fontWeight="900" fill="#E5E7EB" letterSpacing="-0.5">{T.phase}</text>
      </g>
      {/* orb */}
      <g transform="translate(130, 240)">
        <circle r="98" fill="url(#rnOrb)">
          <animate attributeName="r" values="98;116;98" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle r="62" fill="none" stroke="#22D3EE" strokeWidth="1.2" opacity="0.5">
          <animate attributeName="r" values="62;86;62" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle r="42" fill="#22D3EE" opacity="0.12" />
        <circle r="28" fill="none" stroke="#22D3EE" strokeWidth="1.8" opacity="0.85">
          <animate attributeName="r" values="28;34;28" dur="4s" repeatCount="indefinite" />
        </circle>
        <text textAnchor="middle" y="5" fontFamily="ui-monospace, monospace" fontSize="16" fontWeight="800" fill="#E5E7EB" fontVariantNumeric="tabular-nums">00:24</text>
      </g>
      {/* waveform */}
      <g transform="translate(0, 360)">
        <path
          d="M 0 20 C 30 0, 60 40, 90 20 S 150 0, 180 20 S 240 40, 260 20"
          stroke="url(#rnWave)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        >
          <animate attributeName="d"
            values="M 0 20 C 30 0, 60 40, 90 20 S 150 0, 180 20 S 240 40, 260 20;
                    M 0 20 C 30 40, 60 0, 90 20 S 150 40, 180 20 S 240 0, 260 20;
                    M 0 20 C 30 0, 60 40, 90 20 S 150 0, 180 20 S 240 40, 260 20"
            dur="3.2s" repeatCount="indefinite" />
        </path>
      </g>
      {/* ctrls */}
      <g transform="translate(0, 416)">
        <g transform="translate(28, 0)">
          <rect width="92" height="42" rx="21" fill="none" stroke="#22D3EE" strokeWidth="1.2" />
          <text x="46" y="26" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#22D3EE" letterSpacing="1">{T.signalBtn}</text>
        </g>
        <g transform="translate(140, 0)">
          <rect width="92" height="42" rx="21" fill="#22D3EE15" stroke="#22D3EE" strokeWidth="1.2" />
          <text x="46" y="26" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#22D3EE" letterSpacing="1">{T.resetBtn}</text>
        </g>
      </g>
      {/* bottom caption */}
      <g transform="translate(130, 490)">
        <text textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="7" fill="#6B7280" letterSpacing="2">AUDIO · HAPTICS · BINAURAL</text>
      </g>
    </svg>
  );
}

function PerfilScreen({ T }) {
  return (
    <svg viewBox="0 0 260 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="bi-phone-svg">
      <defs>
        <linearGradient id="pfBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A0F17" />
          <stop offset="100%" stopColor="#06090E" />
        </linearGradient>
        <linearGradient id="pfCard" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#12161D" />
          <stop offset="100%" stopColor="#0B0E13" />
        </linearGradient>
        <radialGradient id="pfAvatar" cx="0.35" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="260" height="520" fill="url(#pfBg)" />
      {/* status bar */}
      <g>
        <text x="20" y="30" fontFamily="ui-monospace, monospace" fontSize="9" fill="#9CA3AF" fontWeight="700">9:41</text>
        <g transform="translate(212,22)">
          <rect width="14" height="8" rx="1.5" fill="none" stroke="#9CA3AF" strokeWidth="0.8" />
          <rect x="1.5" y="1.5" width="10" height="5" rx="0.5" fill="#22D3EE" />
        </g>
      </g>
      {/* identity hero */}
      <g transform="translate(130, 90)">
        <circle r="32" fill="url(#pfAvatar)" />
        <circle r="22" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.4" />
        <text textAnchor="middle" y="5" fontFamily="Manrope, system-ui, sans-serif" fontSize="18" fontWeight="900" fill="#E5E7EB">⚡</text>
        <circle cx="18" cy="18" r="9" fill="#8B5CF6" />
        <text x="18" y="21" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="9" fontWeight="800" fill="#fff">n3</text>
      </g>
      <g transform="translate(130, 140)">
        <text textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="14" fontWeight="800" fill="#E5E7EB">{T.operatorLabel}</text>
        <rect x="-32" y="8" width="64" height="16" rx="8" fill="#22D3EE0A" stroke="#22D3EE22" />
        <circle cx="-22" cy="16" r="2" fill="#22D3EE" />
        <text textAnchor="middle" y="20" fontFamily="ui-monospace, monospace" fontSize="8" fontWeight="700" fill="#22D3EE" letterSpacing="1">{T.statusLabel}</text>
      </g>
      {/* auth card (signed in variant) */}
      <g transform="translate(14, 180)">
        <rect width="232" height="46" rx="10" fill="url(#pfCard)" stroke="#1F232B" />
        <circle cx="22" cy="23" r="13" fill="#22D3EE" />
        <text x="22" y="27" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="12" fontWeight="900" fill="#06090E">A</text>
        <text x="45" y="20" fontFamily="Manrope, system-ui, sans-serif" fontSize="10" fontWeight="800" fill="#E5E7EB">{T.syncedName}</text>
        <g transform="translate(45, 28)">
          <circle cx="3" cy="3" r="2.5" fill="#10B981" />
          <text x="11" y="6" fontFamily="ui-monospace, monospace" fontSize="7" fill="#9CA3AF">{T.syncedLabel}</text>
        </g>
      </g>
      {/* baseline card */}
      <g transform="translate(14, 240)">
        <rect width="232" height="142" rx="12" fill="url(#pfCard)" stroke="#22D3EE22" />
        <text x="14" y="20" fontFamily="ui-monospace, monospace" fontSize="8" fill="#22D3EE" letterSpacing="2" fontWeight="700">BASELINE · NEURAL</text>
        <text x="14" y="48" fontFamily="Manrope, system-ui, sans-serif" fontSize="28" fontWeight="800" fill="#E5E7EB" fontVariantNumeric="tabular-nums">78</text>
        <text x="50" y="48" fontFamily="ui-monospace, monospace" fontSize="9" fill="#10B981" fontWeight="700">+4 · 7d</text>
        {[
          { x: 14, y: 64, k: "RT", v: "318" },
          { x: 70, y: 64, k: "BR", v: "42s" },
          { x: 126, y: 64, k: "FOC", v: "86%" },
          { x: 182, y: 64, k: "STR", v: "22" },
        ].map((m) => (
          <g key={m.k}>
            <text x={m.x} y={m.y} fontFamily="ui-monospace, monospace" fontSize="7" fill="#6B7280" letterSpacing="1.5">{m.k}</text>
            <text x={m.x} y={m.y + 14} fontFamily="Manrope, system-ui, sans-serif" fontSize="12" fontWeight="800" fill="#E5E7EB" fontVariantNumeric="tabular-nums">{m.v}</text>
          </g>
        ))}
        {/* sparkline */}
        <path
          d="M 14 120 L 38 114 L 62 118 L 86 108 L 110 112 L 134 102 L 158 106 L 182 98 L 206 94 L 220 96"
          stroke="#22D3EE"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <text x="14" y="134" fontFamily="ui-monospace, monospace" fontSize="6.5" fill="#6B7280" letterSpacing="1">{T.compositeLabel}</text>
      </g>
      {/* stats row */}
      <g transform="translate(14, 396)">
        {[
          { x: 0, v: "42", l: "Sesiones" },
          { x: 82, v: "8h", l: "Tiempo" },
          { x: 164, v: "12", l: "Racha" },
        ].map((s) => (
          <g key={s.l} transform={`translate(${s.x}, 0)`}>
            <rect width="68" height="52" rx="10" fill="url(#pfCard)" stroke="#1F232B" />
            <text x="34" y="24" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="16" fontWeight="800" fill="#E5E7EB" fontVariantNumeric="tabular-nums">{s.v}</text>
            <text x="34" y="40" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="7" fill="#6B7280" letterSpacing="1">{s.l}</text>
          </g>
        ))}
      </g>
      {/* bottom nav */}
      <g transform="translate(0, 466)">
        <rect width="260" height="54" fill="#0B0E13" />
        <line x1="0" y1="0" x2="260" y2="0" stroke="#1A1F28" strokeWidth="0.5" />
        {["Ignición", "Dashboard", "Perfil"].map((lbl, i) => {
          const x = 28 + i * 100;
          const active = i === 2;
          return (
            <g key={lbl} transform={`translate(${x}, 12)`}>
              {active && <circle cx="14" cy="0" r="1.8" fill="#8B5CF6" />}
              <rect x="0" y="4" width="28" height="26" rx="8" fill={active ? "#8B5CF612" : "transparent"} />
              <circle cx="14" cy="17" r={active ? 4 : 3.5} fill={active ? "#8B5CF6" : "#6B7280"} opacity={active ? 1 : 0.6} />
              <text x="14" y="42" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontSize="7" fontWeight={active ? "800" : "600"} fill={active ? "#8B5CF6" : "#6B7280"} letterSpacing={active ? "0.8" : "0"}>
                {lbl}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* ─── Platform badge + glyphs ────────────────────────────────── */

function PlatformBadge({ icon, label, sub, href, variant = "solid" }) {
  return (
    <Link
      href={href}
      className={`bi-pwa-badge ${variant === "soft" ? "is-soft" : ""}`}
      aria-label={`${label} — ${sub}`}
    >
      <span className="bi-pwa-badge-icon" aria-hidden="true">{icon}</span>
      <span className="bi-pwa-badge-text">
        <span className="lbl">{label}</span>
        <span className="sub">{sub}</span>
      </span>
    </Link>
  );
}

function IosGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c-.03-2.76 2.25-4.09 2.35-4.15-1.28-1.87-3.27-2.13-3.98-2.16-1.7-.17-3.31 1-4.17 1-.87 0-2.19-.97-3.6-.95-1.85.03-3.56 1.07-4.51 2.73-1.92 3.33-.49 8.26 1.39 10.97.92 1.33 2.01 2.82 3.44 2.77 1.38-.05 1.9-.89 3.57-.89 1.66 0 2.13.89 3.6.86 1.49-.02 2.43-1.35 3.34-2.69 1.05-1.54 1.48-3.03 1.51-3.11-.03-.02-2.9-1.11-2.94-4.38zM14.3 4.59c.76-.93 1.28-2.21 1.13-3.49-1.1.05-2.43.73-3.22 1.65-.71.82-1.33 2.13-1.16 3.38 1.23.09 2.48-.62 3.25-1.54z"/>
    </svg>
  );
}

function AndroidGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.25 8.75h11.5v8.5a1.5 1.5 0 0 1-1.5 1.5H15v2.25a1 1 0 1 1-2 0V18.75h-2v2.25a1 1 0 1 1-2 0V18.75H7.75a1.5 1.5 0 0 1-1.5-1.5v-8.5zM4.75 9a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm14.5 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zM8.25 3.2a.55.55 0 0 1 .76-.2l1.34.77a4.98 4.98 0 0 1 3.3 0l1.34-.77a.55.55 0 1 1 .56.96l-1.18.68A5 5 0 0 1 17 8.1H7a5 5 0 0 1 2.63-3.46l-1.18-.68a.55.55 0 0 1-.2-.76zM9.5 6.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm5 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/>
    </svg>
  );
}

function BrowserGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

/* ─── Benefit glyphs ─────────────────────────────────────────── */

function BenefitGlyph({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "download":
      return <svg {...common}><path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16"/></svg>;
    case "wifi-off":
      return <svg {...common}><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 3-1.9M19 12.5a10 10 0 0 0-6-2.5"/><circle cx="12" cy="20" r="1"/></svg>;
    case "lock":
      return <svg {...common}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>;
    case "brain":
      return <svg {...common}><path d="M9 4a3 3 0 0 1 3 3v10a3 3 0 0 1-6 0v-1a2 2 0 0 1-1-3.5A2 2 0 0 1 6 9a3 3 0 0 1 3-5zM15 4a3 3 0 0 0-3 3v10a3 3 0 0 0 6 0v-1a2 2 0 0 0 1-3.5A2 2 0 0 0 18 9a3 3 0 0 0-3-5z"/></svg>;
    case "waves":
      return <svg {...common}><path d="M3 9c2 0 2.5-2 4.5-2S10 9 12 9s2.5-2 4.5-2S19 9 21 9M3 15c2 0 2.5-2 4.5-2S10 15 12 15s2.5-2 4.5-2S19 15 21 15"/></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    default:
      return null;
  }
}
