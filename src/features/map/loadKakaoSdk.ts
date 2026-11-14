const SDK_URL = "https://dapi.kakao.com/v2/maps/sdk.js";
const TIMEOUT_MS = 10_000;

let loading: Promise<void> | null = null;

/**
 * 카카오 지도 SDK를 한 번만 불러온다. autoload=false로 받고 kakao.maps.load 콜백이 끝나면 resolve한다.
 * 스크립트 오류나 시간 초과(등록하지 않은 도메인에서 흔함)면 reject하고, 다음 호출에서 다시 시도한다.
 */
export function loadKakaoSdk(appKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("브라우저에서만 불러올 수 있습니다."));
  if (window.kakao?.maps?.LatLng) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const fail = (message: string) => {
      loading = null;
      script.remove();
      reject(new Error(message));
    };
    const timer = setTimeout(() => fail("카카오 지도 SDK 로드 시간이 초과되었습니다."), TIMEOUT_MS);
    script.src = `${SDK_URL}?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        clearTimeout(timer);
        fail("카카오 지도 SDK를 초기화하지 못했습니다.");
        return;
      }
      window.kakao.maps.load(() => {
        clearTimeout(timer);
        resolve();
      });
    };
    script.onerror = () => {
      clearTimeout(timer);
      fail("카카오 지도 SDK를 불러오지 못했습니다.");
    };
    document.head.appendChild(script);
  });
  return loading;
}
