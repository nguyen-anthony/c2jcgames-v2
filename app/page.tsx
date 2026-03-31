"use client";

import dynamic from "next/dynamic";

// Disable SSR for the games list since it relies on localStorage for userId
const GamesList = dynamic(() => import("@/components/GamesList/GamesList"), {
  ssr: false,
});

export default function HomePage() {
  return <GamesList />;
}
