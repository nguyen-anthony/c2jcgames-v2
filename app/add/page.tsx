"use client";

import dynamic from "next/dynamic";

const AddGame = dynamic(() => import("@/components/AddGame/AddGame"), {
  ssr: false,
});

export default function AddGamePage() {
  return <AddGame />;
}
