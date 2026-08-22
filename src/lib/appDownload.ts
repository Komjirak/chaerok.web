/**
 * 앱 다운로드 CTA의 단일 출처 — 기기 판별·스토어 열기·계측을 한곳에 모은다.
 *
 * 페이지의 모든 "앱 받기" 버튼(헤더·히어로·스티키·요금제·모든 입구·마무리)이
 * 이 헬퍼를 지나므로, 전환 계측 이름과 스토어 링크가 화면마다 어긋날 수 없다.
 *
 * 계측 규칙: `dl_<자리>` + 기기 접미사(`_ios`/`_and`)를 여기서 붙인다.
 * 전환율 = Σ dl_* ÷ pv_home — 자리 이름이 갈려 있어 어느 문이 일하는지 보인다.
 */
import { useEffect, useState } from 'react';
import { APP_STORE_URL, PLAY_TESTING_URL } from './storeLinks';
import { trackEvent } from './track';

export type Device = 'ios' | 'android' | 'desktop';

/**
 * 방문 기기 판별. iPad는 데스크톱 UA를 흉내내는 경우가 있어 maxTouchPoints를
 * 함께 본다. 판별 실패는 전부 desktop으로 — QR 카드가 받쳐준다.
 */
export function detectDevice(): Device {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

/** SSR·하이드레이션 불일치를 피하려고 마운트 후에 판별한다 */
export function useDevice(): Device {
  const [device, setDevice] = useState<Device>('desktop');
  useEffect(() => setDevice(detectDevice()), []);
  return device;
}

/** 데스크톱은 iOS 스토어로 — QR도 같은 곳을 가리킨다(App Store가 정식 출시 표면) */
export function storeUrl(device: Device): string {
  return device === 'android' ? PLAY_TESTING_URL : APP_STORE_URL;
}

/** 스토어로 보내기 전에 센다 — eventBase는 `dl_hero`처럼 자리 이름까지만 */
export function openAppStore(eventBase: string, device: Device): void {
  trackEvent(`${eventBase}${device === 'android' ? '_and' : '_ios'}`);
  window.open(storeUrl(device), '_blank', 'noopener');
}
