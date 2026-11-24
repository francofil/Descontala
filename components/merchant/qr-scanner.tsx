"use client";

import { Scanner } from "@yudiel/react-qr-scanner";

export default function QrScanner({ onCode, onError }: { onCode: (code: string) => void; onError: (msg: string) => void }) {
  return (
    <Scanner
      formats={["qr_code"]}
      constraints={{ facingMode: "environment" }}
      sound={false}
      onScan={(codes) => {
        const raw = codes[0]?.rawValue;
        if (raw) onCode(raw);
      }}
      onError={() => onError("No se pudo abrir la cámara. Revisa el permiso o escribe el código.")}
      components={{ finder: true }}
      styles={{ container: { borderRadius: 20, overflow: "hidden" } }}
    />
  );
}
