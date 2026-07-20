/**
 * Custom loader for the official Kakao Maps JavaScript SDK (issue #12, Decision
 * Resolved 2026-07-16 #2, `.claude/handoffs/12-pm-breakdown.md`): a `<script>` tag
 * loaded with `autoload=false`, wrapped in a typed promise — no
 * `react-kakao-maps-sdk` (or any other new npm dependency) is installed.
 *
 * Only the narrow subset of the SDK this widget actually uses is typed (a single
 * map, plain markers with a swappable image, no clustering/streaming — issue #12
 * Non-goals). This is not an exhaustive SDK typing.
 */

export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoSize {}
export interface KakaoPoint {}
export interface KakaoMarkerImage {}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
  setPosition(position: KakaoLatLng): void;
  setImage(image: KakaoMarkerImage): void;
}

export interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void;
}

export interface KakaoMap {
  setCenter(position: KakaoLatLng): void;
  panTo(position: KakaoLatLng): void;
  setLevel(level: number): void;
  setBounds(bounds: KakaoLatLngBounds): void;
}

export interface KakaoMapsNamespace {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level?: number },
  ) => KakaoMap;
  Marker: new (options: {
    position: KakaoLatLng;
    map?: KakaoMap;
    image?: KakaoMarkerImage;
  }) => KakaoMarker;
  MarkerImage: new (
    src: string,
    size: KakaoSize,
    options?: { offset?: KakaoPoint },
  ) => KakaoMarkerImage;
  Size: new (width: number, height: number) => KakaoSize;
  Point: new (x: number, y: number) => KakaoPoint;
}

export interface KakaoGlobal {
  maps: KakaoMapsNamespace;
}

declare global {
  interface Window {
    kakao?: KakaoGlobal;
  }
}

const SDK_SCRIPT_ID = "dashboard-kakao-maps-sdk";
const SDK_LOAD_TIMEOUT_MS = 10_000;

/**
 * Module-level cache so concurrent/repeated mounts of `VehicleMap` (e.g. React
 * Strict Mode double-invoke, or multiple widgets on the same page in the
 * future) reuse a single in-flight/settled load instead of injecting duplicate
 * `<script>` tags.
 */
let sdkPromise: Promise<KakaoMapsNamespace> | null = null;

function isMapsNamespaceReady(
  kakao: KakaoGlobal | undefined,
): kakao is KakaoGlobal {
  return typeof kakao?.maps?.load === "function";
}

/**
 * Resolves once `window.kakao.maps` is loaded and initialized, or rejects on
 * script error / `SDK_LOAD_TIMEOUT_MS` timeout. Safe to call multiple times —
 * a failed load resets the cache so a later call (e.g. the user navigating back
 * to `/dashboard`) can retry instead of being stuck with a permanently rejected
 * promise.
 */
export function loadKakaoMaps(appKey: string): Promise<KakaoMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Kakao Maps SDK can only load in a browser environment."),
    );
  }

  if (isMapsNamespaceReady(window.kakao)) {
    return Promise.resolve(window.kakao.maps);
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<KakaoMapsNamespace>((resolve, reject) => {
    const resolveWhenLoaded = () => {
      window.kakao!.maps.load(() => resolve(window.kakao!.maps));
    };

    const existingScript = document.getElementById(
      SDK_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      // A script tag from an earlier mount is already present — wait for it
      // instead of injecting a duplicate `<script>` (dedupe).
      if (isMapsNamespaceReady(window.kakao)) {
        resolveWhenLoaded();
      } else {
        existingScript.addEventListener("load", resolveWhenLoaded, {
          once: true,
        });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Kakao Maps SDK script failed to load.")),
          { once: true },
        );
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      reject(new Error("Kakao Maps SDK load timed out."));
    }, SDK_LOAD_TIMEOUT_MS);

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;

    script.addEventListener("load", () => {
      window.clearTimeout(timeoutId);
      if (!isMapsNamespaceReady(window.kakao)) {
        reject(
          new Error(
            "Kakao Maps SDK script loaded but window.kakao.maps is unavailable.",
          ),
        );
        return;
      }
      resolveWhenLoaded();
    });
    script.addEventListener("error", () => {
      window.clearTimeout(timeoutId);
      reject(new Error("Kakao Maps SDK script failed to load."));
    });

    document.head.appendChild(script);
  }).catch((error: unknown) => {
    sdkPromise = null; // Allow a future retry instead of caching a permanent rejection.
    throw error;
  });

  return sdkPromise;
}
