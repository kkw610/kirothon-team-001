export type ClassValue = string | false | null | undefined | 0;

/** 클래스 이름을 공백으로 이어 붙인다. falsy 값은 무시한다. */
export function cx(...values: ClassValue[]): string {
  return values.filter((v): v is string => Boolean(v)).join(" ");
}
