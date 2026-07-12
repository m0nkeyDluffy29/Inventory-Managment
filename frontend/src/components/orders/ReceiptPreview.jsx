import React from "react"
import { format } from "date-fns";

export default function ReceiptPreview({ order }) {
  if (!order) return null;
  return (
    <div className="border rounded-lg p-4 bg-white text-sm space-y-3">
      <div className="text-center font-bold text-gray-800 text-base">
        🧾 Receipt
      </div>
      <div className="flex justify-between text-gray-500 text-xs">
        <span>Order #{order.id}</span>
        <span>{format(new Date(order.created_at), "dd MMM yyyy HH:mm")}</span>
      </div>
      {order.table_or_customer_ref && (
        <div className="text-gray-600">
          Table: {order.table_or_customer_ref}
        </div>
      )}
      <div className="border-t pt-3 space-y-1">
        {order.lineItems?.map((li) => (
          <div key={li.id} className="flex justify-between">
            <span>
              {li.dish?.name} × {li.quantity}
            </span>
            <span className="font-mono">
              ₹{(li.dish?.price * li.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span>₹{order.total_amount?.toFixed(2)}</span>
      </div>
    </div>
  );
}
