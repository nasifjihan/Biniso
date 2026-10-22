import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Biniso collects, uses and protects your personal information.",
  path: "/privacy",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-16 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>

      <div className="space-y-4 text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Information we collect
          </h2>
          <p>
            When you place an order we collect the details needed to fulfil it:
            your name, phone number, delivery address, and optionally your email
            address and order notes. We do not collect or store card or mobile
            banking credentials on this site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            How we use it
          </h2>
          <p>
            Your information is used to process and deliver your order, contact
            you about its status, and handle any return or support request.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Sharing
          </h2>
          <p>
            We share delivery details with our courier partners only to the
            extent needed to complete your delivery. We do not sell your
            personal data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Retention and your rights
          </h2>
          <p>
            Order records are kept for accounting and warranty purposes. You may
            request access to, correction of, or deletion of your personal data
            by contacting us using the details below.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p>
            Questions about this policy? Reach us at{" "}
            {process.env.NEXT_PUBLIC_STORE_PHONE || "our support number"} or
            through the contact details on our storefront.
          </p>
        </section>
      </div>
    </div>
  );
}
