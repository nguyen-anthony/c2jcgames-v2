"use client";

import dynamic from "next/dynamic";

const NameTag = dynamic(() => import("@/components/NameTag/NameTag"), {
  ssr: false,
});

export default function NameTagPage() {
  return <NameTag />;
}
