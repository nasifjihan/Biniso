export const metadata = {
  title: "Terms & Conditions | Biniso",
  description: "The terms that apply when you shop with Biniso.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto py-16 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Terms &amp; Conditions</h1>

      <div className="space-y-4 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Orders and acceptance
          </h2>
          <p>
            Placing an order is an offer to buy. An order is confirmed once we
            contact you to verify it. We may cancel an order if an item is out
            of stock, if pricing was listed incorrectly, or if we cannot reach
            you to confirm delivery.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Pricing and payment
          </h2>
          <p>
            All prices are shown in Bangladeshi Taka (৳) and include applicable
            charges unless stated otherwise. Delivery charges are added at
            checkout. Cash on delivery is available; payment is due when the
            order is handed over.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Delivery</h2>
          <p>
            Delivery timelines are estimates and may vary by location and
            courier. Please provide an accurate address and a reachable phone
            number; repeated failed delivery attempts may result in
            cancellation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Product descriptions
          </h2>
          <p>
            We aim to describe and photograph products accurately. Minor
            variation in colour or packaging may occur between batches.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Liability
          </h2>
          <p>
            Our liability for any order is limited to the amount you paid for
            that order. Nothing in these terms limits rights you have under
            applicable consumer protection law.
          </p>
        </section>
      </div>
    </div>
  );
}
