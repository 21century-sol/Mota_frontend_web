import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `lib/dashboard/map/kakao-loader.ts` caches its load promise and the injected
 * `<script>` tag at module scope, so each test gets a fresh module instance
 * (`vi.resetModules()` + dynamic `import()`) and a clean DOM/`window.kakao`
 * state. No real network request or live Kakao key is used — the SDK script's
 * own `load`/`error` events are simulated by dispatching DOM events on the
 * injected `<script>` element.
 */

const SDK_SCRIPT_ID = "dashboard-kakao-maps-sdk";

function removeInjectedScript() {
  document.getElementById(SDK_SCRIPT_ID)?.remove();
}

function fakeMapsNamespace() {
  return {
    load: vi.fn((callback: () => void) => callback()),
    LatLng: vi.fn(),
    Map: vi.fn(),
    Marker: vi.fn(),
    MarkerImage: vi.fn(),
    Size: vi.fn(),
    Point: vi.fn(),
  };
}

beforeEach(() => {
  vi.resetModules();
  delete (window as unknown as { kakao?: unknown }).kakao;
  removeInjectedScript();
});

afterEach(() => {
  vi.useRealTimers();
  delete (window as unknown as { kakao?: unknown }).kakao;
  removeInjectedScript();
});

describe("loadKakaoMaps", () => {
  it("resolves with window.kakao.maps once the injected script fires 'load' (ready branch, AC5 map wiring)", async () => {
    const { loadKakaoMaps } = await import("@/lib/dashboard/map/kakao-loader");

    const promise = loadKakaoMaps("test-app-key");

    const script = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;
    expect(script).toBeTruthy();
    expect(script?.src).toContain("appkey=test-app-key");
    expect(script?.src).toContain("autoload=false");

    const maps = fakeMapsNamespace();
    (window as unknown as { kakao: unknown }).kakao = { maps };
    script?.dispatchEvent(new Event("load"));

    await expect(promise).resolves.toBe(maps);
    expect(maps.load).toHaveBeenCalledTimes(1);
  });

  it("rejects when the injected script fires 'error' (SDK load failure -> VehicleMap fallback)", async () => {
    const { loadKakaoMaps } = await import("@/lib/dashboard/map/kakao-loader");

    const promise = loadKakaoMaps("test-app-key");
    const script = document.getElementById(SDK_SCRIPT_ID);
    script?.dispatchEvent(new Event("error"));

    await expect(promise).rejects.toThrow(/failed to load/i);
  });

  it("rejects if no load/error event fires before the load timeout", async () => {
    vi.useFakeTimers();
    const { loadKakaoMaps } = await import("@/lib/dashboard/map/kakao-loader");

    const promise = loadKakaoMaps("test-app-key");
    const assertion = expect(promise).rejects.toThrow(/timed out/i);

    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });

  it("dedupes concurrent calls into a single injected <script> tag", async () => {
    const { loadKakaoMaps } = await import("@/lib/dashboard/map/kakao-loader");

    const firstPromise = loadKakaoMaps("test-app-key");
    const secondPromise = loadKakaoMaps("test-app-key");

    expect(document.querySelectorAll(`script#${SDK_SCRIPT_ID}`)).toHaveLength(1);

    const maps = fakeMapsNamespace();
    (window as unknown as { kakao: unknown }).kakao = { maps };
    document.getElementById(SDK_SCRIPT_ID)?.dispatchEvent(new Event("load"));

    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    expect(first).toBe(maps);
    expect(second).toBe(maps);
  });

  it("resolves immediately without injecting a script when window.kakao.maps is already ready", async () => {
    const { loadKakaoMaps } = await import("@/lib/dashboard/map/kakao-loader");

    const maps = fakeMapsNamespace();
    (window as unknown as { kakao: unknown }).kakao = { maps };

    await expect(loadKakaoMaps("test-app-key")).resolves.toBe(maps);
    expect(document.getElementById(SDK_SCRIPT_ID)).toBeNull();
  });
});
