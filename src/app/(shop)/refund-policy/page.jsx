import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Refund & Return Policy",
  description: "How returns, exchanges and refunds work at Biniso.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto py-16 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Refund &amp; Return Policy</h1>

      <div className="space-y-4 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Return window
          </h2>
          <p>
            You may request a return within 7 days of receiving your order. The
            item must be unused, undamaged, and in its original packaging with
            all accessories included.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Damaged or incorrect items
          </h2>
          <p>
            If your order arrives damaged or is not what you ordered, contact us
            within 48 hours with your order ID and photos of the item. We will
            arrange a replacement or a full refund, including the delivery
            charge for that order.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Non-returnable items
          </h2>
          <p>
            For hygiene and safety reasons, certain items such as personal care
            products, consumables, and clearance items cannot be returned unless
            they arrived damaged or faulty.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            How to request a return
          </h2>
          <p>
            Contact us using the support details on our storefront with your
            order ID and the reason for the return. Do not ship items back
            before your return has been approved.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Refund timing
          </h2>
          <p>
            Once a returned item is received and inspected, approved refunds are
            issued within 7 working days using the original payment method, or
            via mobile financial services for cash-on-delivery orders.
          </p>
        </section>
      </div>
    </div>
  );
}
