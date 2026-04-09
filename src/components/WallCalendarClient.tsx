"use client";

import dynamic from "next/dynamic";

const WallCalendar = dynamic(() => import("@/components/WallCalendar"), {
  ssr: false,
});

export default function WallCalendarClient() {
  return <WallCalendar />;
}
