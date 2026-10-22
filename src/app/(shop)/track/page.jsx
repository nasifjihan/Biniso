import TrackOrderForm from "@/components/TrackOrderForm";

export const metadata = { title: "Track your order" };

export default async function TrackPage({ searchParams }) {
  const params = await searchParams;

  return (
    <div className="container mx-auto py-16 max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Track your order</h1>
        <p className="text-muted-foreground">
          Enter the order ID from your confirmation and the phone number you used
          at checkout.
        </p>
      </div>

      <TrackOrderForm
        defaultOrderId={typeof params.id === "string" ? params.id : ""}
      />
    </div>
  );
}
