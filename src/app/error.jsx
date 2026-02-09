"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
      <h1 className="text-4xl font-bold text-red-500">
        Something went wrong ⚠️
      </h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>

      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
}
