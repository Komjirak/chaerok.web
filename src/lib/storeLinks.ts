/**
 * 스토어 링크의 단일 출처 — 히어로와 푸터가 함께 쓴다.
 *
 * 한 곳에 두는 이유: Google Play가 비공개 테스트 → 정식 링크로 바뀔 때
 * (프로덕션 승인 후) 화면마다 흩어져 있으면 하나가 낡은 채 남는다.
 */
export const APP_STORE_URL = 'https://apps.apple.com/kr/app/id6794663892';

/** 비공개 테스트 옵트인 — 프로덕션 승인 후 정식 스토어 링크로 교체한다 */
export const PLAY_TESTING_URL = 'https://play.google.com/apps/testing/com.chaerok.komjirak';

/** 웹스토어 승인 완료(2026-08-05) — 소개 절로 스크롤하지 않고 바로 설치로 보낸다 */
export const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/pnndjhdcffpjmekjiknakoakablpocli';
