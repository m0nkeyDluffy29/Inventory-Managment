import { format, isPast } from "date-fns";

export default function StockBatchList({ batches }) {
  if (!batches?.length)
    return <p className="text-gray-500 text-sm">No batches.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-3 py-2 text-left">Vendor</th>
            <th className="px-3 py-2 text-right">Received</th>
            <th className="px-3 py-2 text-right">Remaining</th>
            <th className="px-3 py-2 text-left">Expiry</th>
            <th className="px-3 py-2 text-right">Unit Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {batches.map((b) => {
            const expired = b.expiry_date && isPast(new Date(b.expiry_date));
            return (
              <tr
                key={b.id}
                className={expired ? "bg-red-50" : "hover:bg-gray-50"}
              >
                <td className="px-3 py-2">{b.vendor?.name || "—"}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {b.quantity_received}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {b.quantity_remaining}
                </td>
                <td className="px-3 py-2">
                  {b.expiry_date ? (
                    <span
                      className={expired ? "text-red-600 font-semibold" : ""}
                    >
                      {format(new Date(b.expiry_date), "dd MMM yyyy")}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {b.unit_price ? `₹${b.unit_price}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
