import { REGIONS } from "./regions";

// ---------- 시드 기반 난수 (샘플 데이터를 매 렌더마다 흔들리지 않게 고정) ----------
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// 컨텐츠 전파현황 탭은 아직 실데이터 연동 대상이 아니라 요청받아, 샘플 데이터로 유지합니다.
// (연동하려면 위원회별 재게시 로그를 남기는 별도 폼/집계가 필요합니다.)
export const SPREAD_BY_REGION = REGIONS.map((name) => {
  const rand = hashSeed(name + "-spread");
  return { name, rate: Math.round(30 + rand() * 60) };
});

export const SPREAD_CONTENT = [
  { title: "민티07 홍보", speed: "평균 2.1시간", committees: 41 },
  { title: "KTX&SRT 합병", speed: "평균 3.4시간", committees: 33 },
  { title: "이재명정부 민영화 저지 성과 홍보", speed: "평균 5.0시간", committees: 22 },
];
