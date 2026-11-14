/** 카카오 지도 JavaScript SDK 중 이 프로젝트가 쓰는 부분만 선언한다. 좌표는 LatLng(위도, 경도) 순서다. */
declare namespace kakao.maps {
  function load(callback: () => void): void;

  class LatLng {
    constructor(latitude: number, longitude: number);
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
  }

  class Map {
    constructor(container: HTMLElement, options: { center: LatLng; level?: number });
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
    relayout(): void;
  }

  interface Removable {
    setMap(map: Map | null): void;
  }

  class Polyline implements Removable {
    constructor(options: {
      map?: Map;
      path: LatLng[];
      strokeWeight?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      /** solid, shortdash, shortdot, dash, dot, longdash 등 */
      strokeStyle?: string;
      zIndex?: number;
    });
    setMap(map: Map | null): void;
  }

  class CustomOverlay implements Removable {
    constructor(options: {
      map?: Map;
      position: LatLng;
      content: HTMLElement | string;
      xAnchor?: number;
      yAnchor?: number;
      zIndex?: number;
    });
    setMap(map: Map | null): void;
  }
}

interface Window {
  kakao?: { maps?: typeof kakao.maps };
}
