import { useState, useRef, useCallback } from "react";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

interface ChatImageUploadProps {
  roomId: string;
  senderType: "user" | "profile";
  onImageSent?: (imageUrl: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  size?: number;
  className?: string;
}

export function ChatImageUpload({
  roomId,
  senderType,
  onImageSent,
  onError,
  disabled = false,
  size = 18,
  className = "text-gray-400 hover:text-pink-500 transition-colors p-2 flex-shrink-0",
}: ChatImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      onError?.(
        "지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WEBP만 가능)",
      );
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError?.("이미지 크기는 10MB 이하여야 합니다.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadAndSend = useCallback(async () => {
    if (!selectedFile || !roomId) return;

    setIsUploading(true);
    try {
      // Use supabaseAdmin for profile (agent) uploads to bypass RLS
      const storageClient = senderType === "profile" ? supabaseAdmin : supabase;
      const rpcClient = senderType === "profile" ? supabaseAdmin : supabase;

      // Generate unique filename using roomId and timestamp
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${senderType}/${roomId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await storageClient.storage
          .from("chat-images")
          .upload(fileName, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("chat-images")
        .getPublicUrl(uploadData.path);

      const imageUrl = urlData.publicUrl;

      // Send message with image
      const { error: msgError } = await rpcClient.rpc("chat_send_message", {
        p_room_id: roomId,
        p_sender_type: senderType,
        p_content: imageUrl,
        p_message_type: "image",
        p_gift_id: null,
        p_gift_quantity: null,
      });

      if (msgError) {
        throw new Error(msgError.message);
      }

      onImageSent?.(imageUrl);
      handleCancelPreview();
    } catch (error: any) {
      console.error("Image upload error:", error);
      onError?.(error.message || "이미지 전송에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, roomId, senderType, onImageSent, onError]);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        className={className}
        title="이미지 전송"
      >
        {isUploading ? (
          <Loader2 size={size} className="animate-spin" />
        ) : (
          <ImageIcon size={size} />
        )}
      </button>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">이미지 전송</h3>
              <button
                onClick={handleCancelPreview}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative aspect-square max-h-80 overflow-hidden rounded-lg mb-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain bg-gray-800"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelPreview}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUploadAndSend}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    전송 중...
                  </>
                ) : (
                  "전송"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Image message renderer component
interface ChatImageMessageProps {
  imageUrl: string;
  isMe?: boolean;
  timestamp?: string;
}

export function ChatImageMessage({
  imageUrl,
  isMe = false,
  timestamp,
}: ChatImageMessageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div
        className={`max-w-[70%] ${isMe ? "ml-auto" : "mr-auto"}`}
        onClick={() => setIsFullscreen(true)}
      >
        <div
          className={`rounded-2xl overflow-hidden cursor-pointer ${
            isMe ? "bg-pink-500/20" : "bg-gray-700"
          }`}
        >
          <img
            src={imageUrl}
            alt="Chat image"
            className="max-w-full max-h-60 object-contain"
            loading="lazy"
          />
        </div>
        {timestamp && (
          <p
            className={`text-xs text-gray-500 mt-1 ${
              isMe ? "text-right" : "text-left"
            }`}
          >
            {timestamp}
          </p>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setIsFullscreen(false)}
          >
            <X size={32} />
          </button>
          <img
            src={imageUrl}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </>
  );
}
