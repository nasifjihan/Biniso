"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("order");

  return (
    <div className="container mx-auto py-20 text-center space-y-6">
      <h1 className="text-4xl font-bold text-green-600">Order Successful 🎉</h1>
      <p>Your order ID: {orderId}</p>
      <p>We will contact you soon.</p>

      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
