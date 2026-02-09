import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground text-lg">
        Oops! The page you're looking for doesn't exist.
      </p>

      <Link href="/">
        <Button size="lg">Go Back Home</Button>
      </Link>
    </div>
  );
}
