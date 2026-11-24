import { ImageResponse } from "next/og";

/** Icono de la app: la etiqueta de oferta (albero, con punta) sobre tinta. */
export function brandIcon(size: number, { maskable = false } = {}) {
  const pad = maskable ? size * 0.2 : size * 0.12;
  const w = size - pad * 2;
  const h = w * 0.62;
  const tip = h * 0.32;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, background: "#17201b", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: maskable ? 0 : size * 0.22 }}>
        <div style={{ position: "relative", width: w, height: h, display: "flex" }}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", top: 0, left: 0 }}>
            <polygon points={`0,0 ${w - tip},0 ${w},${h / 2} ${w - tip},${h} 0,${h}`} fill="#f2c14e" />
          </svg>
          <div style={{ position: "absolute", top: 0, left: 0, width: w - tip, height: h, display: "flex", alignItems: "center", justifyContent: "center", color: "#3d2c00", fontSize: h * 0.62, fontWeight: 800 }}>
            %
          </div>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
