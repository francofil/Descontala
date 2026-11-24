"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { PromoCardData } from "@/lib/services/promotions";

type StoreGroup = { store: PromoCardData["store"]; color: string; chain: string; promos: PromoCardData[] };

function storeIcon(group: StoreGroup) {
  const top = group.promos[0].discount.big;
  const more = group.promos.length > 1 ? `<span class="dl-pin-more">+${group.promos.length - 1}</span>` : "";
  return L.divIcon({
    className: "dl-pin",
    html: `<span class="dl-pin-tag"><i style="background:${group.color}"></i>${top}${more}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

const userIcon = L.divIcon({ className: "dl-user", html: "<span></span>", iconSize: [18, 18], iconAnchor: [9, 9] });

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    // Espera a que termine la transición de entrada para medir bien el contenedor.
    const t = setTimeout(() => {
      map.invalidateSize();
      if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 15 });
    }, 220);
    return () => clearTimeout(t);
  }, [map, points]);
  return null;
}

export default function PromoMap({ promos, center }: { promos: PromoCardData[]; center: { lat: number; lng: number } }) {
  const groups = useMemo(() => {
    const map = new Map<string, StoreGroup>();
    for (const p of promos) {
      const g = map.get(p.store.id) ?? { store: p.store, color: p.chain.color, chain: p.chain.name, promos: [] };
      g.promos.push(p);
      map.set(p.store.id, g);
    }
    return [...map.values()];
  }, [promos]);
  const points = useMemo<[number, number][]>(
    () => [[center.lat, center.lng], ...groups.map((g) => [g.store.lat, g.store.lng] as [number, number])],
    [groups, center],
  );

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} zoomControl={false} className="h-full w-full" attributionControl>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        className="dl-tiles"
        maxZoom={19}
      />
      <FitBounds points={points} />
      <Marker position={[center.lat, center.lng]} icon={userIcon} />
      {groups.map((g) => (
        <Marker key={g.store.id} position={[g.store.lat, g.store.lng]} icon={storeIcon(g)}>
          <Popup closeButton={false} className="dl-popup">
            <p className="dl-popup-store">{g.store.name}</p>
            <ul>
              {g.promos.map((p) => (
                <li key={p.id}>
                  <Link href={`/promo/${p.id}`}>
                    <b>{p.discount.big}</b> {p.title}
                    <span className={p.ends.urgent ? "dl-urgent" : ""}>{p.ends.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
