import { supabase } from "./supabase";

function isUrlLike(value: string) {
  return /^(https?:\/\/|data:|blob:)/i.test(value);
}

export function getPublicUrlForPath(
  bucket: string,
  pathOrUrl: string | null | undefined
) {
  if (!pathOrUrl) return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;
  if (isUrlLike(trimmed)) return trimmed;

  const { data } = supabase.storage.from(bucket).getPublicUrl(trimmed);
  return data?.publicUrl ?? null;
}
