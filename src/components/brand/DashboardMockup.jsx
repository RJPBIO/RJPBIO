/* DashboardMockup — editorial SVG scene for the product preview fold.
   A stand-in until we can ship a pixel render of the real dashboard.
   Uses the phosphor + neural palette so it reads as "ours" even as a
   vector. Purely decorative: captioned by the section label upstream. */
export default function DashboardMockup({ ariaLabel = "BIO-IGNICIÓN dashboard preview" }) {
  return (
    <div className="bi-dashboard-mockup" role="img" aria-label={ariaLabel}>
      <svg viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#0F1115" />
            <stop offset="100%" stopColor="#0A0B0F" />
          </linearGradient>
          <linearGradient id="hrvGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#14161B" />
            <stop offset="100%" stopColor="#0E1014" />
          </linearGradient>
          <radialGradient id="pulseGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%"  stopColor="#22D3EE" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1200" height="700" fill="url(#bgGrad)" />

        {/* Top chrome: titlebar */}
        <g>
          <rect x="0" y="0" width="1200" height="48" fill="#0C0E12" />
          <circle cx="22" cy="24" r="6" fill="#FF5F57" />
          <circle cx="42" cy="24" r="6" fill="#FEBC2E" />
          <circle cx="62" cy="24" r="6" fill="#28C840" />
          <rect x="520" y="14" width="260" height="20" rx="10" fill="#1A1D24" />
          <text x="650" y="28" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="11" fill="#6B7280" textAnchor="middle">
            app.bio-ignicion.app / dashboard
          </text>
        </g>

        {/* Sidebar */}
        <g>
          <rect x="0" y="48" width="200" height="652" fill="#0B0D11" />
          <g fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="11" fill="#9CA3AF">
            <rect x="16" y="68" width="168" height="36" rx="8" fill="#101318" />
            <circle cx="32" cy="86" r="4" fill="#22D3EE" />
            <text x="48" y="90">Dashboard</text>

            <text x="20" y="140" fill="#6B7280" letterSpacing="2">SESIONES</text>
            <text x="20" y="168">Calma</text>
            <text x="20" y="192">Enfoque</text>
            <text x="20" y="216">Energía</text>
            <text x="20" y="240">Reset</text>

            <text x="20" y="290" fill="#6B7280" letterSpacing="2">EQUIPO</text>
            <text x="20" y="318">Miembros</text>
            <text x="20" y="342">NOM-035</text>
            <text x="20" y="366">Export</text>

            <text x="20" y="416" fill="#6B7280" letterSpacing="2">AJUSTES</text>
            <text x="20" y="444">Integraciones</text>
            <text x="20" y="468">Seguridad</text>
            <text x="20" y="492">API keys</text>
          </g>
        </g>

        {/* Main — kicker + title */}
        <g>
          <text x="232" y="96" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="11" fill="#22D3EE" letterSpacing="3">
            PULSO · HOY
          </text>
          <text x="232" y="132" fontFamily="Manrope, system-ui, sans-serif" fontSize="28" fontWeight="800" fill="#E5E7EB" letterSpacing="-1">
            Tu sistema nervioso, en una línea.
          </text>
        </g>

        {/* HRV chart card */}
        <g>
          <rect x="232" y="168" width="620" height="240" rx="14" fill="url(#cardGrad)" stroke="#1F232B" />
          <text x="252" y="196" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" fill="#6B7280" letterSpacing="2">HRV · RMSSD · 7 D</text>
          <text x="252" y="228" fontFamily="Manrope, system-ui, sans-serif" fontSize="36" fontWeight="800" fill="#E5E7EB">58ms</text>
          <text x="330" y="228" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="12" fill="#22D3EE">
            +9%
            <animate attributeName="opacity" values="1;0.35;1" dur="2.2s" repeatCount="indefinite" />
          </text>

          {/* Waveform — breathing curve */}
          <path
            d="M 252 360
               C 282 300, 312 330, 342 320
               S 402 280, 432 310
               S 492 360, 522 330
               S 582 280, 612 300
               S 672 340, 702 320
               S 762 280, 792 300
               S 822 330, 842 310"
            stroke="url(#hrvGrad)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Grid */}
          <g stroke="#1A1D24" strokeWidth="1">
            <line x1="252" y1="268" x2="842" y2="268" />
            <line x1="252" y1="324" x2="842" y2="324" />
            <line x1="252" y1="380" x2="842" y2="380" />
          </g>
        </g>

        {/* Live pulse orb card */}
        <g>
          <rect x="872" y="168" width="296" height="240" rx="14" fill="url(#cardGrad)" stroke="#1F232B" />
          <text x="892" y="196" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" fill="#6B7280" letterSpacing="2">PULSO · EN VIVO</text>
          <circle cx="1020" cy="290" r="90" fill="url(#pulseGlow)">
            <animate attributeName="r" values="90;104;90" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="1020" cy="290" r="42" fill="none" stroke="#22D3EE" strokeWidth="2" opacity="0.85">
            <animate attributeName="r" values="42;66;42" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.85;0;0.85" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="1020" cy="290" r="22" fill="#22D3EE" opacity="0.85">
            <animate attributeName="r" values="22;26;22" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <text x="1020" y="380" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="11" fill="#9CA3AF" textAnchor="middle" letterSpacing="2">
            6 · 0 RPM · COHERENCIA 0.71
          </text>
        </g>

        {/* Stats row */}
        <g>
          <rect x="232" y="432" width="300" height="116" rx="14" fill="url(#cardGrad)" stroke="#1F232B" />
          <text x="252" y="460" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" fill="#6B7280" letterSpacing="2">ADHERENCIA · 14 D</text>
          <text x="252" y="502" fontFamily="Manrope, system-ui, sans-serif" fontSize="34" fontWeight="800" fill="#E5E7EB">84%</text>
          <rect x="252" y="520" width="260" height="6" rx="3" fill="#1A1D24" />
          <rect x="252" y="520" width="218" height="6" rx="3" fill="#22D3EE" />

          <rect x="552" y="432" width="300" height="116" rx="14" fill="url(#cardGrad)" stroke="#1F232B" />
          <text x="572" y="460" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" fill="#6B7280" letterSpacing="2">SUEÑO · DEEP</text>
          <text x="572" y="502" fontFamily="Manrope, system-ui, sans-serif" fontSize="34" fontWeight="800" fill="#E5E7EB">1h 42m</text>
          <text x="572" y="528" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="11" fill="#22D3EE">+18 min vs baseline</text>

          <rect x="872" y="432" width="296" height="116" rx="14" fill="url(#cardGrad)" stroke="#1F232B" />
          <text x="892" y="460" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" fill="#6B7280" letterSpacing="2">EVIDENCIA · CITADA</text>
          <text x="892" y="502" fontFamily="Manrope, system-ui, sans-serif" fontSize="34" fontWeight="800" fill="#E5E7EB">12 / 12</text>
          <text x="892" y="528" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="11" fill="#8B5CF6">Protocolos con DOI</text>
        </g>

        {/* Protocol row */}
        <g>
          <rect x="232" y="572" width="936" height="104" rx="14" fill="url(#cardGrad)" stroke="#1F232B" />
          <text x="252" y="600" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="10" fill="#6B7280" letterSpacing="2">PROTOCOLOS · HOY</text>
          {[
            { x: 252, label: "Calma",   pct: "92%", color: "#22D3EE" },
            { x: 472, label: "Enfoque", pct: "78%", color: "#8B5CF6" },
            { x: 692, label: "Energía", pct: "65%", color: "#22D3EE" },
            { x: 912, label: "Reset",   pct: "88%", color: "#8B5CF6" },
          ].map((p) => (
            <g key={p.label}>
              <text x={p.x} y="628" fontFamily="Manrope, system-ui, sans-serif" fontSize="13" fontWeight="700" fill="#E5E7EB">{p.label}</text>
              <text x={p.x + 80} y="628" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="12" fill={p.color}>{p.pct}</text>
              <rect x={p.x} y="644" width="180" height="6" rx="3" fill="#1A1D24" />
              <rect x={p.x} y="644" width={Number.parseInt(p.pct) * 1.8} height="6" rx="3" fill={p.color} opacity="0.85" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
