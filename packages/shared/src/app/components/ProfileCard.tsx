import { getPublicUrlForPath } from "../../lib/storage";

interface ProfileCardProps {
  id: string;
  name: string;
  age: number;
  height?: number | string | null;
  weight?: number | string | null;
  job?: string | null;
  online?: boolean;
  image?: string | null;
  tags?: string[];
  bio?: string | null;
  chatPoints?: number | null;
}

export function ProfileCard({
  name,
  age,
  height,
  weight,
  job,
  online,
  image,
  tags,
}: ProfileCardProps) {
  const avatarUrl = getPublicUrlForPath("chat-profile-images", image);

  const normalizeNumber = (value: number | string | null | undefined) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const heightValue = normalizeNumber(height);
  const weightValue = normalizeNumber(weight);

  const summaryParts = [
    typeof heightValue === "number" ? `${heightValue}cm` : null,
    typeof weightValue === "number" ? `${weightValue}kg` : null,
    job && job.trim() ? job : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-pink-500 transition-all group h-full flex flex-col">
      {/* Image Container - Fixed aspect ratio */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-800" />
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white">
            {name} <span className="text-gray-400 text-sm">{age}세</span>
          </h3>
          {online && (
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              <span>접속중</span>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm space-y-1 flex-1">
          {summaryParts.length > 0 && <p>{summaryParts.join(" • ")}</p>}
          {!!tags?.length && (
            <div className="flex flex-wrap gap-1 mt-2 line-clamp-2">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs text-pink-400 bg-pink-500/20 px-2 py-1 rounded-full border border-pink-500/30 whitespace-nowrap"
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Button */}
        <button className="w-full mt-3 bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors">
          프로필보기
        </button>
      </div>
    </div>
  );
}
