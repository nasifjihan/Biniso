import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PromoCard({ title, subtitle, image }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 grid grid-cols-[1fr_auto] items-center gap-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground uppercase">New Arrivals</div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{subtitle}</p>
          <Button size="sm" variant="outline">Explore Now</Button>
        </div>
        <img src={image} alt={title} className="h-24 w-24 object-contain" />
      </CardContent>
    </Card>
  );
}
