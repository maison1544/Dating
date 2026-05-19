import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/types/database.types";

type ChatProfileDB = Tables<"chat_profiles">;

export interface Profile {
  id: string;
  name: string;
  age: number;
  height: number | null;
  weight: number | null;
  job: string | null;
  online: boolean;
  image: string | null;
  tags: string[];
  bio: string | null;
  chatPoints: number | null;
}

interface ProfileContextType {
  profiles: Profile[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Convert Supabase profile to Profile format
function convertToProfile(dbProfile: ChatProfileDB): Profile {
  return {
    id: dbProfile.id,
    name: dbProfile.name,
    age: dbProfile.age,
    height: dbProfile.height ?? null,
    weight: dbProfile.weight ?? null,
    job: dbProfile.job ?? null,
    online: dbProfile.is_online || false,
    image: dbProfile.image ?? null,
    tags: Array.isArray(dbProfile.interests)
      ? (dbProfile.interests as string[])
      : [],
    bio: dbProfile.bio ?? null,
    chatPoints: dbProfile.chat_cost ?? null,
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("chat_profiles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setProfiles((data || []).map(convertToProfile));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfiles();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_profiles",
        },
        () => {
          fetchProfiles();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ProfileContext.Provider
      value={{ profiles, isLoading, error, refetch: fetchProfiles }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfiles must be used within a ProfileProvider");
  }
  return context;
}
