import React from "react"
export default function CautionLevelBadge({ stock, level }) {
  if (level === 0)
    return <span className="text-gray-400 text-xs">No threshold</span>;
  if (stock <= 0)
    return (
      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
        Out of stock
      </span>
    );
  if (stock < level)
    return (
      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
        Low stock
      </span>
    );
  return (
    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
      OK
    </span>
  );
}
