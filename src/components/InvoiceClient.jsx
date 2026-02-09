"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";

export default function InvoiceClient({ order }) {
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <div className="p-10 space-y-6">
      <Button onClick={handlePrint}>Print Invoice</Button>

      <div
        ref={printRef}
        className="bg-white p-10 text-black max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">INVOICE</h1>
            <p>Order ID: {order.id}</p>
            <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
          </div>

          <div className="text-right">
            <h2 className="font-bold">Your Store Name</h2>
            <p>Dhaka, Bangladesh</p>
            <p>Phone: 01XXXXXXXXX</p>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <h3 className="font-semibold">Bill To:</h3>
          <p>{order.customer_name}</p>
          <p>{order.phone}</p>
          <p>{order.address}</p>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Product</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">{item.products.name}</td>
                <td className="border p-2 text-center">{item.quantity}</td>
                <td className="border p-2 text-center">৳ {item.price}</td>
                <td className="border p-2 text-center">
                  ৳ {item.price * item.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="text-right text-xl font-bold">
          Grand Total: ৳ {order.total}
        </div>

        <p className="mt-10 text-sm text-center">
          Thank you for your purchase ❤️
        </p>
      </div>
    </div>
  );
}
