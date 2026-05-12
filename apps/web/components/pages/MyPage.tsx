import {
  User,
  CreditCard,
  LogOut,
  Gift,
  Loader2,
  Coins,
  Camera,
  Bell,
  Volume2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/layout/ConfirmModal";
import { QuantityModal } from "@/components/layout/QuantityModal";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useUserGifts } from "@/hooks/useSupabase";
import { getPublicUrlForPath } from "@/lib/utils/storage";
import {
  useNotification,
  NOTIFICATION_SOUNDS,
} from "@/contexts/NotificationContext";

export function MyPage() {
  const navigate = useRouter();
  const { user, profile, adminAccount, signOut, isLoading, refreshProfile } =
    useAuth();
  const { showAlert } = useAlert();
  const { userGifts, refetch: refetchUserGifts } = useUserGifts(profile?.id);
  const { settings, updateSettings, previewSound } = useNotification();
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
  }, [isLoading, user, navigate]);

  const [activeTab, setActiveTab] = useState<"menu" | "inventory">("menu");
  const [isGiftProcessing, setIsGiftProcessing] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [quantityModal, setQuantityModal] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    itemEmoji: string;
    price: number;
    maxQuantity?: number;
    currentPoints?: number;
    isSelling?: boolean;
    onConfirm: (quantity: number) => void;
  }>({
    isOpen: false,
    title: "",
    itemName: "",
    itemEmoji: "",
    price: 0,
    maxQuantity: 99,
    currentPoints: 0,
    isSelling: false,
    onConfirm: () => {},
  });

  // 내 선물 목록 (gift_items와 조인)
  const giftInventory = userGifts
    .map((ug: any) => {
      const gift = ug.gifts;
      return {
        id: ug.id,
        gift_id: ug.gift_id,
        name: gift?.name,
        quantity: ug.quantity || 0,
        sellPrice: gift?.sell_price,
        emoji: gift?.emoji,
      };
    })
    .filter((g: any) => !!g.name);

  const totalGiftCount = giftInventory.reduce(
    (sum: number, g: any) => sum + g.quantity,
    0,
  );

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showAlert({
        title: "업로드 오류",
        message: "JPG 또는 PNG 파일만 업로드할 수 있습니다.",
        type: "warning",
      });
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      showAlert({
        title: "업로드 오류",
        message: "이미지 파일은 최대 5MB까지 업로드할 수 있습니다.",
        type: "warning",
      });
      return;
    }

    setIsImageUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ profile_image: filePath })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      showAlert({
        title: "업로드 완료",
        message: "프로필 사진이 변경되었습니다.",
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.";
      showAlert({ title: "오류", message, type: "error" });
    } finally {
      setIsImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSellGift = async (
    giftId: string,
    giftName: string,
    unitPrice: number,
    quantity: number,
  ) => {
    if (isGiftProcessing) return;
    if (!profile?.id) {
      showAlert({
        title: "로그인 필요",
        message: "로그인이 필요합니다.",
        type: "warning",
      });
      return;
    }

    setIsGiftProcessing(true);

    try {
      void unitPrice;

      const { error: rpcError } = await supabase.rpc("gift_sell", {
        p_gift_id: giftId,
        p_quantity: quantity,
      });

      if (rpcError) throw rpcError;

      await Promise.all([refreshProfile(), refetchUserGifts()]);
      showAlert({
        title: "판매 완료",
        message: `${giftName} ${quantity}개를 판매했습니다!`,
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "판매에 실패했습니다.";
      showAlert({ title: "오류", message, type: "error" });
      await Promise.all([refreshProfile(), refetchUserGifts()]);
    } finally {
      setIsGiftProcessing(false);
    }
  };

  if (isLoading || (user && !adminAccount && !profile)) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!user || adminAccount || !profile) {
    if (!user) return <>{typeof window !== "undefined" && router.push("/login" replace />;
    return <>{typeof window !== "undefined" && router.push("/" replace />;
  }

  const profileImageUrl = getPublicUrlForPath(
    "profile-images",
    profile.profile_image,
  );

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Section */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div
              className="w-24 h-24 rounded-full bg-pink-500/20 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
            >
              {isImageUploading ? (
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              ) : profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="프로필"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="text-pink-500" size={40} />
              )}
            </div>
            <div
              className="absolute bottom-0 right-0 bg-pink-500 p-2 rounded-full cursor-pointer hover:bg-pink-600 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={14} className="text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <h2 className="text-white text-2xl mb-2">
            {profile?.name || profile?.nickname || "회원님"}
          </h2>
          {profile?.nickname && (
            <p className="text-gray-300 mb-1">{profile.nickname}</p>
          )}
          <p className="text-gray-400 mb-4">
            {profile?.email || user?.email || ""}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">보유 포인트</p>
              <p className="text-white">
                {(profile?.points || 0).toLocaleString()} P
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">보유 선물</p>
              <p className="text-white">{totalGiftCount}개</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("menu")}
            className={`px-6 py-3 transition-colors ${
              activeTab === "menu"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            메뉴
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 transition-colors flex items-center gap-2 ${
              activeTab === "inventory"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Gift size={20} />
            <span>선물 인벤토리</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "menu" ? (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <button
              onClick={() => router.push("/profile-edit")}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <User className="text-gray-400" size={20} />
                <span className="text-white">프로필 수정</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              onClick={() => router.push("/point")}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <Coins className="text-gray-400" size={20} />
                <span className="text-white">포인트 충전</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button
              onClick={() => router.push("/payment-history")}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="text-gray-400" size={20} />
                <span className="text-white">충전/출금 내역</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            {/* 알림 설정 섹션 */}
            <div className="border-b border-gray-800">
              <button
                onClick={() =>
                  setIsNotificationExpanded(!isNotificationExpanded)
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="text-gray-400" size={20} />
                  <span className="text-white">알림 설정</span>
                </div>
                {isNotificationExpanded ? (
                  <ChevronUp className="text-gray-400" size={20} />
                ) : (
                  <ChevronDown className="text-gray-400" size={20} />
                )}
              </button>

              {isNotificationExpanded && (
                <div className="px-6 pb-4 space-y-4">
                  {/* 전체 알림 ON/OFF */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-300 text-sm">전체 알림</span>
                    <button
                      onClick={() =>
                        updateSettings({
                          globalEnabled: !settings.globalEnabled,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.globalEnabled ? "bg-pink-500" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.globalEnabled ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* 알림음 선택 */}
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-gray-300 text-sm block mb-3">
                      알림음 선택
                    </span>
                    <div className="space-y-1">
                      {NOTIFICATION_SOUNDS.map((sound) => (
                        <button
                          key={sound.id}
                          onClick={() => {
                            updateSettings({ selectedSoundId: sound.id });
                            previewSound(sound.id);
                          }}
                          disabled={!settings.globalEnabled}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            settings.selectedSoundId === sound.id
                              ? "bg-pink-500/20 text-pink-400"
                              : "hover:bg-gray-800 text-gray-300"
                          } ${!settings.globalEnabled ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <Volume2 size={14} />
                            <span className="text-sm">{sound.name}</span>
                          </div>
                          {settings.selectedSoundId === sound.id && (
                            <Check size={14} className="text-pink-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="text-gray-400" size={20} />
                <span className="text-white">로그아웃</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        ) : (
          <div>
            {giftInventory.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {giftInventory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-pink-500 transition-all text-center group"
                    >
                      <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
                        {item.emoji}
                      </div>
                      <h3 className="text-white mb-2 text-sm">{item.name}</h3>
                      <div className="mb-3 space-y-1">
                        <p className="text-gray-400 text-xs">
                          보유: {item.quantity}개
                        </p>
                        <p className="text-green-500 text-xs">
                          판매가:{" "}
                          {typeof item.sellPrice === "number"
                            ? `${item.sellPrice.toLocaleString()} P`
                            : "판매 불가"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          총 판매 가능:{" "}
                          {(
                            (item.sellPrice || 0) * item.quantity
                          ).toLocaleString()}{" "}
                          P
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity <= 0) {
                            showAlert({
                              title: "입력 오류",
                              message: "판매 가능한 수량이 부족합니다.",
                              type: "warning",
                            });
                            return;
                          }

                          if (!item.sellPrice || item.sellPrice <= 0) {
                            showAlert({
                              title: "안내",
                              message: "판매가 정보가 없어 판매할 수 없습니다.",
                              type: "info",
                            });
                            return;
                          }

                          setQuantityModal({
                            isOpen: true,
                            title: "기프트 판매",
                            itemName: item.name,
                            itemEmoji: item.emoji || "",
                            price: item.sellPrice,
                            maxQuantity: item.quantity,
                            currentPoints: profile?.points || 0,
                            isSelling: true,
                            onConfirm: (quantity) => {
                              setQuantityModal((prev) => ({
                                ...prev,
                                isOpen: false,
                              }));
                              void handleSellGift(
                                item.gift_id,
                                item.name,
                                item.sellPrice,
                                quantity,
                              );
                            },
                          });
                        }}
                        disabled={isGiftProcessing}
                        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        판매
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total Value */}
                <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">총 보유 가치</span>
                    <span className="text-pink-500 text-xl">
                      {giftInventory
                        .reduce(
                          (total, item) =>
                            total + (item.sellPrice || 0) * item.quantity,
                          0,
                        )
                        .toLocaleString()}{" "}
                      P
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Gift className="text-gray-600 mx-auto mb-4" size={48} />
                <p className="text-gray-400">보유한 선물이 없습니다</p>
                <p className="text-gray-500 text-sm mt-2">
                  포인트 페이지에서 선물을 구매해보세요
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* Quantity Modal */}
      <QuantityModal
        isOpen={quantityModal.isOpen}
        title={quantityModal.title}
        itemName={quantityModal.itemName}
        itemEmoji={quantityModal.itemEmoji}
        price={quantityModal.price}
        maxQuantity={quantityModal.maxQuantity}
        currentPoints={quantityModal.currentPoints}
        isSelling={quantityModal.isSelling}
        onConfirm={quantityModal.onConfirm}
        onCancel={() => setQuantityModal({ ...quantityModal, isOpen: false })}
      />
    </div>
  );
}
