"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "Game Controller",
    subtitle: "Lorem ipsum dolor sit amet, consectetur elit, sed do eiusmod tempor incididunt ut dolore magna aliqua.",
    cta: "Explore Now",
    image:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=wireless%20video%20game%20controller%20product%20shot%20on%20clean%20light%20studio%20background&image_size=landscape_4_3",
  },
  {
    title: "Smart Watch",
    subtitle: "Track health metrics and stay connected with a sleek design.",
    cta: "Explore Now",
    image:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20smart%20watch%20product%20photo%20on%20clean%20studio%20background&image_size=landscape_4_3",
  },
  {
    title: "VR Headset",
    subtitle: "Immersive experiences with crystal clear visuals.",
    cta: "Explore Now",
    image:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=futuristic%20vr%20headset%20product%20photo%20on%20clean%20studio%20background&image_size=landscape_4_3",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(id);
  }, []);
  const s = slides[index];
  return (
    <div className="bg-card rounded-2xl border p-8 grid md:grid-cols-2 items-center gap-6">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground uppercase">Game</div>
        <h2 className="text-4xl font-bold">{s.title}</h2>
        <p className="text-muted-foreground">{s.subtitle}</p>
        <Button className="mt-4" size="lg">{s.cta}</Button>
        <div className="flex items-center gap-2 mt-6">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full ${i === index ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-center">
        <img src={s.image} alt={s.title} className="max-h-64" />
      </div>
    </div>
  );
}
