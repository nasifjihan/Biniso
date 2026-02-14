import { Truck, BadgeCheck, RotateCcw, ShieldCheck } from "lucide-react";

const items = [
  { icon: Truck, title: "Fast Delivery", text: "Start from $10" },
  { icon: BadgeCheck, title: "Money Guarantee", text: "7 Days Back" },
  { icon: RotateCcw, title: "365 Days", text: "Free Return" },
  { icon: ShieldCheck, title: "Payment", text: "Secure system" },
];

export default function FeatureStrip() {
  return (
    <div className="container mx-auto my-8">
      <div className="grid md:grid-cols-4 gap-4 bg-card border rounded-2xl">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-6">
              <Icon className="size-6 text-primary" />
              <div>
                <div className="font-semibold">{it.title}</div>
                <div className="text-muted-foreground text-sm">{it.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
