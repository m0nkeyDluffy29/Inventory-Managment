import { useRef, useState } from "react";
import { scanBill } from "../../api/vendorBillsApi";

export default function BillUploader({ onExtracted, vendorId, disabled }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file || disabled) return;
    setError("");
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("image", file);
    formData.append("vendor_id", vendorId); // ← required by backend

    try {
      setLoading(true);
      const result = await scanBill(formData);
      // result = { bill, matchSummary }
      onExtracted(result.bill.lineItems, result.bill);
    } catch (err) {
      setError(err.response?.data?.error || "OCR failed. Try a clearer image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!disabled) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`space-y-3 ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !disabled && inputRef.current?.click()}
        className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center cursor-pointer hover:bg-indigo-50 transition-colors"
      >
        {preview ? (
          <img
            src={preview}
            alt="bill preview"
            className="max-h-40 mx-auto rounded object-contain"
          />
        ) : (
          <>
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-sm font-medium text-gray-700">
              Drop bill image here or click to upload
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or PDF</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Running OCR on bill…
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
