// Barcode scanning via expo-camera, lazy-required (like services/location.ts) so the absent
// native module degrades to a no-op. We deliberately do NOT ship a packaged-food macro
// database, so a scanned code that we can't resolve is reported honestly — never with
// invented macros.

let Camera: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Camera = require('expo-camera');
} catch {
  Camera = null;
}

/** True if the camera/barcode module is actually present on this build. */
export function barcodeAvailable(): boolean {
  return !!Camera?.CameraView;
}

/** The CameraView component (or null) — callers render it only when available. */
export function getCameraView(): any {
  return Camera?.CameraView ?? null;
}

export async function ensureCameraPermission(): Promise<boolean> {
  if (!Camera?.requestCameraPermissionsAsync) return false;
  try {
    const res = await Camera.requestCameraPermissionsAsync();
    return !!(res?.granted || res?.status === 'granted');
  } catch {
    return false;
  }
}
