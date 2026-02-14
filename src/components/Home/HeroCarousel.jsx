"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "Game Controller",
    subtitle: "Lorem ipsum dolor sit amet, consectetur elit, sed do eiusmod tempor incididunt ut dolore magna aliqua.",
    cta: "Explore Now",
    image: "/window.svg",
  },
  {
    title: "Smart Watch",
    subtitle: "Track health metrics and stay connected with a sleek design.",
    cta: "Explore Now",
    image: "/next.svg",
  },
  {
    title: "VR Headset",
    subtitle: "Immersive experiences with crystal clear visuals.",
    cta: "Explore Now",
    image: "/globe.svg",
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
