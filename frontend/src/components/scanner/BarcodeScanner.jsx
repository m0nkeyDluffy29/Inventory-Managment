import React from "react"
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

/**
 * BarcodeScanner
 * Props:
 *   onResult(text: string) — called when a barcode is successfully decoded
 *   onClose() — called when the user dismisses the scanner
 */
export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let stopped = false;

    async function startScan() {
      try {
        setScanning(true);
        setError("");

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices.length) throw new Error("No camera found on this device.");

        // Prefer rear camera on mobile
        const device =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ||
          devices[0];

        await reader.decodeFromVideoDevice(
          device.deviceId,
          videoRef.current,
          (result, err) => {
            if (stopped) return;
            if (result) {
              stopped = true;
              reader.reset();
              onResult(result.getText());
            }
            // if (err && !(err instanceof NotFoundException)) {
            //   console.warn("Scan error:", err);
            // }
          },
        );
      } catch (err) {
        setError(err.message || "Camera error");
        setScanning(false);
      }
    }

    startScan();

    return () => {
      stopped = true;
      try {
        reader.reset();
      } catch (_) {}
    };
  }, [onResult]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        {/* Scan-line overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-1 bg-red-500 opacity-70 animate-pulse" />
        </div>
        {scanning && (
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            📷 Scanning…
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  );
}
