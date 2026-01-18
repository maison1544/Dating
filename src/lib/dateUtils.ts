// 한국 시간(KST) 유틸리티 함수

// UTC를 KST로 변환
export function toKST(date: Date | string | null): Date | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(d.getTime() + 9 * 60 * 60 * 1000);
}

// 현재 한국 시간
export function nowKST(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

// 한국 시간 포맷 (YYYY-MM-DD HH:mm:ss)
export function formatKST(
  date: Date | string | null,
  format: "full" | "date" | "time" | "datetime" = "datetime",
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;

  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: format === "full" ? "2-digit" : undefined,
    hour12: false,
  });

  const parts = fmt.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const yyyy = get("year");
  const mm = get("month");
  const dd = get("day");
  const hh = get("hour");
  const mi = get("minute");
  const ss = get("second");

  if (format === "date") return `${yyyy}-${mm}-${dd}`;
  if (format === "time") return `${hh}:${mi}`;
  if (format === "full") return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

// 상대적 시간 표시 (몇 분 전, 몇 시간 전 등)
export function relativeTimeKST(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return formatKST(d, "date");
}

// ISO 문자열을 KST 기준으로 생성 (DB 저장용)
export function toISOStringKST(): string {
  return new Date().toISOString();
}

// 라운드 번호에서 표시용 번호만 추출 (YYYYMMDD_N -> N)
export function getDisplayRoundNumber(
  roundNumber: string | number | null | undefined,
): number {
  if (roundNumber == null) return 0;
  const str = String(roundNumber);
  if (str.includes("_")) {
    const parts = str.split("_");
    return parseInt(parts[1], 10) || 0;
  }
  return parseInt(str, 10) || 0;
}
