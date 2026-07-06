export default function ExpiryTracker() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Expiry Tracker</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="text-amber-800 font-medium">📦 Use-First Dashboard</p>
        <p className="text-amber-700 text-sm mt-1">
          Full expiry panel is activated in Phase 3. Stock batches with expiry
          dates are already stored and FIFO deduction is active.
        </p>
      </div>
    </div>
  );
}
