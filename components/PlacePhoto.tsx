"use client";

import { placePhotoProxyUrl } from "@/lib/places";
import { PlaceCandidate } from "@/types";
import Image from "next/image";
import { useState } from "react";

type Props = {
  place: PlaceCandidate;
  className?: string;
  imageClassName?: string;
  emojiClassName?: string;
  sizes?: string;
};

export default function PlacePhoto({
  place,
  className = "relative h-20 w-full bg-navy/70",
  imageClassName = "object-cover",
  emojiClassName = "text-5xl",
  sizes = "220px"
}: Props) {
  const photoUrl = placePhotoProxyUrl(place.photoName);
  const [photoFailed, setPhotoFailed] = useState(false);

  if (photoUrl && !photoFailed) {
    return (
      <div className={className}>
        <Image
          src={photoUrl}
          alt={place.name}
          fill
          className={imageClassName}
          sizes={sizes}
          unoptimized
          onError={() => setPhotoFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className={emojiClassName}>{place.emoji ?? "🍽️"}</span>
    </div>
  );
}
