"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import type { FriendDegree, NearbyFriendResponse } from "@/lib/types";

type LayerType = "street" | "satellite";

const TILE_LAYERS: Record<
  LayerType,
  { url: string; attribution: string; maxZoom: number }
> = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  },
};

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function dotIcon(color: string, size: number, opacity = 1) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.45);opacity:${opacity}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const FRIEND_COLORS: Record<FriendDegree, string> = {
  FIRST_DEGREE: "#2563eb",
  SECOND_DEGREE: "#9333ea",
};

function LayerToggle({
  layer,
  onChange,
}: {
  layer: LayerType;
  onChange: (l: LayerType) => void;
}) {
  return (
    <div className="leaflet-top leaflet-left">
      <div className="leaflet-control m-3 overflow-hidden rounded-lg bg-white text-sm shadow-md ring-1 ring-black/5">
        <button
          onClick={() => onChange("street")}
          className={`block w-full px-3 py-1.5 text-left font-medium transition ${
            layer === "street" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Map
        </button>
        <button
          onClick={() => onChange("satellite")}
          className={`block w-full px-3 py-1.5 text-left font-medium transition ${
            layer === "satellite" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
}

export default function LeafletMap({
  center,
  friends,
  onSelectFriend,
  ownStatusLabel,
  onSelectOwn,
}: {
  center: [number, number];
  friends: NearbyFriendResponse[];
  onSelectFriend: (friend: NearbyFriendResponse) => void;
  ownStatusLabel?: string | null;
  onSelectOwn: () => void;
}) {
  const [layer, setLayer] = useState<LayerType>("street");
  const tiles = TILE_LAYERS[layer];

  return (
    <MapContainer center={center} zoom={13} className="h-full w-full" zoomControl={false}>
      <TileLayer key={layer} attribution={tiles.attribution} url={tiles.url} maxZoom={tiles.maxZoom} />
      <ZoomControl position="bottomright" />
      <Recenter center={center} />
      <LayerToggle layer={layer} onChange={setLayer} />

      <Marker position={center} icon={dotIcon("#16a34a", 16)} eventHandlers={{ click: onSelectOwn }}>
        {ownStatusLabel && (
          <Tooltip permanent direction="top" offset={[0, -12]} className="status-bubble">
            {ownStatusLabel}
          </Tooltip>
        )}
      </Marker>

      {friends.map((friend) =>
        friend.locked ? (
          <Marker
            key={friend.userId}
            position={[friend.latitude, friend.longitude]}
            icon={dotIcon("#9ca3af", 14, 0.55)}
            interactive={false}
          />
        ) : (
          <Marker
            key={friend.userId}
            position={[friend.latitude, friend.longitude]}
            icon={dotIcon(FRIEND_COLORS[friend.degree], 18)}
            eventHandlers={{ click: () => onSelectFriend(friend) }}
          />
        )
      )}
    </MapContainer>
  );
}
