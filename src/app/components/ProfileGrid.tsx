import { ProfileCard } from "./ProfileCard";
import { ProfileDetailModal } from "./ProfileDetailModal";
import { useState } from "react";
import { useProfiles } from "../contexts/ProfileContext";

export function ProfileGrid() {
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const { profiles } = useProfiles();

  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.online === b.online) return 0;
    return a.online ? -1 : 1;
  });

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-pink-500/20 border border-pink-500 rounded-full text-pink-300 text-sm mb-4">
            ✨ 달콤한 만남
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 whitespace-nowrap">
            <span className="text-pink-500">설레는 채팅</span>
            <span className="text-white">으로 시작해요 💕</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            마음에 드는 분을 찾으셨나요? 💝
            <br />
            지금 바로 대화를 시작하고 특별한 인연을 만들어보세요!
          </p>
        </div>

        {/* Grid - Responsive: 2 columns on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {sortedProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => setSelectedProfile(profile)}
              className="cursor-pointer"
            >
              <ProfileCard {...profile} />
            </div>
          ))}
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <ProfileDetailModal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          profile={selectedProfile}
        />
      )}
    </section>
  );
}
