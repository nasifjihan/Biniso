"use client";

import { useMemo, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { createOrder } from "../../actions/createOrder";
import { validateCoupon } from "@/app/actions/validateCoupon";
import { parseCheckoutForm } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

export default function CheckoutPage() {
  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("inside_dhaka");
  const [fieldErrors, setFieldErrors] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [applying, setApplying] = useState(false);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === "outside_dhaka") return 120;
    if (deliveryMethod === "pickup") return 0;
    return 60;
  }, [deliveryMethod]);

  async function applyCoupon() {
    setApplying(true);
    const res = await validateCoupon(couponCode, subtotal);
    setApplying(false);

    if (!res?.ok) {
      setCoupon(null);
      toast.error(res?.error || "That promo code could not be applied");
      return;
    }

    setCoupon(res.coupon);
    setCouponCode(res.coupon.code);
    toast.success(`${res.coupon.code} applied — ${res.coupon.description}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cart.length === 0) return;
    const formData = new FormData(e.target);
    formData.set("delivery_method", deliveryMethod);

    const parsed = parseCheckoutForm(formData);
    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      toast.error(parsed.error);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    const res = await createOrder(formData, cart);

    if (!res?.ok) {
      setFieldErrors(res?.fieldErrors || {});
      // A code the server rejected is dropped, so the next attempt starts clean.
      if (res?.fieldErrors?.coupon_code) setCoupon(null);
      toast.error(res?.error || "Failed to place order");
      setSubmitting(false);
      return;
    }

    const orderId = res.orderId;
    if (!orderId) {
      toast.error("Failed to place order");
      setSubmitting(false);
      return;
    }

    if (res.emailWarning) {
      toast.message("Order placed, but email failed");
    }

    const nextParams = new URLSearchParams();
    nextParams.set("order", String(orderId));
    if (res.total != null) nextParams.set("total", String(res.total));
    if (res.subtotal != null) nextParams.set("subtotal", String(res.subtotal));
    if (res.delivery_fee != null) nextParams.set("delivery_fee", String(res.delivery_fee));
    if (res.delivery_method) nextParams.set("delivery_method", String(res.delivery_method));
    if (res.discount) nextParams.set("discount", String(res.discount));
    if (res.coupon_code) nextParams.set("coupon_code", String(res.coupon_code));

    clearCart();
    router.push(`/order-success?${nextParams.toString()}`);
  }

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart],
  );
  const discount = coupon?.discount ?? 0;
  const total = subtotal - discount + deliveryFee;

  return (
    <div className="container mx-auto py-16 space-y-8">
      <h1 className="text-3xl font-bold">Checkout</h1>

      {cart.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-muted-foreground">Your cart is empty.</div>
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {cart.length > 0 && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Customer Info</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                {/* The code is re-priced on the server; the client value is only a hint. */}
                <input
                  type="hidden"
                  name="coupon_code"
                  value={coupon?.code || ""}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" name="name" required placeholder="Your name" />
                    {fieldErrors.name && (
                      <p className="text-sm text-destructive">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      required
                      placeholder="01XXXXXXXXX"
                    />
                    {fieldErrors.phone && (
                      <p className="text-sm text-destructive">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input id="email" name="email" type="email" placeholder="you@email.com" />
                    {fieldErrors.email && (
                      <p className="text-sm text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City (optional)</Label>
                    <Input id="city" name="city" placeholder="e.g. Dhaka" />
                    {fieldErrors.city && (
                      <p className="text-sm text-destructive">{fieldErrors.city}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    required
                    placeholder="House, road, area"
                    className="min-h-24"
                  />
                  {fieldErrors.address && (
                    <p className="text-sm text-destructive">{fieldErrors.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Delivery</Label>
                  <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inside_dhaka">Inside Dhaka (৳ 60)</SelectItem>
                      <SelectItem value="outside_dhaka">Outside Dhaka (৳ 120)</SelectItem>
                      <SelectItem value="pickup">Store pickup (৳ 0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" name="notes" placeholder="Any instruction" />
                  {fieldErrors.notes && (
                    <p className="text-sm text-destructive">{fieldErrors.notes}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Placing order..." : "Place Order (Cash on Delivery)"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl h-fit">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳ {subtotal}</span>
              </div>

              {coupon ? (
                <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{coupon.code}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {coupon.description}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCoupon(null);
                      setCouponCode("");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    aria-label="Promo code"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyCoupon}
                    disabled={applying || !couponCode.trim()}
                  >
                    {applying ? "Checking..." : "Apply"}
                  </Button>
                </div>
              )}
              {fieldErrors.coupon_code && !coupon && (
                <p className="text-sm text-destructive">{fieldErrors.coupon_code}</p>
              )}

              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount{coupon ? ` (${coupon.code})` : ""}
                  </span>
                  <span className="text-emerald-600">- ৳ {discount}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>৳ {deliveryFee}</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>৳ {total}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
