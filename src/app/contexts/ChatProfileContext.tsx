import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";
import { getPublicUrlForPath } from "../../lib/storage";

type ChatProfile = Tables<"chat_profiles">;

// Profile interface with UUID string ID
export interface ChatProfileLegacy {
  id: string;
  name: string;
  age: number;
  height?: number;
  weight?: number;
  job?: string;
  imageUrl: string;
  interests: string[];
  bio: string;
  isOnline: boolean;
  chatCost?: number;
}

interface ChatProfileContextType {
  profiles: ChatProfileLegacy[];
  rawProfiles: ChatProfile[];
  setProfiles: (profiles: ChatProfileLegacy[]) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addProfile: (
    profile: Omit<ChatProfile, "id" | "created_at" | "updated_at">
  ) => Promise<{ error: Error | null }>;
  updateProfile: (
    id: string,
    updates: Partial<ChatProfile>
  ) => Promise<{ error: Error | null }>;
  deleteProfile: (id: string) => Promise<{ error: Error | null }>;
}

const ChatProfileContext = createContext<ChatProfileContextType | undefined>(
  undefined
);

// Convert Supabase profile to display format
function convertToLegacy(profile: ChatProfile): ChatProfileLegacy {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    height: profile.height || undefined,
    weight: profile.weight || undefined,
    job: profile.job || undefined,
    imageUrl: getPublicUrlForPath("chat-profile-images", profile.image) || "",
    interests: Array.isArray(profile.interests)
      ? (profile.interests as string[])
      : [],
    bio: profile.bio || "",
    isOnline: profile.is_online || false,
    chatCost: profile.chat_cost || 0,
  };
}

export function ChatProfileProvider({ children }: { children: ReactNode }) {
  const [rawProfiles, setRawProfiles] = useState<ChatProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("chat_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setRawProfiles(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfiles();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("chat-profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_profiles",
        },
        () => {
          fetchProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const profiles = rawProfiles.map(convertToLegacy);

  const setProfiles = (_newProfiles: ChatProfileLegacy[]) => {
    // This is for backward compatibility - not actually updating DB
  };

  const addProfile = async (
    profile: Omit<ChatProfile, "id" | "created_at" | "updated_at">
  ) => {
    const { error } = await supabase.from("chat_profiles").insert(profile);

    if (!error) {
      await fetchProfiles();
    }
    return { error };
  };

  const updateProfile = async (id: string, updates: Partial<ChatProfile>) => {
    const { error } = await supabase
      .from("chat_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      await fetchProfiles();
    }
    return { error };
  };

  const deleteProfile = async (id: string) => {
    const { error } = await supabase
      .from("chat_profiles")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchProfiles();
    }
    return { error };
  };

  return (
    <ChatProfileContext.Provider
      value={{
        profiles,
        rawProfiles,
        setProfiles,
        isLoading,
        error,
        refetch: fetchProfiles,
        addProfile,
        updateProfile,
        deleteProfile,
      }}
    >
      {children}
    </ChatProfileContext.Provider>
  );
}

export function useChatProfiles() {
  const context = useContext(ChatProfileContext);
  if (context === undefined) {
    throw new Error(
      "useChatProfiles must be used within a ChatProfileProvider"
    );
  }
  return context;
}
