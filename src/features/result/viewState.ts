import type { Option } from "@/shared/types";

export type ViewState = "loading" | "error" | "empty" | "recommended" | "late";

/** 우선순위: loading > error > (options 없음 ? empty : best 있음 ? recommended : late) */
export function resolveViewState(input: {
  loading: boolean;
  hasError: boolean;
  best: Option | null;
  options: Option[];
}): ViewState {
  if (input.loading) return "loading";
  if (input.hasError) return "error";
  if (input.options.length === 0) return "empty";
  return input.best ? "recommended" : "late";
}
