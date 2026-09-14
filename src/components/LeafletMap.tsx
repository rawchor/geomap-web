"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { FriendDegree, NearbyFriendResponse } from "@/lib/types";

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function dotIcon(color: string, size: number) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const FRIEND_COLORS: Record<FriendDegree, string> = {
  FIRST_DEGREE: "#2563eb",
  SECOND_DEGREE: "#9333ea",
};

const meIcon = dotIcon("#16a34a", 16);

export default function LeafletMap({
  center,
  friends,
  onSelectFriend,
}: {
  center: [number, number];
  friends: NearbyFriendResponse[];
  onSelectFriend: (friend: NearbyFriendResponse) => void;
}) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
      <Marker position={center} icon={meIcon} />
      {friends.map((friend) => (
        <Marker
          key={friend.userId}
          position={[friend.latitude, friend.longitude]}
          icon={dotIcon(FRIEND_COLORS[friend.degree], 18)}
          eventHandlers={{ click: () => onSelectFriend(friend) }}
        />
      ))}
    </MapContainer>
  );
}
