"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = {
  value: string;
};

export default function QRDisplay({ value }: Props) {
  return (
    <div className="rounded-xl4 bg-white p-4 shadow-pop">
      <QRCodeSVG value={value} size={200} level="M" includeMargin bgColor="#1A1A2E" fgColor="#FF6B35" />
    </div>
  );
}
