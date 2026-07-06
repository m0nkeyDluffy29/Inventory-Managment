import { useState } from "react";
import NewOrderForm from "../components/orders/NewOrderForm";
import ReceiptPreview from "../components/orders/ReceiptPreview";

export default function NewOrder() {
  const [completedOrder, setCompletedOrder] = useState(null);
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">New Order</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <NewOrderForm onSuccess={setCompletedOrder} />
      </div>
      {completedOrder && <ReceiptPreview order={completedOrder} />}
    </div>
  );
}
