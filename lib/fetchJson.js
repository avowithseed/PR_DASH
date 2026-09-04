// fetch 후 응답 바디를 안전하게 JSON으로 파싱합니다.
// 서버가 빈 바디(204, 크래시로 인한 빈 응답 등)나 JSON이 아닌 내용을 내려줘도
// `res.json()`이 "Unexpected end of JSON input"으로 죽지 않고,
// 대신 사람이 읽을 수 있는 에러 메시지를 던집니다.
export async function fetchJson(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error(`네트워크 요청에 실패했습니다: ${err.message}`);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = data?.error || `요청이 실패했습니다 (HTTP ${res.status}).`;
    throw new Error(message);
  }

  return data ?? {};
}
