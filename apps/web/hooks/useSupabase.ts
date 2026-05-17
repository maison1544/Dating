import { useState, useEffect, useCallback, useRef } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/lib/types/database.types";
import {
  formatKST,
  getStartOfDayKST,
  getEndOfDayKST,
} from "@/lib/utils/dateUtils";

const gameSettingsCache = new Map<
  "powerball" | "ladder",
  Tables<"game_settings"> | null
>();

type RealtimePostgresPayload = {
  eventType?: string;
  new?: unknown;
  old?: unknown;
};

// Hook for fetching chat profiles
export function useChatProfiles() {
  const [profiles, setProfiles] = useState<Tables<"chat_profiles">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("chat_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setProfiles(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, setProfiles, isLoading, error, refetch: fetchProfiles };
}

// Hook for fetching gift items
export function useGiftItems() {
  const [gifts, setGifts] = useState<Tables<"gifts">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGifts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .eq("is_active", true)
      .order("buy_price", { ascending: true });

    if (error) {
      setError(error);
    } else {
      setGifts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  return { gifts, isLoading, error, refetch: fetchGifts };
}

// Hook for fetching user's gifts
export function useUserGifts(userId: string | undefined) {
  const [userGifts, setUserGifts] = useState<
    (Tables<"gift_inventory"> & { gifts: Tables<"gifts"> })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserGifts = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("gift_inventory")
      .select("*, gifts(*)")
      .eq("owner_id", userId)
      .eq("owner_type", "user")
      .gt("quantity", 0);

    if (error) {
      setError(error);
    } else {
      setUserGifts((data as any) || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchUserGifts();
  }, [fetchUserGifts]);

  return { userGifts, isLoading, error, refetch: fetchUserGifts };
}

// Hook for fetching agent's gift inventory with real-time updates
export function useAgentGifts(agentId: string | undefined) {
  const [agentGifts, setAgentGifts] = useState<
    (Tables<"gift_inventory"> & { gifts: Tables<"gifts"> })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgentGifts = useCallback(async () => {
    if (!agentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabaseAdmin
      .from("gift_inventory")
      .select("*, gifts(*)")
      .eq("owner_id", agentId)
      .eq("owner_type", "agent")
      .gt("quantity", 0);

    if (error) {
      setError(error);
    } else {
      setAgentGifts((data as any) || []);
    }
    setIsLoading(false);
  }, [agentId]);

  useEffect(() => {
    fetchAgentGifts();
  }, [fetchAgentGifts]);

  // Polling for gift_inventory updates (more reliable than real-time)
  // Poll every 3 seconds for near-realtime experience
  useEffect(() => {
    if (!agentId) return;

    const pollInterval = setInterval(() => {
      fetchAgentGifts();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [agentId, fetchAgentGifts]);

  // Real-time subscription for gift_inventory changes (backup)
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`agent-gifts-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gift_inventory",
          filter: `owner_id=eq.${agentId}`,
        },
        () => {
          // Refetch on any change to agent's inventory
          fetchAgentGifts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, fetchAgentGifts]);

  return { agentGifts, isLoading, error, refetch: fetchAgentGifts };
}

// Hook for fetching notices
export function useNotices() {
  const [notices, setNotices] = useState<Tables<"notices">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select("*, admins(name)")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setNotices((data as any) || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  return { notices, isLoading, error, refetch: fetchNotices };
}

// Hook for game rounds
export function useGameRounds(gameType: "powerball" | "ladder") {
  const [currentRound, setCurrentRound] =
    useState<Tables<"game_rounds"> | null>(null);
  const [history, setHistory] = useState<Tables<"game_rounds">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCurrentRound = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_rounds")
      .select("*")
      .eq("game_type", gameType)
      .in("status", ["betting", "playing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      setError(error);
    } else {
      setCurrentRound(data);
    }
  }, [gameType]);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_rounds")
      .select("*")
      .eq("game_type", gameType)
      .in("status", ["completed", "settled"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setError(error);
    } else {
      setHistory(data || []);
    }
  }, [gameType]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCurrentRound(), fetchHistory()]);
      setIsLoading(false);
    };
    loadData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`game-${gameType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rounds",
          filter: `game_type=eq.${gameType}`,
        },
        () => {
          fetchCurrentRound();
          fetchHistory();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameType, fetchCurrentRound, fetchHistory]);

  return {
    currentRound,
    history,
    isLoading,
    error,
    refetch: fetchCurrentRound,
  };
}

export function useGameHistory(gameType: "powerball" | "ladder") {
  const [history, setHistory] = useState<Tables<"game_rounds">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("game_rounds")
      .select("*")
      .eq("game_type", gameType)
      .in("status", ["completed", "settled"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setError(error);
      setHistory([]);
    } else {
      setHistory(data || []);
    }

    setIsLoading(false);
  }, [gameType]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchHistory();
      }, 300);
    };

    const channel = supabase
      .channel(`game-history-${gameType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rounds",
          filter: `game_type=eq.${gameType}`,
        },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      supabase.removeChannel(channel);
    };
  }, [fetchHistory, gameType]);

  return { history, isLoading, error, refetch: fetchHistory };
}

export function useGameChat(gameType: "powerball" | "ladder", limit = 50) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("game_chat_list", {
        p_game_type: gameType,
        p_limit: limit,
      });
      if (error) throw error;

      const rows = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.rows)
          ? (data as any).rows
          : Array.isArray((data as any)?.messages)
            ? (data as any).messages
            : [];

      setMessages(rows as any[]);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error");
      setError(err);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [gameType, limit]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchMessages();
      }, 200);
    };

    const channel = supabase
      .channel(`game-chat-${gameType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_chats",
          filter: `game_type=eq.${gameType}`,
        },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, gameType]);

  return { messages, isLoading, error, refetch: fetchMessages };
}

export function useSendGameChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (gameType: "powerball" | "ladder", message: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const text = (message || "").trim();
        if (!text) {
          throw new Error("???? ??????.");
        }

        const { error } = await supabase.rpc("game_chat_send", {
          p_game_type: gameType,
          p_message: text,
        });
        if (error) throw error;

        return { success: true };
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { sendMessage, isLoading, error };
}

// Hook for user's bets
export function useUserBets(
  userId: string | undefined,
  gameType?: "powerball" | "ladder",
) {
  const [bets, setBets] = useState<
    (Tables<"game_bets"> & { game_rounds: Tables<"game_rounds"> })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refetchTimerRef = useRef<number | null>(null);

  const fetchBets = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // gameType? ??? inner join?? ???, ??? ?? ??
    const selectQuery = gameType
      ? "*, game_rounds!inner(*)"
      : "*, game_rounds(*)";

    let query = supabase
      .from("game_bets")
      .select(selectQuery)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (gameType) {
      query = query.eq("game_rounds.game_type", gameType);
    }

    const { data, error } = await query;

    if (error) {
      setError(error);
    } else {
      setBets((data as any) || []);
    }
    setIsLoading(false);
  }, [userId, gameType]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  // ??? ?? - ?? ?? ?? ? ?? ???? (?? ?? ??)
  useEffect(() => {
    if (!userId) return;

    const scheduleRefetch = () => {
      if (refetchTimerRef.current) {
        window.clearTimeout(refetchTimerRef.current);
      }
      refetchTimerRef.current = window.setTimeout(() => {
        void fetchBets();
      }, 200);
    };

    const channel = supabase
      .channel(`user-bets-${userId}-${gameType || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_bets",
          filter: `user_id=eq.${userId}`,
        },
        scheduleRefetch,
      )
      .subscribe();

    return () => {
      if (refetchTimerRef.current) {
        window.clearTimeout(refetchTimerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [userId, gameType, fetchBets]);

  return { bets, isLoading, error, refetch: fetchBets };
}

export function useMyGameBets(
  userId: string | undefined,
  gameType?: "powerball" | "ladder",
) {
  return useUserBets(userId, gameType);
}

// Hook for point transactions
export function usePointTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<
    Tables<"point_transactions">[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setError(error);
    } else {
      setTransactions(data || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, error, refetch: fetchTransactions };
}

// Hook for gift transactions
export function useGiftTransactions(userId: string | undefined) {
  const [giftTransactions, setGiftTransactions] = useState<
    Tables<"gift_transactions">[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("gift_transactions")
      .select("*, gifts(*)")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setError(error);
    } else {
      setGiftTransactions(data || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { giftTransactions, isLoading, error, refetch: fetchTransactions };
}

// Hook for chat rooms
export function useChatRooms(userId: string | undefined) {
  const [rooms, setRooms] = useState<
    (Tables<"chat_rooms"> & { chat_profiles: Tables<"chat_profiles"> })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*, chat_profiles(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("last_message_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setRooms((data as any) || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchRooms();

    if (!userId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`chat-rooms-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchRooms();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchRooms]);

  return { rooms, isLoading, error, refetch: fetchRooms };
}

export function useChatRoomsWithProfiles(userId: string | undefined) {
  return useChatRooms(userId);
}

export function useCreateOrGetChatRoom() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createOrGetRoom = useCallback(
    async (userId: string, profileId: string) => {
      void userId;
      setIsLoading(true);
      setError(null);

      try {
        const { data: roomRef, error: rpcError } = await supabase.rpc(
          "create_or_get_chat_room",
          {
            p_profile_id: profileId,
          },
        );

        if (rpcError) throw rpcError;

        const id =
          typeof roomRef === "string"
            ? roomRef
            : (roomRef as any)?.id ||
              (roomRef as any)?.room_id ||
              (roomRef as any)?.roomId ||
              (roomRef as any)?.chat_room_id;

        if (!id) {
          throw new Error("??? ??? ??????.");
        }

        const { data: room, error: roomError } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("id", String(id))
          .maybeSingle();

        if (roomError) throw roomError;
        if (!room) throw new Error("??? ??? ??????.");

        return { success: true, room };
      } catch (e) {
        const err = e as any;
        const msg = err?.message ? String(err.message) : String(err);
        setError(err instanceof Error ? err : new Error(msg));
        return { success: false, error: msg, room: null };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { createOrGetRoom, isLoading, error };
}

// Hook for chat messages
export function useChatMessages(roomId: string | undefined) {
  const [messages, setMessages] = useState<Tables<"messages">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authedUserId, setAuthedUserId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    if (!authedUserId) {
      setMessages([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error);
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  }, [roomId, authedUserId]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getUser()
      .then((result: { data: { user: { id: string } | null } }) => {
        if (cancelled) return;
        setAuthedUserId(result.data.user?.id ?? null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (cancelled) return;
        setAuthedUserId(session?.user?.id ?? null);
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchMessages();

    if (!roomId) return;
    if (!authedUserId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`chat-messages-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresPayload) => {
          setMessages((prev) => [...prev, payload.new as Tables<"messages">]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, authedUserId, fetchMessages]);

  const sendMessage = async (
    content: string,
    senderId: string,
    senderType: "user" | "profile",
    messageType: "text" | "image" | "gift" = "text",
  ) => {
    if (!roomId) return { error: new Error("No room selected") };

    try {
      void senderId;
      const { data: messageId, error: rpcError } = await supabase.rpc(
        "chat_send_message",
        {
          p_room_id: roomId,
          p_sender_type: senderType,
          p_content: content,
          p_message_type: messageType,
          p_gift_id: null,
          p_gift_quantity: null,
        },
      );

      if (rpcError) throw rpcError;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("id", String(messageId))
        .maybeSingle();

      return { data, error };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  };

  return { messages, isLoading, error, sendMessage, refetch: fetchMessages };
}

export function useRealtimeChat(
  roomId: string | undefined,
  options?: { useAdmin?: boolean },
) {
  const useAdmin = options?.useAdmin ?? false;
  const [messages, setMessages] = useState<
    (Tables<"messages"> & { gift_items?: Tables<"gifts"> | null })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authedUserId, setAuthedUserId] = useState<string | null>(null);

  const hydrateGiftItems = useCallback(
    async (
      rows: (Tables<"messages"> & { gift_items?: Tables<"gifts"> | null })[],
    ) => {
      const giftIds = Array.from(
        new Set(
          (rows || [])
            .map((r: any) => String(r?.gift_id || "").trim())
            .filter(Boolean),
        ),
      );

      if (giftIds.length === 0) {
        return (rows || []).map((r: any) => ({ ...r, gift_items: null }));
      }

      const { data: gifts, error: giftsError } = await supabase
        .from("gifts")
        .select("*")
        .in("id", giftIds);

      if (giftsError) {
        return (rows || []).map((r: any) => ({ ...r, gift_items: null }));
      }

      const giftMap = new Map<string, any>(
        (gifts || []).map((g: any) => [String(g.id), g]),
      );

      return (rows || []).map((r: any) => ({
        ...r,
        gift_items: r?.gift_id
          ? (giftMap.get(String(r.gift_id)) ?? null)
          : null,
      }));
    },
    [],
  );

  const fetchMessages = useCallback(async () => {
    if (!roomId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    // Skip authedUserId check when using admin mode (for agents)
    if (!useAdmin && !authedUserId) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use supabaseAdmin for agent mode to bypass RLS
    const client = useAdmin ? supabaseAdmin : supabase;
    const fallbackRes = await client
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (fallbackRes.error) {
      setError(fallbackRes.error);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const hydrated = await hydrateGiftItems((fallbackRes.data as any) || []);
    setMessages((hydrated as any) || []);
    setIsLoading(false);
  }, [roomId, authedUserId, useAdmin, hydrateGiftItems]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getUser()
      .then((result: { data: { user: { id: string } | null } }) => {
        if (cancelled) return;
        setAuthedUserId(result.data.user?.id ?? null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (cancelled) return;
        setAuthedUserId(session?.user?.id ?? null);
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchMessages();

    if (!roomId) return;
    // Skip authedUserId check when using admin mode (for agents)
    if (!useAdmin && !authedUserId) return;

    // Use supabaseAdmin for agent mode to bypass RLS
    const client = useAdmin ? supabaseAdmin : supabase;
    const channel = client
      .channel(`realtime-chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresPayload) => {
          void (async () => {
            const id = String((payload.new as any)?.id || "");
            if (!id) return;

            const row = await client
              .from("messages")
              .select("*")
              .eq("id", id)
              .maybeSingle();

            if (row.error || !row.data) return;

            const hydrated = await hydrateGiftItems([row.data as any]);
            const hydratedRow = (hydrated || [])[0];
            if (!hydratedRow) return;

            setMessages((prev) => {
              if (prev.some((m) => String((m as any).id) === String(id))) {
                return prev;
              }
              return [...prev, hydratedRow as any];
            });
          })();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [roomId, authedUserId, useAdmin, fetchMessages, hydrateGiftItems]);

  return { messages, isLoading, error, refetch: fetchMessages };
}

export function useSendMessage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const hydrateGiftItems = useCallback(
    async (
      rows: (Tables<"messages"> & { gift_items?: Tables<"gifts"> | null })[],
    ) => {
      const giftIds = Array.from(
        new Set(
          (rows || [])
            .map((r: any) => String(r?.gift_id || "").trim())
            .filter(Boolean),
        ),
      );

      if (giftIds.length === 0) {
        return (rows || []).map((r: any) => ({ ...r, gift_items: null }));
      }

      const { data: gifts, error: giftsError } = await supabase
        .from("gifts")
        .select("*")
        .in("id", giftIds);

      if (giftsError) {
        return (rows || []).map((r: any) => ({ ...r, gift_items: null }));
      }

      const giftMap = new Map<string, any>(
        (gifts || []).map((g: any) => [String(g.id), g]),
      );

      return (rows || []).map((r: any) => ({
        ...r,
        gift_items: r?.gift_id
          ? (giftMap.get(String(r.gift_id)) ?? null)
          : null,
      }));
    },
    [],
  );

  const sendMessage = async (
    roomId: string,
    senderId: string,
    senderType: "user" | "profile",
    content: string,
    messageType: "text" | "image" | "gift" = "text",
    giftId: string | null = null,
    giftQuantity: number | null = null,
  ) => {
    void senderId;
    setIsLoading(true);
    setError(null);

    // Use supabaseAdmin for profile (agent) senders to bypass RLS
    const client = senderType === "profile" ? supabaseAdmin : supabase;

    try {
      const { data: messageId, error: rpcError } = await client.rpc(
        "chat_send_message",
        {
          p_room_id: roomId,
          p_sender_type: senderType,
          p_content: content,
          p_message_type: messageType,
          p_gift_id: giftId,
          p_gift_quantity: giftQuantity,
        },
      );

      if (rpcError) throw rpcError;

      const { data, error } = await client
        .from("messages")
        .select("*")
        .eq("id", String(messageId))
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("???? ?? ? ????.");

      const hydrated = await hydrateGiftItems([data as any]);
      const hydratedRow = (hydrated || [])[0] as any;

      return { data: hydratedRow, error: null as Error | null };
    } catch (e) {
      const err = e as Error;
      setError(err);
      return { data: null, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading, error };
}

export function useMarkMessagesAsRead() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markAsRead = async (roomId: string, readerId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: room, error: roomError } = await supabaseAdmin
        .from("chat_rooms")
        .select("user_id, profile_id")
        .eq("id", roomId)
        .maybeSingle();

      if (roomError) throw roomError;
      if (!room) throw new Error("???? ?? ? ????.");

      const readerType =
        String(room.profile_id) === String(readerId) ? "profile" : "user";

      // Use supabaseAdmin for profile (agent) readers to bypass RLS
      // For user readers, use regular supabase client
      const client = readerType === "profile" ? supabaseAdmin : supabase;

      const { error: rpcError } = await client.rpc("chat_mark_read", {
        p_room_id: roomId,
        p_reader_type: readerType,
      });

      if (rpcError) throw rpcError;

      // Immediately update local state for profile readers
      if (readerType === "profile") {
        await supabaseAdmin
          .from("chat_rooms")
          .update({ profile_unread_count: 0 })
          .eq("id", roomId);
      }

      return { success: true };
    } catch (e) {
      const err = e as Error;
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { markAsRead, isLoading, error };
}

// Hook for admin accounts
export function useAdminAccounts() {
  const [accounts, setAccounts] = useState<Tables<"admins">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    // ??? ????? ?? (RLS ??? ??)
    const { data, error } = await supabaseAdmin
      .from("admins")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setAccounts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ??? ?? - admins ?? ??
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchAccounts();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel("admin-accounts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admins" },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [fetchAccounts]);

  const createAccount = async (
    account: Omit<Tables<"admins">, "created_at" | "updated_at">,
  ) => {
    // ??? ????? ?? (RLS ??? ??)
    const { data, error } = await supabaseAdmin
      .from("admins")
      .insert(account as Tables<"admins">)
      .select()
      .single();
    if (!error) fetchAccounts();
    return { data, error };
  };

  const updateAccount = async (
    id: string,
    updates: Partial<Tables<"admins">>,
  ) => {
    // ??? ????? ?? (RLS ??? ??)
    const { error } = await supabaseAdmin
      .from("admins")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) fetchAccounts();
    return { error };
  };

  const deleteAccount = async (id: string) => {
    // ??? ????? ?? (RLS ??? ??)
    const { error } = await supabaseAdmin.from("admins").delete().eq("id", id);
    if (!error) fetchAccounts();
    return { error };
  };

  return {
    accounts,
    isLoading,
    error,
    refetch: fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}

export function useAgents() {
  const [agents, setAgents] = useState<
    (Tables<"agents"> & {
      assigned_profiles_count: number;
      referred_members_count: number;
    })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ??? ????? ?? (RLS ??? ??)
      const { data, error } = await supabaseAdmin
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []) as Tables<"agents">[];
      const enriched = await Promise.all(
        rows.map(async (agent) => {
          const [profilesCountRes, membersCountRes, membersRes] =
            await Promise.all([
              supabaseAdmin
                .from("chat_profiles")
                .select("id", { count: "exact", head: true })
                .eq("assigned_agent_id", agent.id),
              supabaseAdmin
                .from("user_profiles")
                .select("id", { count: "exact", head: true })
                .eq("agent_id", agent.id),
              supabaseAdmin
                .from("user_profiles")
                .select("id, agent_assigned_at")
                .eq("agent_id", agent.id),
            ]);

          // Calculate total_revenue including HISTORICAL members using RPC
          let totalRevenue = 0;
          const currentMembers = membersRes.data || [];

          // Get historical members from referral code change logs
          const { data: historyLogs } = await supabaseAdmin.rpc(
            "get_agent_referral_code_logs",
            { p_agent_id: agent.id },
          );

          const currentIds = new Set(currentMembers.map((m: any) => m.id));
          const historyIds = ((historyLogs as any[]) || [])
            .filter(
              (log: any) => (log.changes as any)?.fromAgentId === agent.id,
            )
            .map(
              (log: any) =>
                (log.target_id as string | null) ??
                ((log.changes as any)?.userId as string | null),
            )
            .filter(
              (id: any): id is string => Boolean(id) && !currentIds.has(id),
            );

          // Fetch historical member data
          let historicalMembers: any[] = [];
          if (historyIds.length > 0) {
            const { data: histMembers } = await supabaseAdmin
              .from("user_profiles")
              .select("id, agent_assigned_at")
              .in("id", historyIds);
            historicalMembers = histMembers || [];
          }

          // Merge all members
          const allMembers = [...currentMembers, ...historicalMembers];
          if (allMembers.length > 0) {
            const memberIds = allMembers.map((m: any) => m.id);

            // Build assignment windows for filtering
            const historyLogsByUser = new Map<string, any[]>();
            ((historyLogs as any[]) || []).forEach((log: any) => {
              const userId =
                (log.target_id as string | null) ??
                ((log.changes as any)?.userId as string | null);
              if (!userId) return;
              const existing = historyLogsByUser.get(userId) || [];
              existing.push(log);
              historyLogsByUser.set(userId, existing);
            });

            const memberAssignmentWindows = new Map<
              string,
              { start: Date | null; end: Date | null }[]
            >();

            allMembers.forEach((member: any) => {
              const logs = (historyLogsByUser.get(member.id) || []).slice();
              logs.sort((a: any, b: any) => {
                const aTime =
                  (a.changes as any)?.toAssignedAt || a.created_at || "";
                const bTime =
                  (b.changes as any)?.toAssignedAt || b.created_at || "";
                return new Date(aTime).getTime() - new Date(bTime).getTime();
              });

              const windows: { start: Date | null; end: Date | null }[] = [];
              logs.forEach((log: any) => {
                const changes = log.changes as any;
                if (changes?.fromAgentId === agent.id) {
                  const start = changes?.fromAssignedAt
                    ? new Date(changes.fromAssignedAt)
                    : null;
                  const end = changes?.toAssignedAt
                    ? new Date(changes.toAssignedAt)
                    : new Date(log.created_at);
                  windows.push({ start, end });
                }
              });

              if (currentIds.has(member.id)) {
                const start = member.agent_assigned_at
                  ? new Date(member.agent_assigned_at)
                  : null;
                windows.push({ start, end: null });
              }
              memberAssignmentWindows.set(member.id, windows);
            });

            const isWithinWindow = (userId: string, date: Date) => {
              const windows = memberAssignmentWindows.get(userId) || [];
              if (windows.length === 0) return true;
              return windows.some((w) => {
                const afterStart = w.start ? date >= w.start : true;
                const beforeEnd = w.end ? date < w.end : true;
                return afterStart && beforeEnd;
              });
            };

            // Fetch transactions using RPC (bypasses RLS)
            const { data: txData } = await supabaseAdmin.rpc(
              "get_agent_member_transactions",
              { p_member_ids: memberIds, p_types: ["charge", "withdraw"] },
            );

            ((txData as any[]) || []).forEach((t: any) => {
              const txDate = new Date(t.created_at || Date.now());
              if (!isWithinWindow(t.user_id, txDate)) return;
              const rawAmount = Number(t.amount || 0);
              const amount =
                t.type === "charge" ? rawAmount : -Math.abs(rawAmount);
              totalRevenue += amount;
            });
          }

          return {
            ...agent,
            total_revenue: totalRevenue,
            assigned_profiles_count: Number(profilesCountRes.count || 0),
            referred_members_count: Number(membersCountRes.count || 0),
          };
        }),
      );

      setAgents(enriched);
    } catch (err) {
      setError(err as Error);
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // ??? ?? - agents ?? ??
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchAgents();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel("admin-agents-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents" },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [fetchAgents]);

  const updateAgent = async (
    id: string,
    updates: Partial<Tables<"agents">>,
  ) => {
    // ??? ????? ?? (RLS ??? ??)
    const { error } = await supabaseAdmin
      .from("agents")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) fetchAgents();
    return { error };
  };

  return {
    agents,
    isLoading,
    error,
    refetch: fetchAgents,
    updateAgent,
  };
}

export function useBackofficeAccountActions(adminId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getValidAccessToken = useCallback(async (): Promise<string> => {
    // ?? ?? ?? ??
    const { data: refreshed, error: refreshError } =
      await supabaseAdmin.auth.refreshSession();

    if (!refreshError && refreshed.session?.access_token) {
      return refreshed.session.access_token;
    }

    // ?? ?? ? ?? ?? ??
    const {
      data: { session },
      error: sessionError,
    } = await supabaseAdmin.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.access_token) {
      throw new Error("???? ?????. ?? ???????.");
    }

    // ?? ?? ?? ??
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      throw new Error("??? ???????. ?? ???????.");
    }

    return session.access_token;
  }, []);

  const invokeBackofficeFunction = useCallback(
    async <T>(
      functionName: string,
      accessToken: string,
      body: unknown,
    ): Promise<T> => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error("Missing Supabase environment variables");
      }

      const resp = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body ?? {}),
      });

      if (!resp.ok) {
        let errorMessage = "?? ?? ? ??? ??????.";
        try {
          const text = await resp.clone().text();
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.error) {
              errorMessage = parsed.error;
            }
          }
        } catch {
          // JSON ?? ?? ? ?? ??? ??
        }
        throw new Error(errorMessage);
      }

      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return (await resp.json()) as T;
      }

      return (await resp.text()) as unknown as T;
    },
    [],
  );

  const createBackofficeAccount = useCallback(
    async (
      params:
        | {
            accountType: "admin";
            username: string;
            name: string;
            password: string;
            role: "admin";
          }
        | {
            accountType: "agent";
            username: string;
            name: string;
            password: string;
            referralCode?: string;
          },
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!adminId) throw new Error("??? ??? ?????.");

        const accessToken = await getValidAccessToken();

        const data = await invokeBackofficeFunction<any>(
          "admin-create-backoffice-account",
          accessToken,
          params,
        );

        await supabaseAdmin.from("admin_action_logs").insert({
          action:
            params.accountType === "admin" ? "create_admin" : "create_agent",
          admin_id: adminId,
          target_id: data?.id || null,
          target_type: params.accountType === "admin" ? "admins" : "agents",
          ip_address: null,
          changes: { ...params, password: undefined },
        });

        return data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [adminId, getValidAccessToken, invokeBackofficeFunction],
  );

  const assignChatProfilesToAgent = useCallback(
    async (params: { agentId: string; profileIds: string[] }) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!adminId) throw new Error("??? ??? ?????.");
        if (!params.agentId) throw new Error("agentId? ?????.");
        if (!params.profileIds || params.profileIds.length === 0) {
          throw new Error("??? ???? ??????.");
        }

        const { error: updateError } = await supabaseAdmin
          .from("chat_profiles")
          .update({ assigned_agent_id: params.agentId })
          .in("id", params.profileIds);

        if (updateError) throw updateError;

        await supabaseAdmin.from("admin_action_logs").insert({
          action: "assign_chat_profiles",
          admin_id: adminId,
          target_id: params.agentId,
          target_type: "agents",
          ip_address: null,
          changes: { profileIds: params.profileIds },
        });

        return { success: true };
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [adminId, getValidAccessToken, invokeBackofficeFunction],
  );

  const deleteBackofficeAccount = useCallback(
    async (params: {
      accountType: "admin" | "agent";
      userId: string;
      memberHandling?: "detach" | "deactivate";
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!adminId) throw new Error("??? ??? ?????.");

        const accessToken = await getValidAccessToken();

        const data = await invokeBackofficeFunction<any>(
          "admin-delete-backoffice-account",
          accessToken,
          params,
        );

        await supabaseAdmin.from("admin_action_logs").insert({
          action:
            params.accountType === "admin" ? "delete_admin" : "delete_agent",
          admin_id: adminId,
          target_id: params.userId,
          target_type: params.accountType === "admin" ? "admins" : "agents",
          ip_address: null,
          changes: { ...params },
        });

        return data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [adminId, getValidAccessToken, invokeBackofficeFunction],
  );

  const updateBackofficePassword = useCallback(
    async (params: { userId: string; newPassword: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!adminId) throw new Error("??? ??? ?????.");

        const accessToken = await getValidAccessToken();

        const data = await invokeBackofficeFunction<any>(
          "admin-update-user-password",
          accessToken,
          { userId: params.userId, newPassword: params.newPassword },
        );

        await supabaseAdmin.from("admin_action_logs").insert({
          action: "change_backoffice_password",
          admin_id: adminId,
          target_id: params.userId,
          target_type: "auth.users",
          ip_address: null,
          changes: { changed: true },
        });

        return data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [adminId, getValidAccessToken, invokeBackofficeFunction],
  );

  return {
    createBackofficeAccount,
    deleteBackofficeAccount,
    updateBackofficePassword,
    assignChatProfilesToAgent,
    isLoading,
    error,
  };
}

// Hook for users management (admin)
export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    // ??? ????? ?? (RLS ??? ??)
    // Join with agents table to get referral_code
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("*, agents:agent_id(referral_code)")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      // Flatten agents.referral_code into referral_code field
      const usersWithReferral = (data || []).map((u: any) => ({
        ...u,
        referral_code: u.agents?.referral_code || "",
      }));
      setUsers(usersWithReferral);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ??? ?? - user_profiles ?? ??
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchUsers();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel("admin-users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_profiles" },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [fetchUsers]);

  const updateUser = async (
    id: string,
    updates: Partial<Tables<"user_profiles">>,
  ) => {
    // ??? ????? ?? (RLS ??? ??)
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) fetchUsers();
    return { error };
  };

  return { users, isLoading, error, refetch: fetchUsers, updateUser };
}

// Hook for point packages (charging_cards ??)
export function usePointPackages() {
  type PointPackage = {
    id: string;
    name: string;
    points: number;
    bonus_points: number;
    price: number;
  };

  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("charging_cards")
      .select("*")
      .eq("is_active", true)
      .order("amount", { ascending: true });

    if (error) {
      setError(error);
    } else {
      setPackages(
        ((data || []) as Tables<"charging_cards">[]).map((card) => {
          const amount = card.amount;
          const bonusAmount = card.bonus_amount ?? 0;

          return {
            id: card.id,
            name: card.name,
            points: amount,
            bonus_points: bonusAmount,
            price: amount,
          };
        }),
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return { packages, isLoading, error, refetch: fetchPackages };
}

// Hook for deposit requests (?? ??)
export function useDepositRequests(userId?: string) {
  const [requests, setRequests] = useState<Tables<"deposit_requests">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let query = supabase
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      setError(error);
    } else {
      setRequests(data || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (request: TablesInsert<"deposit_requests">) => {
    const { data, error } = await supabase
      .from("deposit_requests")
      .insert(request)
      .select()
      .single();
    // ??????? ?? ???? (?? ?? ??)
    if (!error) void fetchRequests();
    return { data, error };
  };

  const updateRequest = async (
    id: string,
    updates: Partial<Tables<"deposit_requests">>,
  ) => {
    const { error } = await supabase
      .from("deposit_requests")
      .update(updates)
      .eq("id", id);
    if (!error) fetchRequests();
    return { error };
  };

  return {
    requests,
    isLoading,
    error,
    refetch: fetchRequests,
    createRequest,
    updateRequest,
  };
}

// Hook for withdrawal requests (?? ??)
export function useWithdrawalRequests(userId?: string) {
  const [requests, setRequests] = useState<Tables<"withdrawal_requests">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let query = supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      setError(error);
    } else {
      setRequests(data || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (
    request: TablesInsert<"withdrawal_requests">,
  ) => {
    try {
      // Edge Function? ?? ?? ?? ?? (??? ?? ?? ??)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        return { data: null, error: new Error("???? ?????.") };
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        return {
          data: null,
          error: new Error("Supabase URL? ???? ?????."),
        };
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/request-withdrawal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: request.amount,
            bank: request.bank,
            account_number: request.account_number,
            account_holder: request.account_holder,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          data: null,
          error: new Error(result.error || "?? ??? ??????."),
        };
      }

      // ??????? ?? ???? (?? ?? ??)
      void fetchRequests();
      return { data: result.data, error: null };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "?? ??? ??????.";
      return { data: null, error: new Error(errorMessage) };
    }
  };

  const updateRequest = async (
    id: string,
    updates: Partial<Tables<"withdrawal_requests">>,
  ) => {
    const { error } = await supabase
      .from("withdrawal_requests")
      .update(updates)
      .eq("id", id);
    if (!error) fetchRequests();
    return { error };
  };

  return {
    requests,
    isLoading,
    error,
    refetch: fetchRequests,
    createRequest,
    updateRequest,
  };
}

// Hook for all gift items (admin)
export function useAllGiftItems() {
  const [gifts, setGifts] = useState<Tables<"gifts">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGifts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      setError(error);
    } else {
      setGifts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const createGift = async (
    gift: Omit<Tables<"gifts">, "id" | "created_at" | "updated_at">,
  ) => {
    const { data, error } = await supabase
      .from("gifts")
      .insert(gift)
      .select()
      .single();
    if (!error) fetchGifts();
    return { data, error };
  };

  const updateGift = async (id: string, updates: Partial<Tables<"gifts">>) => {
    const { error } = await supabase
      .from("gifts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) fetchGifts();
    return { error };
  };

  const deleteGift = async (id: string) => {
    const { error } = await supabase.from("gifts").delete().eq("id", id);
    if (!error) fetchGifts();
    return { error };
  };

  return {
    gifts,
    isLoading,
    error,
    refetch: fetchGifts,
    createGift,
    updateGift,
    deleteGift,
  };
}

export function useAdminGifts(adminId?: string) {
  const [gifts, setGifts] = useState<
    (Tables<"gifts"> & { sales_count: number; revenue_points: number })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: giftRows, error: giftsError } = await supabaseAdmin
        .from("gifts")
        .select("*")
        .order("display_order", { ascending: true });

      if (giftsError) throw giftsError;

      const rows = (giftRows || []) as Tables<"gifts">[];
      const statsMap = new Map<string, { sales: number; revenue: number }>();

      const pageSize = 1000;
      const maxRows = 20000;
      for (let from = 0; from < maxRows; from += pageSize) {
        const { data: page, error: pageError } = await supabaseAdmin
          .from("gift_transactions")
          .select("gift_id, quantity, points_amount")
          .eq("transaction_type", "buy")
          .range(from, from + pageSize - 1);

        if (pageError) throw pageError;
        if (!page || page.length === 0) break;

        (page || []).forEach((t: any) => {
          const giftId = t.gift_id as string | null;
          if (!giftId) return;
          const qty = Number(t.quantity ?? 1);
          const amt = Number(t.points_amount ?? 0);
          const prev = statsMap.get(giftId) || { sales: 0, revenue: 0 };
          statsMap.set(giftId, {
            sales: prev.sales + qty,
            revenue: prev.revenue + amt,
          });
        });

        if (page.length < pageSize) break;
      }

      setGifts(
        rows.map((g) => {
          const stat = statsMap.get(g.id) || { sales: 0, revenue: 0 };
          return {
            ...g,
            sales_count: stat.sales,
            revenue_points: stat.revenue,
          };
        }),
      );
    } catch (err) {
      setError(err as Error);
      setGifts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGifts();
  }, [fetchGifts]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void fetchGifts();
      }, 300);
    };

    const channel = supabase
      .channel("admin-gifts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        schedule,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gift_transactions" },
        schedule,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchGifts]);

  const createGift = async (gift: TablesInsert<"gifts">) => {
    const { data, error } = await supabase
      .from("gifts")
      .insert(gift)
      .select()
      .single();

    if (!error) {
      if (adminId) {
        await supabase.from("admin_action_logs").insert({
          action: "create_gift",
          admin_id: adminId,
          target_id: (data as any)?.id || null,
          target_type: "gifts",
          ip_address: null,
          changes: gift,
        });
      }
      await fetchGifts();
    }
    return { data, error };
  };

  const updateGift = async (id: string, updates: Partial<Tables<"gifts">>) => {
    const { data, error } = await supabase
      .from("gifts")
      .update({ ...updates })
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      if (adminId) {
        await supabase.from("admin_action_logs").insert({
          action: "update_gift",
          admin_id: adminId,
          target_id: id,
          target_type: "gifts",
          ip_address: null,
          changes: updates,
        });
      }
      await fetchGifts();
    }

    return { data, error };
  };

  const deactivateGift = async (id: string) => {
    return updateGift(id, { is_active: false });
  };

  const reclaimGiftInventory = async (giftId: string) => {
    const { error: rpcError } = await supabase.rpc(
      "admin_reclaim_gift_inventory",
      {
        p_gift_id: giftId,
      },
    );
    if (rpcError) throw rpcError;

    if (adminId) {
      await supabase.from("admin_action_logs").insert({
        action: "reclaim_gift_inventory",
        admin_id: adminId,
        target_id: giftId,
        target_type: "gifts",
        ip_address: null,
        changes: { mode: "refund_sell_price" },
      });
    }

    await fetchGifts();
    return { error: null as Error | null };
  };

  const deleteGift = async (giftId: string, opts?: { reclaim?: boolean }) => {
    try {
      if (opts?.reclaim) {
        await reclaimGiftInventory(giftId);
      }
      const { error } = await supabase
        .from("gifts")
        .update({ is_active: false })
        .eq("id", giftId);

      if (error) throw error;

      if (adminId) {
        await supabase.from("admin_action_logs").insert({
          action: "deactivate_gift",
          admin_id: adminId,
          target_id: giftId,
          target_type: "gifts",
          ip_address: null,
          changes: { reclaim: !!opts?.reclaim },
        });
      }

      await fetchGifts();
      return { error: null as Error | null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  return {
    gifts,
    isLoading,
    error,
    refetch: fetchGifts,
    createGift,
    updateGift,
    deactivateGift,
    reclaimGiftInventory,
    deleteGift,
  };
}

// Hook for all notices (admin)
export function useAllNotices() {
  const [notices, setNotices] = useState<Tables<"notices">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabaseAdmin
      .from("notices")
      .select("*, admins:author_id(username)")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setNotices(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const createNotice = async (
    notice: Omit<Tables<"notices">, "id" | "created_at" | "updated_at">,
  ) => {
    const { data, error } = await supabaseAdmin
      .from("notices")
      .insert(notice)
      .select()
      .single();
    if (!error) fetchNotices();
    return { data, error };
  };

  const updateNotice = async (
    id: string,
    updates: Partial<Tables<"notices">>,
  ) => {
    const { error } = await supabaseAdmin
      .from("notices")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) fetchNotices();
    return { error };
  };

  const deleteNotice = async (id: string) => {
    const { error } = await supabaseAdmin.from("notices").delete().eq("id", id);
    if (!error) fetchNotices();
    return { error };
  };

  return {
    notices,
    isLoading,
    error,
    refetch: fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice,
  };
}

export { useAllNotices as useAdminNotices };

export function useAdminChatProfiles() {
  const [profiles, setProfiles] = useState<Tables<"chat_profiles">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabaseAdmin
      .from("chat_profiles")
      .select("*")
      .is("deleted_at", null) // Exclude soft-deleted profiles
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
      setProfiles([]);
    } else {
      setProfiles(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchProfiles();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel("admin-chat-profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_profiles" },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [fetchProfiles]);

  // Helper: sync agents.assigned_profile_ids when profile assignment changes
  const syncAgentProfileIds = async (
    profileId: string,
    newAgentId: string | null,
    oldAgentId?: string | null,
  ) => {
    // Remove from old agent if exists
    if (oldAgentId && oldAgentId !== newAgentId) {
      const { data: oldAgent } = await supabaseAdmin
        .from("agents")
        .select("assigned_profile_ids")
        .eq("id", oldAgentId)
        .single();

      if (oldAgent?.assigned_profile_ids) {
        const updatedIds = (oldAgent.assigned_profile_ids as string[]).filter(
          (id) => id !== profileId,
        );
        await supabaseAdmin
          .from("agents")
          .update({ assigned_profile_ids: updatedIds })
          .eq("id", oldAgentId);
      }
    }

    // Add to new agent if exists
    if (newAgentId) {
      const { data: newAgent } = await supabaseAdmin
        .from("agents")
        .select("assigned_profile_ids")
        .eq("id", newAgentId)
        .single();

      const currentIds = (newAgent?.assigned_profile_ids as string[]) || [];
      if (!currentIds.includes(profileId)) {
        await supabaseAdmin
          .from("agents")
          .update({ assigned_profile_ids: [...currentIds, profileId] })
          .eq("id", newAgentId);
      }
    }
  };

  const createProfile = async (payload: TablesInsert<"chat_profiles">) => {
    setError(null);
    const { data, error } = await supabaseAdmin
      .from("chat_profiles")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      setError(error);
    } else {
      // Sync agent's assigned_profile_ids
      if (data?.id && payload.assigned_agent_id) {
        await syncAgentProfileIds(data.id, payload.assigned_agent_id, null);
      }
      void fetchProfiles();
    }

    return { data, error };
  };

  const updateProfile = async (
    id: string,
    updates: Partial<Tables<"chat_profiles">>,
  ) => {
    setError(null);

    // Get current profile to check if agent assignment changed
    let oldAgentId: string | null = null;
    if ("assigned_agent_id" in updates) {
      const { data: current } = await supabaseAdmin
        .from("chat_profiles")
        .select("assigned_agent_id")
        .eq("id", id)
        .single();
      oldAgentId = current?.assigned_agent_id || null;
    }

    const { error } = await supabaseAdmin
      .from("chat_profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      setError(error);
    } else {
      // Sync agent's assigned_profile_ids if assignment changed
      if ("assigned_agent_id" in updates) {
        await syncAgentProfileIds(
          id,
          updates.assigned_agent_id || null,
          oldAgentId,
        );
      }
      void fetchProfiles();
    }

    return { error };
  };

  const deleteProfile = async (id: string) => {
    setError(null);

    // Always soft delete: set deleted_at timestamp
    // Chat history is always preserved
    const { error } = await supabaseAdmin
      .from("chat_profiles")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        is_online: false,
      })
      .eq("id", id);

    if (error) {
      setError(error);
      return { error };
    }

    void fetchProfiles();
    return { error: null as Error | null };
  };

  return {
    profiles,
    isLoading,
    error,
    refetch: fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}

// Hook for chat rooms (admin)
export function useAllChatRooms() {
  const [rooms, setRooms] = useState<
    (Tables<"chat_rooms"> & {
      user_profiles?: Tables<"user_profiles">;
      chat_profiles?: Tables<"chat_profiles">;
    })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*, user_profiles(*), chat_profiles(*)")
      .order("last_message_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setRooms((data as any) || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchRooms();

    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void fetchRooms();
      }, 250);
    };

    const channel = supabase
      .channel("admin-chat-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_rooms" },
        schedule,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        schedule,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  return { rooms, isLoading, error, refetch: fetchRooms };
}

// Hook for approval logs (admin_action_logs ??)
export function useApprovalLogs() {
  const [logs, setLogs] = useState<Tables<"admin_action_logs">[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);

    // Fetch logs with limit
    const { data, error: fetchError } = await supabaseAdmin
      .from("admin_action_logs")
      .select("*, admins(name)")
      .in("action", [
        "approve_user",
        "reject_user",
        "suspend_user",
        "unsuspend_user",
      ])
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch total count separately
    const { count, error: countError } = await supabaseAdmin
      .from("admin_action_logs")
      .select("*", { count: "exact", head: true })
      .in("action", [
        "approve_user",
        "reject_user",
        "suspend_user",
        "unsuspend_user",
      ]);

    if (fetchError || countError) {
      setError(fetchError || countError);
    } else {
      setLogs(data || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();

    // Real-time subscription for admin_action_logs
    const channel = supabaseAdmin
      .channel("approval-logs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_action_logs",
        },
        (payload: RealtimePostgresPayload) => {
          const action = (payload.new as any)?.action;
          // Only refetch if it's a relevant action type
          if (
            action === "approve_user" ||
            action === "reject_user" ||
            action === "suspend_user" ||
            action === "unsuspend_user"
          ) {
            fetchLogs();
          }
        },
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [fetchLogs]);

  const createLog = async (
    log: Omit<Tables<"admin_action_logs">, "id" | "created_at">,
  ) => {
    const { data, error } = await supabaseAdmin
      .from("admin_action_logs")
      .insert(log)
      .select()
      .single();
    if (!error) fetchLogs();
    return { data, error };
  };

  return { logs, totalCount, isLoading, error, createLog, refetch: fetchLogs };
}

// Hook for dashboard statistics (admin)
export function useDashboardStats(
  period: "today" | "week" | "month" | "custom",
  startDate?: string,
  endDate?: string,
) {
  const requestIdRef = useRef(0);
  const [stats, setStats] = useState({
    newMembers: 0,
    approvedMembers: 0,
    rejectedMembers: 0,
    deposits: 0,
    depositCount: 0,
    withdrawals: 0,
    withdrawalCount: 0,
    totalRolling: 0,
    ladderRolling: 0,
    powerballRolling: 0,
    ladderRevenue: 0,
    powerballRevenue: 0,
    itemPurchase: 0,
    itemPurchaseCount: 0,
    itemRevenue: 0,
    miniGameRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    const now = new Date();
    let fromDate: string;
    let toDate = now.toISOString();

    switch (period) {
      case "today": {
        const today = formatKST(now, "date") || now.toISOString().slice(0, 10);
        fromDate = getStartOfDayKST(today);
        break;
      }
      case "week": {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        const startKey =
          formatKST(start, "date") || start.toISOString().slice(0, 10);
        fromDate = getStartOfDayKST(startKey);
        break;
      }
      case "month": {
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        const startKey =
          formatKST(start, "date") || start.toISOString().slice(0, 10);
        fromDate = getStartOfDayKST(startKey);
        break;
      }
      case "custom": {
        const fallbackStart = new Date();
        fallbackStart.setMonth(fallbackStart.getMonth() - 1);
        const startKey = startDate || formatKST(fallbackStart, "date");
        fromDate = startKey
          ? getStartOfDayKST(startKey)
          : fallbackStart.toISOString();
        toDate = endDate ? getEndOfDayKST(endDate) : new Date().toISOString();
        break;
      }
      default: {
        const today = formatKST(now, "date") || now.toISOString().slice(0, 10);
        fromDate = getStartOfDayKST(today);
      }
    }

    try {
      // Fetch new members count
      const { count: newMembersCount } = await supabaseAdmin
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", fromDate)
        .lte("created_at", toDate);

      // Fetch approved members
      const { count: approvedCount } = await supabaseAdmin
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);

      const { count: rejectedCount } = await supabaseAdmin
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);

      // Fetch deposit transactions
      const { data: depositData } = await supabaseAdmin
        .from("point_transactions")
        .select("amount, type, created_at")
        .eq("type", "charge")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);

      // Fetch approved withdrawal requests
      const { data: withdrawData } = await supabaseAdmin
        .from("withdrawal_requests")
        .select("amount, processed_at")
        .eq("status", "approved")
        .gte("processed_at", fromDate)
        .lte("processed_at", toDate);

      // Fetch game bets
      const { data: gameBets } = await supabaseAdmin
        .from("game_bets")
        .select("bet_amount, win_amount, game_rounds(game_type)")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);

      // Fetch gift purchases
      const { data: giftPurchases } = await supabaseAdmin
        .from("gift_transactions")
        .select("points_amount, transaction_type, created_at")
        .eq("transaction_type", "buy")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);

      // Calculate stats
      const deposits =
        depositData?.reduce(
          (sum: number, t: { amount: number | null }) => sum + (t.amount || 0),
          0,
        ) || 0;
      const withdrawals =
        withdrawData?.reduce(
          (sum: number, t: { amount: number | null }) =>
            sum + Math.abs(t.amount || 0),
          0,
        ) || 0;

      const ladderBets =
        gameBets?.filter((b: any) => b.game_rounds?.game_type === "ladder") ||
        [];
      const powerballBets =
        gameBets?.filter(
          (b: any) => b.game_rounds?.game_type === "powerball",
        ) || [];

      const ladderRolling = ladderBets.reduce(
        (sum: number, b: any) => sum + (b.bet_amount || 0),
        0,
      );
      const powerballRolling = powerballBets.reduce(
        (sum: number, b: any) => sum + (b.bet_amount || 0),
        0,
      );

      const ladderWins = ladderBets.reduce(
        (sum: number, b: any) => sum + (b.win_amount || 0),
        0,
      );
      const powerballWins = powerballBets.reduce(
        (sum: number, b: any) => sum + (b.win_amount || 0),
        0,
      );

      const itemPurchase =
        giftPurchases?.reduce(
          (sum: number, t: { points_amount: number | null }) =>
            sum + (t.points_amount || 0),
          0,
        ) || 0;

      const nextStats = {
        newMembers: newMembersCount || 0,
        approvedMembers: approvedCount || 0,
        rejectedMembers: rejectedCount || 0,
        deposits,
        depositCount: depositData?.length || 0,
        withdrawals,
        withdrawalCount: withdrawData?.length || 0,
        totalRolling: ladderRolling + powerballRolling,
        ladderRolling,
        powerballRolling,
        ladderRevenue: ladderRolling - ladderWins,
        powerballRevenue: powerballRolling - powerballWins,
        itemPurchase,
        itemPurchaseCount: giftPurchases?.length || 0,
        itemRevenue: itemPurchase,
        miniGameRevenue:
          ladderRolling - ladderWins + (powerballRolling - powerballWins),
      };

      if (requestId !== requestIdRef.current) return;
      setStats(nextStats);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err as Error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

export function useAdminUserActions(adminId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const adjustUserPoints = useCallback(
    async (params: {
      userId: string;
      amount: number;
      description?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!adminId) {
          throw new Error("??? ??? ?????.");
        }
        const amount = Math.trunc(params.amount);
        if (!Number.isFinite(amount) || amount === 0) {
          throw new Error("??? ??? ?????.");
        }

        const { data: userRow, error: userError } = await supabaseAdmin
          .from("user_profiles")
          .select("id, points")
          .eq("id", params.userId)
          .single();

        if (userError || !userRow) {
          throw new Error("??? ??? ?? ? ????.");
        }

        const balanceBefore = Number(userRow.points || 0);
        const balanceAfter = balanceBefore + amount;
        if (balanceAfter < 0) {
          throw new Error("??? 0?? ?? ? ????.");
        }

        const { error: addPointsError } = await supabaseAdmin.rpc(
          "add_points",
          {
            p_user_id: params.userId,
            p_amount: amount,
            p_type: "admin_adjust",
            p_reference_id: null,
            p_description:
              params.description ||
              (amount > 0 ? "??? ??" : "??? ??"),
          },
        );
        if (addPointsError) throw addPointsError;

        await supabaseAdmin.from("admin_action_logs").insert({
          action: "adjust_points",
          admin_id: adminId,
          target_id: params.userId,
          target_type: "user_profiles",
          ip_address: null,
          changes: {
            amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            description: params.description || null,
          },
        });

        return { balanceBefore, balanceAfter };
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [adminId],
  );

  const setUserStatus = useCallback(
    async (params: {
      userId: string;
      status: "active" | "suspended";
      reason?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        if (!adminId) {
          throw new Error("??? ??? ?????.");
        }

        // Fetch user info for logging
        const { data: userInfo } = await supabaseAdmin
          .from("user_profiles")
          .select(
            "nickname, name, email, phone, bank, account_number, account_holder, join_ip, created_at",
          )
          .eq("id", params.userId)
          .single();

        // When suspending, also set is_online to false to force logout
        const updateData: Record<string, unknown> = {
          status: params.status,
          updated_at: new Date().toISOString(),
        };

        // If suspending user, set is_online to false
        if (params.status === "suspended") {
          updateData.is_online = false;
        }

        const { error: updateError } = await supabaseAdmin
          .from("user_profiles")
          .update(updateData)
          .eq("id", params.userId);
        if (updateError) throw updateError;

        await supabaseAdmin.from("admin_action_logs").insert({
          action:
            params.status === "suspended" ? "suspend_user" : "unsuspend_user",
          admin_id: adminId,
          target_id: params.userId,
          target_type: "user_profiles",
          ip_address: null,
          changes: {
            status: params.status,
            reason: params.reason || null,
            nickname: userInfo?.nickname || null,
            name: userInfo?.name || null,
            email: userInfo?.email || null,
            phone: userInfo?.phone || null,
            bank: userInfo?.bank || null,
            account_number: userInfo?.account_number || null,
            account_holder: userInfo?.account_holder || null,
            signup_ip: userInfo?.join_ip || null,
            created_at: userInfo?.created_at || null,
          },
        });

        return { status: params.status };
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [adminId],
  );

  const updateUserPassword = useCallback(
    async (params: { userId: string; newPassword: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!adminId) {
          throw new Error("??? ??? ?????.");
        }

        const { data, error: invokeError } =
          await supabaseAdmin.functions.invoke("admin-update-user-password", {
            body: { userId: params.userId, newPassword: params.newPassword },
          });

        // data? ?? ???? ?? ?? (Edge Function? ?? JSON ??)
        if (data?.error) {
          throw new Error(data.error);
        }

        if (invokeError) {
          // Edge Function ???? ?? ???? ??
          let errorMessage = "???? ?? ? ??? ??????.";
          try {
            // FunctionsHttpError? context?? ?? ?? ?? ??
            const ctx = (invokeError as { context?: Response }).context;
            if (ctx) {
              const body = await ctx.json();
              if (body?.error) {
                errorMessage = body.error;
              }
            }
          } catch {
            // context ?? ?? ? message?? ?? ??
            try {
              const match = invokeError.message.match(
                /"error"\s*:\s*"([^"]+)"/,
              );
              if (match) {
                errorMessage = match[1];
              }
            } catch {
              // ?? ?? ? ?? ??? ??
            }
          }
          throw new Error(errorMessage);
        }

        await supabaseAdmin.from("admin_action_logs").insert({
          action: "change_user_password",
          admin_id: adminId,
          target_id: params.userId,
          target_type: "user_profiles",
          ip_address: null,
          changes: { changed: true },
        });

        return data;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [adminId],
  );

  return {
    adjustUserPoints,
    setUserStatus,
    updateUserPassword,
    isLoading,
    error,
  };
}

export function useAdminDashboardData(
  period: "today" | "week" | "month" | "custom",
  startDate?: string,
  endDate?: string,
) {
  const requestIdRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cards, setCards] = useState({
    newMembers: { value: 0, prev: 0 },
    deposits: { value: 0, prev: 0 },
    withdrawals: { value: 0, prev: 0 },
    totalRevenue: { value: 0, prev: 0 },
  });
  const [revenueTrend, setRevenueTrend] = useState<
    { date: string; deposits: number; withdrawals: number }[]
  >([]);
  const [gameBetting, setGameBetting] = useState({ ladder: 0, powerball: 0 });
  const [memberStatus, setMemberStatus] = useState({
    active: 0,
    pending: 0,
    suspended: 0,
    rejected: 0,
  });
  const [recentActivities, setRecentActivities] = useState<
    {
      id: string;
      created_at: string;
      type: string;
      userName: string;
      amount?: number;
      status?: string;
      meta?: string;
    }[]
  >([]);

  const formatDateKey = (iso: string) => {
    const formatted = formatKST(iso, "date");
    if (formatted) return formatted;
    return iso.slice(0, 10);
  };

  const buildDateBuckets = (fromIso: string, toIso: string) => {
    const startKey = formatDateKey(fromIso);
    const endKey = formatDateKey(toIso);
    if (!startKey || !endKey) return [];
    const [sy, sm, sd] = startKey.split("-").map(Number);
    const [ey, em, ed] = endKey.split("-").map(Number);
    const start = new Date(Date.UTC(sy, sm - 1, sd));
    const end = new Date(Date.UTC(ey, em - 1, ed));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    if (start > end) return [];

    const buckets: { date: string; deposits: number; withdrawals: number }[] =
      [];
    const cursor = new Date(start);
    while (cursor <= end) {
      buckets.push({
        date: formatDateKey(cursor.toISOString()),
        deposits: 0,
        withdrawals: 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return buckets;
  };

  const calcPrevRange = (fromIso: string, toIso: string) => {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    const diff = Math.max(0, to.getTime() - from.getTime());
    const prevTo = new Date(from.getTime());
    const prevFrom = new Date(from.getTime() - diff);
    return {
      prevFromIso: prevFrom.toISOString(),
      prevToIso: prevTo.toISOString(),
    };
  };

  const resolveRange = () => {
    const now = new Date();
    let fromDate: string;
    let toDate = now.toISOString();

    switch (period) {
      case "today": {
        const today = formatKST(now, "date") || now.toISOString().slice(0, 10);
        fromDate = getStartOfDayKST(today);
        break;
      }
      case "week": {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        const startKey =
          formatKST(start, "date") || start.toISOString().slice(0, 10);
        fromDate = getStartOfDayKST(startKey);
        break;
      }
      case "month": {
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        const startKey =
          formatKST(start, "date") || start.toISOString().slice(0, 10);
        fromDate = getStartOfDayKST(startKey);
        break;
      }
      case "custom": {
        const fallbackStart = new Date();
        fallbackStart.setMonth(fallbackStart.getMonth() - 1);
        const startKey = startDate || formatKST(fallbackStart, "date");
        fromDate = startKey
          ? getStartOfDayKST(startKey)
          : fallbackStart.toISOString();
        toDate = endDate ? getEndOfDayKST(endDate) : new Date().toISOString();
        break;
      }
      default: {
        const today = formatKST(now, "date") || now.toISOString().slice(0, 10);
        fromDate = getStartOfDayKST(today);
      }
    }

    const { prevFromIso, prevToIso } = calcPrevRange(fromDate, toDate);
    return { fromDate, toDate, prevFromIso, prevToIso };
  };

  const fetchDashboard = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const { fromDate, toDate, prevFromIso, prevToIso } = resolveRange();

      const [
        newMembersNow,
        newMembersPrev,
        depositTxNow,
        depositTxPrev,
        withdrawalsNowData,
        withdrawalsPrevData,
        memberActive,
        memberPending,
        memberSuspended,
        memberRejected,
      ] = await Promise.all([
        supabaseAdmin
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        supabaseAdmin
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", prevFromIso)
          .lte("created_at", prevToIso),
        supabaseAdmin
          .from("point_transactions")
          .select("type, amount, created_at")
          .eq("type", "charge")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        supabaseAdmin
          .from("point_transactions")
          .select("type, amount, created_at")
          .eq("type", "charge")
          .gte("created_at", prevFromIso)
          .lte("created_at", prevToIso),
        supabaseAdmin
          .from("withdrawal_requests")
          .select("amount, processed_at")
          .eq("status", "approved")
          .gte("processed_at", fromDate)
          .lte("processed_at", toDate),
        supabaseAdmin
          .from("withdrawal_requests")
          .select("amount, processed_at")
          .eq("status", "approved")
          .gte("processed_at", prevFromIso)
          .lte("processed_at", prevToIso),
        supabaseAdmin
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabaseAdmin
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabaseAdmin
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "suspended"),
        supabaseAdmin
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejected"),
      ]);

      if (newMembersNow.error) throw newMembersNow.error;
      if (newMembersPrev.error) throw newMembersPrev.error;
      if (depositTxNow.error) throw depositTxNow.error;
      if (depositTxPrev.error) throw depositTxPrev.error;
      if (withdrawalsNowData.error) throw withdrawalsNowData.error;
      if (withdrawalsPrevData.error) throw withdrawalsPrevData.error;
      if (memberActive.error) throw memberActive.error;
      if (memberPending.error) throw memberPending.error;
      if (memberSuspended.error) throw memberSuspended.error;
      if (memberRejected.error) throw memberRejected.error;

      const depositsNow = (depositTxNow.data || []).reduce(
        (sum: number, t: any) => sum + Number(t.amount || 0),
        0,
      );
      const withdrawalsNow = (withdrawalsNowData.data || []).reduce(
        (sum: number, w: any) => sum + Number(w.amount || 0),
        0,
      );

      const depositsPrev = (depositTxPrev.data || []).reduce(
        (sum: number, t: any) => sum + Number(t.amount || 0),
        0,
      );
      const withdrawalsPrev = (withdrawalsPrevData.data || []).reduce(
        (sum: number, w: any) => sum + Number(w.amount || 0),
        0,
      );

      const totalRevenueNow = depositsNow - withdrawalsNow;
      const totalRevenuePrev = depositsPrev - withdrawalsPrev;

      const nextCards = {
        newMembers: {
          value: Number(newMembersNow.count ?? 0),
          prev: Number(newMembersPrev.count ?? 0),
        },
        deposits: { value: depositsNow, prev: depositsPrev },
        withdrawals: { value: withdrawalsNow, prev: withdrawalsPrev },
        totalRevenue: { value: totalRevenueNow, prev: totalRevenuePrev },
      };

      const days = buildDateBuckets(fromDate, toDate);
      const [trendDepositRes, trendWithdrawRes] = await Promise.all([
        supabaseAdmin
          .from("point_transactions")
          .select("amount, created_at")
          .eq("type", "charge")
          .gte("created_at", fromDate)
          .lte("created_at", toDate),
        supabaseAdmin
          .from("withdrawal_requests")
          .select("amount, processed_at")
          .eq("status", "approved")
          .gte("processed_at", fromDate)
          .lte("processed_at", toDate),
      ]);

      if (trendDepositRes.error) throw trendDepositRes.error;
      if (trendWithdrawRes.error) throw trendWithdrawRes.error;

      const byDate = new Map(
        days.map((d) => [d.date, { deposits: 0, withdrawals: 0 }]),
      );
      (trendDepositRes.data || []).forEach((t: any) => {
        if (!t.created_at) return;
        const key = formatDateKey(t.created_at);
        const bucket = byDate.get(key);
        if (bucket) bucket.deposits += Number(t.amount || 0);
      });
      (trendWithdrawRes.data || []).forEach((w: any) => {
        if (!w.processed_at) return;
        const key = formatDateKey(w.processed_at);
        const bucket = byDate.get(key);
        if (bucket) bucket.withdrawals += Number(w.amount || 0);
      });
      const nextRevenueTrend = days.map((d) => {
        const b = byDate.get(d.date) || { deposits: 0, withdrawals: 0 };
        return {
          date: d.date,
          deposits: b.deposits,
          withdrawals: b.withdrawals,
        };
      });

      const { data: gameBets, error: gameBetsErr } = await supabaseAdmin
        .from("game_bets")
        .select("bet_amount, created_at, game_rounds(game_type)")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);

      if (gameBetsErr) throw gameBetsErr;
      const ladder = (gameBets || [])
        .filter((b: any) => b.game_rounds?.game_type === "ladder")
        .reduce((sum: number, b: any) => sum + Number(b.bet_amount || 0), 0);
      const powerball = (gameBets || [])
        .filter((b: any) => b.game_rounds?.game_type === "powerball")
        .reduce((sum: number, b: any) => sum + Number(b.bet_amount || 0), 0);
      const nextGameBetting = { ladder, powerball };

      const nextMemberStatus = {
        active: Number(memberActive.count ?? 0),
        pending: Number(memberPending.count ?? 0),
        suspended: Number(memberSuspended.count ?? 0),
        rejected: Number(memberRejected.count ?? 0),
      };

      const [recentUsers, recentPoints, recentBets, recentMemberActions] =
        await Promise.all([
          supabaseAdmin
            .from("user_profiles")
            .select("id, name, nickname, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
          supabaseAdmin
            .from("point_transactions")
            .select(
              "id, type, amount, created_at, users:user_profiles(name, nickname)",
            )
            .order("created_at", { ascending: false })
            .limit(10),
          supabaseAdmin
            .from("game_bets")
            .select(
              "id, bet_amount, bet_type, status, win_amount, created_at, users:user_profiles(name, nickname), game_rounds(game_type, round_number)",
            )
            .order("created_at", { ascending: false })
            .limit(20),
          supabaseAdmin
            .from("admin_action_logs")
            .select("id, action, created_at, target_id, target_type")
            .in("action", [
              "approve_user",
              "reject_user",
              "suspend_user",
              "unsuspend_user",
            ])
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      if (recentUsers.error) throw recentUsers.error;
      if (recentPoints.error) throw recentPoints.error;
      if (recentBets.error) throw recentBets.error;
      if (recentMemberActions.error) throw recentMemberActions.error;

      // ?? ??/??? ??? ID ?? (?? ???)
      const memberActionUserIds = new Set(
        (recentMemberActions.data || [])
          .filter((a: any) => a.target_type === "user_profiles")
          .map((a: any) => a.target_id),
      );

      // ??/??? ??? ?? ??
      const memberActionUsers: Record<
        string,
        { name?: string; nickname?: string }
      > = {};
      if (memberActionUserIds.size > 0) {
        const { data: users } = await supabaseAdmin
          .from("user_profiles")
          .select("id, name, nickname")
          .in("id", Array.from(memberActionUserIds));
        (users || []).forEach((u: any) => {
          memberActionUsers[u.id] = { name: u.name, nickname: u.nickname };
        });
      }

      const activities: any[] = [];

      // ?? ??/??/??/???? ?? ??
      const memberActionLabels: Record<string, string> = {
        approve_user: "???? ??",
        reject_user: "???? ??",
        suspend_user: "?? ??",
        unsuspend_user: "?? ????",
      };
      (recentMemberActions.data || []).forEach((a: any) => {
        if (a.target_type !== "user_profiles") return;
        const user = memberActionUsers[a.target_id] || {};
        const userName = user.nickname || user.name || "-";
        const actionLabel = memberActionLabels[a.action] || a.action;
        activities.push({
          id: `member_action:${a.id}`,
          created_at: a.created_at,
          type: a.action,
          userName,
          meta: actionLabel,
        });
      });

      // ?? ???? (??/???? ?? ?? ????)
      (recentUsers.data || []).forEach((u: any) => {
        if (memberActionUserIds.has(u.id)) return; // ?? ??/?? ???? ???
        activities.push({
          id: `signup:${u.id}`,
          created_at: u.created_at,
          type: "signup",
          userName: u.nickname || u.name || "-",
          meta: "???? ??",
        });
      });
      (recentPoints.data || []).forEach((p: any) => {
        // bet, win, lose ??? game_bets?? ????? ??
        // lose? ?? ? ?? ??????? ?? ?? ??
        if (p.type === "bet" || p.type === "win" || p.type === "lose") return;

        const userName = p.users?.nickname || p.users?.name || "-";
        const typeLabels: Record<string, string> = {
          charge: "?? ??",
          withdraw: "?? ??",
          withdraw_pending: "?? ?? (??)",
          withdraw_refund: "?? ?? (??)",
          admin_adjust: "??? ??",
          bonus: "??? ??",
          chat_start: "?? ??",
          gift_buy: "?? ??",
          gift_sell: "?? ??",
        };
        activities.push({
          id: `point:${p.id}`,
          created_at: p.created_at,
          type: p.type,
          userName,
          amount: Number(p.amount || 0),
          meta: typeLabels[p.type] || p.type,
        });
      });
      (recentBets.data || []).forEach((b: any) => {
        const userName = b.users?.nickname || b.users?.name || "-";
        const gameType =
          b.game_rounds?.game_type === "ladder" ? "???" : "???";
        const betAmount = Number(b.bet_amount || 0);
        const winAmount = Number(b.win_amount || 0);

        // ?? ?? (??? ??? ??)
        activities.push({
          id: `bet:${b.id}`,
          created_at: b.created_at,
          type: "bet",
          userName,
          amount: -betAmount,
          meta: `${gameType} ??`,
        });

        // ?? ? ?? ?? ??
        if (b.status === "won" && winAmount > 0) {
          activities.push({
            id: `bet_win:${b.id}`,
            created_at: b.created_at,
            type: "bet_win",
            userName,
            amount: winAmount,
            meta: `${gameType} ?? ??`,
          });
        }
      });

      // ?? ????: 1) ?? ????, 2) ?? ??? ? bet_win? bet?? ?? (?? ? ?? ?)
      const typeOrder: Record<string, number> = { bet_win: 0, bet: 1 };
      activities.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (tb !== ta) return tb - ta;
        // ?? ??? ?: bet_win? bet?? ?? ?? (???? ???? ?? ? ??)
        const orderA = typeOrder[a.type] ?? 2;
        const orderB = typeOrder[b.type] ?? 2;
        return orderA - orderB;
      });
      const nextActivities = activities.slice(0, 10);

      if (requestId !== requestIdRef.current) return;
      setCards(nextCards);
      setRevenueTrend(nextRevenueTrend);
      setGameBetting(nextGameBetting);
      setMemberStatus(nextMemberStatus);
      setRecentActivities(nextActivities);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err as Error);
      setCards({
        newMembers: { value: 0, prev: 0 },
        deposits: { value: 0, prev: 0 },
        withdrawals: { value: 0, prev: 0 },
        totalRevenue: { value: 0, prev: 0 },
      });
      setRevenueTrend([]);
      setGameBetting({ ladder: 0, powerball: 0 });
      setMemberStatus({ active: 0, pending: 0, suspended: 0, rejected: 0 });
      setRecentActivities([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [endDate, period, startDate]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  return {
    cards,
    revenueTrend,
    gameBetting,
    memberStatus,
    recentActivities,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}

export function useReferralCodeValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateCode = async (
    code: string,
  ): Promise<{ valid: boolean; agentId?: string }> => {
    if (!code) return { valid: false };

    setIsValidating(true);
    const normalized = code.trim().toUpperCase();

    const { data, error } = await supabase.functions.invoke(
      "validate-referral-code",
      {
        body: { referralCode: normalized },
      },
    );

    setIsValidating(false);

    if (error || !data || typeof (data as any).valid !== "boolean") {
      return { valid: false };
    }

    if (!(data as any).valid) {
      return { valid: false };
    }

    return {
      valid: true,
      agentId:
        typeof (data as any).agentId === "string"
          ? (data as any).agentId
          : undefined,
    };
  };

  return { validateCode, isValidating };
}

// Helper function to get client IP address
async function getClientIp(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (response.ok) {
      const data = await response.json();
      return data.ip || "";
    }
  } catch {
    // Fallback: try alternative IP API
    try {
      const fallback = await fetch("https://ipapi.co/ip/");
      if (fallback.ok) {
        return (await fallback.text()).trim();
      }
    } catch {
      // Ignore errors
    }
  }
  return "";
}

export function useUserRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = async (input: {
    email: string;
    password: string;
    name: string;
    nickname: string;
    phone?: string;
    bank?: string;
    accountNumber?: string;
    accountHolder?: string;
    referralCode?: string;
    referredBy?: string;
  }) => {
    setIsRegistering(true);
    setError(null);

    try {
      // Get client IP address for join_ip
      const clientIp = await getClientIp();
      const normalizedPhone = input.phone?.trim() || "";
      const normalizedPhoneDigits = normalizedPhone.replace(/\D/g, "");

      if (normalizedPhoneDigits) {
        const { data: isDuplicate, error: phoneError } = await supabase.rpc(
          "check_phone_duplicate",
          {
            p_phone: normalizedPhone,
          },
        );

        if (phoneError) {
          throw phoneError;
        }

        if (isDuplicate) {
          const message = "?? ??? ????? ???.";
          setError(message);
          setIsRegistering(false);
          return { success: false, error: message };
        }
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("????? ??????");
      }

      const profileInsert: TablesInsert<"user_profiles"> = {
        id: data.user.id,
        email: input.email,
        name: input.name,
        nickname: input.nickname,
        phone: normalizedPhone || null,
        bank: input.bank || null,
        account_number: input.accountNumber || null,
        account_holder: input.accountHolder || null,
        status: "pending",
        agent_id: input.referredBy || null,
        join_ip: clientIp || null,
      };

      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert(profileInsert);

      if (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }

      await supabase.auth.signOut();

      setIsRegistering(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "???? ??";
      setError(message);
      setIsRegistering(false);
      return { success: false, error: message };
    }
  };

  return { registerUser, isRegistering, error };
}

export function useAgentMembers(agentId: string | undefined) {
  const [members, setMembers] = useState<Tables<"user_profiles">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!agentId) {
      setMembers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: agentRow, error: agentError } = await supabaseAdmin
        .from("agents")
        .select("referral_code")
        .eq("id", agentId)
        .maybeSingle();

      if (agentError) throw agentError;

      const referralCode = agentRow?.referral_code || "";

      // Only fetch current members assigned to this agent
      // Historical members are handled separately in useAgentDashboardStats for revenue calculation
      const { data: currentMembers, error: membersError } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      // Fetch financial data for all members
      const memberIds = (currentMembers || []).map((m: any) => m.id);

      let depositsByUser: Record<string, number> = {};
      let withdrawalsByUser: Record<string, number> = {};

      if (memberIds.length > 0) {
        // Fetch charge transactions (deposits) - using point_transactions with type 'charge'
        const { data: chargeData } = await supabaseAdmin
          .from("point_transactions")
          .select("user_id, amount")
          .in("user_id", memberIds)
          .eq("type", "charge");

        // Fetch approved withdrawals
        const { data: withdrawalData } = await supabaseAdmin
          .from("withdrawal_requests")
          .select("user_id, amount")
          .in("user_id", memberIds)
          .eq("status", "approved");

        // Aggregate deposits by user
        (chargeData || []).forEach((tx: any) => {
          const userId = tx.user_id;
          const amount = Number(tx.amount || 0);
          depositsByUser[userId] = (depositsByUser[userId] || 0) + amount;
        });

        // Aggregate withdrawals by user
        (withdrawalData || []).forEach((tx: any) => {
          const userId = tx.user_id;
          const amount = Number(tx.amount || 0);
          withdrawalsByUser[userId] = (withdrawalsByUser[userId] || 0) + amount;
        });
      }

      const members = (currentMembers || []).map((member: any) => ({
        ...member,
        agents: { referral_code: referralCode },
        total_deposited: depositsByUser[member.id] || 0,
        total_withdrawn: withdrawalsByUser[member.id] || 0,
      }));

      setMembers(members);
    } catch (fetchError) {
      setError(fetchError as Error);
      setMembers([]);
    }

    setIsLoading(false);
  }, [agentId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!agentId) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchMembers();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel(`agent-members-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
          filter: `agent_id=eq.${agentId}`,
        },
        () => scheduleRefetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "point_transactions",
        },
        () => scheduleRefetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
        },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [agentId, fetchMembers]);

  useEffect(() => {
    if (!agentId) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchMembers();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel(`agent-members-history-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_action_logs",
          filter: "action=eq.change_user_referral_code",
        },
        (payload: RealtimePostgresPayload) => {
          const record = (payload.new || payload.old) as any;
          const changes = record?.changes as any;
          if (
            changes?.fromAgentId !== agentId &&
            changes?.toAgentId !== agentId
          ) {
            return;
          }
          scheduleRefetch();
        },
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [agentId, fetchMembers]);

  return { members, isLoading, error, refetch: fetchMembers };
}

export function useAgentChatProfiles(agentId: string | undefined) {
  const [profiles, setProfiles] = useState<Tables<"chat_profiles">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!agentId) {
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("chat_profiles")
      .select("*")
      .eq("assigned_agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error);
    } else {
      setProfiles(data || []);
    }
    setIsLoading(false);
  }, [agentId]);

  useEffect(() => {
    void fetchProfiles();

    if (!agentId) return;

    const channelSuffix = crypto.randomUUID();
    const channel = supabase
      .channel(`agent-chat-profiles-${agentId}-${channelSuffix}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_profiles",
          filter: `assigned_agent_id=eq.${agentId}`,
        },
        () => {
          void fetchProfiles();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfiles]);

  const updateProfileOnline = async (profileId: string, isOnline: boolean) => {
    const { error } = await supabase
      .from("chat_profiles")
      .update({ is_online: isOnline })
      .eq("id", profileId)
      .eq("assigned_agent_id", agentId || "");

    if (error) {
      setError(error);
      return { error };
    }

    await fetchProfiles();
    return { error: null as Error | null };
  };

  return {
    profiles,
    isLoading,
    error,
    refetch: fetchProfiles,
    updateProfileOnline,
  };
}

export function useAgentChatRooms(agentId: string | undefined) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profileIds, setProfileIds] = useState<string[]>([]);

  const fetchRooms = useCallback(async () => {
    if (!agentId) {
      setRooms([]);
      setProfileIds([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("chat_profiles")
      .select("id")
      .eq("assigned_agent_id", agentId);

    if (profilesError) {
      setError(profilesError);
      setRooms([]);
      setProfileIds([]);
      setIsLoading(false);
      return;
    }

    const pIds = ((profiles || []) as Array<{ id: string }>).map((p) => p.id);
    setProfileIds(pIds);

    if (pIds.length === 0) {
      setRooms([]);
      setIsLoading(false);
      return;
    }

    const { data: roomsData, error: roomsError } = await supabaseAdmin
      .from("chat_rooms")
      .select(
        "id, user_id, profile_id, status, last_message, last_message_at, last_message_sender_type, is_active, unread_count, profile_unread_count, user_gifts_count, user_gifts_value, profile_gifts_count, profile_gifts_value, created_at, chat_profiles(*)",
      )
      .in("profile_id", pIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (roomsError) {
      setError(roomsError);
      setRooms([]);
      setIsLoading(false);
      return;
    }

    // Fetch user profiles using RPC function that bypasses RLS
    const userIds = [
      ...new Set((roomsData || []).map((r: any) => r.user_id).filter(Boolean)),
    ];
    let usersMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: usersData } = await supabaseAdmin.rpc(
        "get_chat_room_user_profiles",
        { user_ids: userIds },
      );

      (usersData || []).forEach((u: any) => {
        if (u?.id) usersMap.set(u.id, u);
      });
    }

    // Merge user data into rooms
    const mergedRooms = (roomsData || []).map((room: any) => ({
      ...room,
      users: usersMap.get(room.user_id) || null,
    }));

    setRooms(mergedRooms);
    setIsLoading(false);
  }, [agentId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Polling for chat_rooms updates (more reliable than real-time for agent view)
  // Poll every 1.5 seconds for near-realtime experience
  useEffect(() => {
    if (!agentId || profileIds.length === 0) return;

    const pollInterval = setInterval(() => {
      fetchRooms();
    }, 1500);

    return () => {
      clearInterval(pollInterval);
    };
  }, [agentId, profileIds.length, fetchRooms]);

  // Real-time subscription for chat_rooms changes (last_message, profile_unread_count)
  useEffect(() => {
    if (profileIds.length === 0) return;

    const channel = supabase
      .channel(`agent-chat-rooms-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
        },
        (payload: RealtimePostgresPayload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Check if this room belongs to one of the agent's profiles
          const roomProfileId = newRecord?.profile_id || oldRecord?.profile_id;
          if (!profileIds.includes(roomProfileId)) return;

          if (payload.eventType === "INSERT") {
            // Refetch to get full room data with joins
            fetchRooms();
          } else if (payload.eventType === "UPDATE") {
            // Update the room in place
            setRooms((prev) =>
              prev
                .map((room) => {
                  if (room.id === newRecord.id) {
                    return {
                      ...room,
                      last_message: newRecord.last_message,
                      last_message_at: newRecord.last_message_at,
                      last_message_sender_type:
                        newRecord.last_message_sender_type,
                      profile_unread_count: newRecord.profile_unread_count,
                      unread_count: newRecord.unread_count,
                    };
                  }
                  return room;
                })
                .sort((a, b) => {
                  const aTime = a.last_message_at
                    ? new Date(a.last_message_at).getTime()
                    : 0;
                  const bTime = b.last_message_at
                    ? new Date(b.last_message_at).getTime()
                    : 0;
                  return bTime - aTime;
                }),
            );
          } else if (payload.eventType === "DELETE") {
            setRooms((prev) => prev.filter((room) => room.id !== oldRecord.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileIds, agentId, fetchRooms]);

  return { rooms, isLoading, error, refetch: fetchRooms };
}

// Hook for agent's gift transactions
export function useAgentGiftTransactions(agentId: string | undefined) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!agentId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Get agent's profiles (including soft-deleted ones to preserve history)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("chat_profiles")
      .select("id, name, deleted_at")
      .eq("assigned_agent_id", agentId);

    if (profilesError) {
      setError(profilesError);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    if (!profiles || profiles.length === 0) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const typedProfiles = profiles as Array<{ id: string; name: string | null }>;
    const profileIds = typedProfiles.map((p) => p.id);

    // Get gift transactions involving agent's profiles (pagination to avoid truncation)
    const pageSize = 1000;
    const maxRows = 20000;
    const all: any[] = [];
    for (let from = 0; from < maxRows; from += pageSize) {
      const { data, error } = await supabaseAdmin
        .from("gift_transactions")
        .select("*, gifts(*)")
        .or(
          `and(receiver_type.eq.profile,receiver_id.in.(${profileIds.join(
            ",",
          )})),and(sender_type.eq.profile,sender_id.in.(${profileIds.join(
            ",",
          )}))`,
        )
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        setError(error);
        break;
      }

      const rows = data || [];
      all.push(...rows);
      if (rows.length < pageSize) break;
    }

    if (all.length === 0) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const userIds = Array.from(
      new Set(
        all.flatMap((t: any) => {
          const ids: string[] = [];
          if (t.sender_type === "user" && t.sender_id) ids.push(t.sender_id);
          if (t.receiver_type === "user" && t.receiver_id)
            ids.push(t.receiver_id);
          return ids;
        }),
      ),
    );

    let userMap = new Map<
      string,
      { name: string | null; nickname: string | null }
    >();

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from("user_profiles")
        .select("id, name, nickname")
        .in("id", userIds);

      if (!usersError) {
        userMap = new Map(
          (usersData || []).map((u: any) => [
            u.id,
            { name: u.name || null, nickname: u.nickname || null },
          ]),
        );
      }
    }

    // Map profile names to transactions
    const profileMap = new Map(
      typedProfiles.map((p) => [p.id, p.name || "Unknown"]),
    );

    const mappedData = all.map((t: any) => {
      const userId =
        t.sender_type === "user"
          ? t.sender_id
          : t.receiver_type === "user"
            ? t.receiver_id
            : null;

      const userInfo = userId ? userMap.get(userId) : null;

      return {
        ...t,
        users: userInfo
          ? { name: userInfo.name, nickname: userInfo.nickname }
          : null,
        profileName:
          (t.receiver_type === "profile"
            ? profileMap.get(t.receiver_id)
            : null) ||
          (t.sender_type === "profile" ? profileMap.get(t.sender_id) : null) ||
          "Unknown",
      };
    });
    setTransactions(mappedData);
    setIsLoading(false);
  }, [agentId]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, error, refetch: fetchTransactions };
}

// Hook for agent dashboard stats
export function useAgentDashboardStats(agentId: string | undefined) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    todayRevenue: 0,
    totalMembers: 0,
    currentMembers: 0,
    activeMembers: 0,
    assignedProfiles: 0,
    onlineProfiles: 0,
    referralCode: "",
    newMembersThisMonth: 0,
    chatRevenueTotal: 0,
    chatRevenueMonth: 0,
  });
  const [members, setMembers] = useState<any[]>([]);
  const [revenueRecords, setRevenueRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!agentId) {
      setStats({
        totalRevenue: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        todayRevenue: 0,
        totalMembers: 0,
        currentMembers: 0,
        activeMembers: 0,
        assignedProfiles: 0,
        onlineProfiles: 0,
        referralCode: "",
        newMembersThisMonth: 0,
        chatRevenueTotal: 0,
        chatRevenueMonth: 0,
      });
      setMembers([]);
      setRevenueRecords([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get agent info (use supabaseAdmin to bypass RLS)
      const { data: agentData } = await supabaseAdmin
        .from("agents")
        .select("referral_code")
        .eq("id", agentId)
        .single();

      const referralCode = agentData?.referral_code || "";

      const { data: assignedProfilesRows, error: profilesError } =
        await supabaseAdmin
          .from("chat_profiles")
          .select("id, is_online")
          .eq("assigned_agent_id", agentId)
          .eq("is_active", true);
      if (profilesError) throw profilesError;

      const profileIds = (assignedProfilesRows || []).map((p: any) => p.id);
      const onlineProfiles = (assignedProfilesRows || []).filter(
        (p: any) => p.is_online,
      ).length;

      // Get members currently assigned to this agent
      const { data: currentMembers, error: membersError } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("agent_id", agentId);

      if (membersError) throw membersError;

      // Fetch referral code change logs using RPC function (bypasses RLS)
      let historyLogs: any[] = [];
      const { data: rpcLogs, error: historyError } = await supabaseAdmin.rpc(
        "get_agent_referral_code_logs",
        { p_agent_id: agentId },
      );

      if (historyError) {
        console.warn(
          "Failed to fetch referral code logs via RPC:",
          historyError,
        );
      } else {
        historyLogs = rpcLogs || [];
      }

      const currentIds = new Set(
        (currentMembers || []).map((member: any) => member.id),
      );
      // Get user IDs from logs where this agent was the FROM agent (user left this agent)
      const historyIds = historyLogs
        .filter((log: any) => (log.changes as any)?.fromAgentId === agentId)
        .map(
          (log: any) =>
            (log.target_id as string | null) ??
            ((log.changes as any)?.userId as string | null),
        )
        .filter((id: any): id is string => Boolean(id));

      const missingIds = historyIds.filter((id) => !currentIds.has(id));
      let historicalMembers: any[] = [];

      if (missingIds.length > 0) {
        const { data: historyMembers, error: historyMembersError } =
          await supabaseAdmin
            .from("user_profiles")
            .select("*")
            .in("id", missingIds);

        if (historyMembersError) throw historyMembersError;
        historicalMembers = historyMembers || [];
      }

      const mergedMap = new Map<string, any>();
      [...(currentMembers || []), ...historicalMembers].forEach((member) => {
        if (member?.id) mergedMap.set(member.id, member);
      });

      const membersList = Array.from(mergedMap.values()).map((member: any) => ({
        ...member,
        referral_code: referralCode || "",
      }));
      setMembers(membersList);

      const historyLogsByUser = new Map<string, any[]>();
      (historyLogs || []).forEach((log: any) => {
        const userId =
          (log.target_id as string | null) ??
          ((log.changes as any)?.userId as string | null);
        if (!userId) return;
        const existing = historyLogsByUser.get(userId) || [];
        existing.push(log);
        historyLogsByUser.set(userId, existing);
      });

      const memberAssignmentWindows = new Map<
        string,
        { start: Date | null; end: Date | null }[]
      >();
      membersList.forEach((member: any) => {
        const logs = (historyLogsByUser.get(member.id) || []).slice();
        logs.sort((a: any, b: any) => {
          const aTime = (a.changes as any)?.toAssignedAt || a.created_at || "";
          const bTime = (b.changes as any)?.toAssignedAt || b.created_at || "";
          return new Date(aTime).getTime() - new Date(bTime).getTime();
        });

        const windows: { start: Date | null; end: Date | null }[] = [];

        // Build windows from assignment history logs
        // Each log where fromAgentId === agentId represents when user LEFT this agent
        logs.forEach((log: any) => {
          const changes = log.changes as any;
          if (changes?.fromAgentId !== agentId) return;
          // Window: from when user was assigned to this agent until they left
          const startValue = changes?.fromAssignedAt;
          const endValue = changes?.toAssignedAt || log.created_at;
          const start = startValue ? new Date(startValue) : null;
          const end = endValue ? new Date(endValue) : null;
          // Even if start is null (user was always with this agent), include the window
          windows.push({ start, end });
        });

        // If user is currently assigned to this agent, add open-ended window
        if (member.agent_id === agentId) {
          const start = member.agent_assigned_at
            ? new Date(member.agent_assigned_at)
            : null;
          windows.push({ start, end: null });
        }

        memberAssignmentWindows.set(member.id, windows);
      });

      // Check if a transaction date falls within any assignment window for the user
      const isWithinAssignmentWindow = (userId: string, date: Date) => {
        const windows = memberAssignmentWindows.get(userId) || [];
        // If no windows defined, include all transactions (defensive fallback)
        if (windows.length === 0) return true;
        return windows.some((window) => {
          // If start is null, treat as beginning of time
          const afterStart = window.start ? date >= window.start : true;
          // If end is null, treat as end of time (current assignment)
          const beforeEnd = window.end ? date < window.end : true;
          return afterStart && beforeEnd;
        });
      };

      const profileCount = profileIds.length;

      // Calculate revenue from members' point transactions
      const memberIds = membersList.map((m) => m.id);

      if (memberIds.length > 0) {
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const newMembersThisMonth = (membersList || []).filter((m: any) => {
          if (!m.created_at) return false;
          return new Date(m.created_at) >= monthStart;
        }).length;

        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let weeklyRevenue = 0;
        let todayRevenue = 0;

        // Fetch transactions using RPC function (bypasses RLS for historical members)
        const { data: txData, error: txErr } = await supabaseAdmin.rpc(
          "get_agent_member_transactions",
          { p_member_ids: memberIds, p_types: ["charge", "withdraw"] },
        );

        if (txErr) throw txErr;

        // Map RPC result to expected format
        const allTx = (txData || []).map((t: any) => ({
          ...t,
          users: { name: t.user_name, nickname: t.user_nickname },
        }));

        // Filter transactions to only include those during the assignment window
        const filteredTx = (allTx || []).filter((t: any) => {
          if (!t.user_id) return false;
          const txDate = new Date(t.created_at || Date.now());
          return isWithinAssignmentWindow(t.user_id, txDate);
        });

        const pageSize = 1000;
        const maxRows = 20000;
        const withdrawalRows: any[] = [];
        for (let from = 0; from < maxRows; from += pageSize) {
          const { data: page, error: wErr } = await supabaseAdmin
            .from("withdrawal_requests")
            .select("id, user_id, amount, processed_at, created_at")
            .in("user_id", memberIds)
            .eq("status", "approved")
            .order("processed_at", { ascending: false })
            .range(from, from + pageSize - 1);

          if (wErr) throw wErr;
          const rows = page || [];
          withdrawalRows.push(...rows);
          if (rows.length < pageSize) break;
        }

        const existingWithdrawalIds = new Set(
          filteredTx
            .filter(
              (t: any) =>
                t.type === "withdraw" &&
                t.related_type === "withdrawal_request" &&
                t.related_id,
            )
            .map((t: any) => t.related_id as string),
        );
        const existingWithdrawalKeys = new Set(
          filteredTx
            .filter((t: any) => t.type === "withdraw")
            .map((t: any) => {
              const day = (t.created_at || "").split("T")[0] || "";
              return `${t.user_id}:${Math.abs(Number(t.amount || 0))}:${day}`;
            }),
        );
        const memberNameMap = new Map(
          membersList.map((m: any) => [
            m.id,
            { name: m.name, nickname: m.nickname },
          ]),
        );

        const supplementalWithdrawals = withdrawalRows
          .filter((row: any) => {
            if (existingWithdrawalIds.has(row.id)) return false;
            const day = (row.processed_at || row.created_at || "").split(
              "T",
            )[0];
            const key = `${row.user_id}:${Math.abs(Number(row.amount || 0))}:${day}`;
            if (existingWithdrawalKeys.has(key)) return false;
            const txDate = new Date(
              row.processed_at || row.created_at || Date.now(),
            );
            if (!isWithinAssignmentWindow(row.user_id, txDate)) {
              return false;
            }
            return true;
          })
          .map((row: any) => {
            const names = memberNameMap.get(row.user_id) || {
              name: null,
              nickname: null,
            };
            return {
              id: `withdrawal-${row.id}`,
              user_id: row.user_id,
              type: "withdraw",
              amount: -Math.abs(Number(row.amount || 0)),
              created_at: row.processed_at || row.created_at,
              related_id: row.id,
              related_type: "withdrawal_request",
              users: names,
            };
          });

        const mergedTx = [...filteredTx, ...supplementalWithdrawals].sort(
          (a: any, b: any) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
          },
        );

        mergedTx.forEach((t: any) => {
          const rawAmount = Number(t.amount || 0);
          const amount = t.type === "charge" ? rawAmount : -Math.abs(rawAmount);
          const date = new Date(t.created_at || Date.now());

          totalRevenue += amount;
          if (date >= monthAgo) monthlyRevenue += amount;
          if (date >= weekAgo) weeklyRevenue += amount;
          if (date >= today) todayRevenue += amount;
        });

        // Only show filtered transactions in revenue records
        setRevenueRecords(mergedTx);

        let chatRevenueTotal = 0;
        let chatRevenueMonth = 0;
        if (profileIds.length > 0) {
          const allGiftTx: any[] = [];
          for (let from = 0; from < maxRows; from += pageSize) {
            const { data: page, error: gtErr } = await supabase
              .from("gift_transactions")
              .select(
                "receiver_id, receiver_type, transaction_type, points_amount, created_at",
              )
              .eq("receiver_type", "profile")
              .eq("transaction_type", "send")
              .in("receiver_id", profileIds)
              .order("created_at", { ascending: false })
              .range(from, from + pageSize - 1);

            if (gtErr) throw gtErr;
            const rows = page || [];
            allGiftTx.push(...rows);
            if (rows.length < pageSize) break;
          }

          (allGiftTx || []).forEach((t: any) => {
            const amt = Number(t.points_amount || 0);
            const date = new Date(t.created_at || Date.now());
            chatRevenueTotal += amt;
            if (date >= monthAgo) chatRevenueMonth += amt;
          });
        }

        // currentMembers = only members currently assigned to this agent
        // Filter explicitly by agent_id because RLS may return extra users from chat_room policy
        const trulyCurrentMembers = (currentMembers || []).filter(
          (m: any) => m.agent_id === agentId,
        );
        const currentMembersCount = trulyCurrentMembers.length;
        // activeMembers = only currently assigned members with active status
        const activeMembersCount = trulyCurrentMembers.filter(
          (m: any) => m.status === "active",
        ).length;

        setStats({
          totalRevenue,
          monthlyRevenue,
          weeklyRevenue,
          todayRevenue,
          totalMembers: membersList.length,
          currentMembers: currentMembersCount,
          activeMembers: activeMembersCount,
          assignedProfiles: profileCount || 0,
          onlineProfiles,
          referralCode,
          newMembersThisMonth,
          chatRevenueTotal,
          chatRevenueMonth,
        });
      } else {
        setStats({
          totalRevenue: 0,
          monthlyRevenue: 0,
          weeklyRevenue: 0,
          todayRevenue: 0,
          totalMembers: 0,
          currentMembers: 0,
          activeMembers: 0,
          assignedProfiles: profileCount || 0,
          onlineProfiles,
          referralCode,
          newMembersThisMonth: 0,
          chatRevenueTotal: 0,
          chatRevenueMonth: 0,
        });
      }
    } catch (err) {
      setError(err as Error);
      setStats({
        totalRevenue: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        todayRevenue: 0,
        totalMembers: 0,
        currentMembers: 0,
        activeMembers: 0,
        assignedProfiles: 0,
        onlineProfiles: 0,
        referralCode: "",
        newMembersThisMonth: 0,
        chatRevenueTotal: 0,
        chatRevenueMonth: 0,
      });
      setMembers([]);
      setRevenueRecords([]);
    }

    setIsLoading(false);
  }, [agentId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!agentId) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchStats();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel(`agent-dashboard-realtime-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_action_logs",
          filter: "action=eq.change_user_referral_code",
        },
        (payload: RealtimePostgresPayload) => {
          const record = (payload.new || payload.old) as any;
          const changes = record?.changes as any;
          if (
            changes?.fromAgentId !== agentId &&
            changes?.toAgentId !== agentId
          ) {
            return;
          }
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
        },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "point_transactions",
        },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_profiles",
        },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deposit_requests",
        },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
        },
        () => {
          scheduleRefetch();
        },
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [agentId, fetchStats]);

  return {
    stats,
    members,
    revenueRecords,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// Hook for all game rounds (admin) - ????? ?????? ??
export function useAllGameRounds(filters?: {
  gameType?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  page?: number;
  pageSize?: number;
}) {
  const [rounds, setRounds] = useState<Tables<"game_rounds">[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const fetchRounds = useCallback(async () => {
    setIsLoading(true);

    // ??+?? ???? ???
    let startDateTime = filters?.startDate;
    let endDateTime = filters?.endDate;

    if (filters?.startDate && filters?.startTime) {
      const dateOnly =
        formatKST(filters.startDate, "date") || filters.startDate.split("T")[0];
      startDateTime = `${dateOnly}T${filters.startTime}:00+09:00`;
    }
    if (filters?.endDate && filters?.endTime) {
      const dateOnly =
        formatKST(filters.endDate, "date") || filters.endDate.split("T")[0];
      endDateTime = `${dateOnly}T${filters.endTime}:59+09:00`;
    }

    // ?? ? ?? ??
    let countQuery = supabaseAdmin
      .from("game_rounds")
      .select("*", { count: "exact", head: true });

    if (filters?.gameType && filters.gameType !== "all") {
      countQuery = countQuery.eq("game_type", filters.gameType);
    }
    if (startDateTime) {
      countQuery = countQuery.gte("start_time", startDateTime);
    }
    if (endDateTime) {
      countQuery = countQuery.lte("start_time", endDateTime);
    }

    const { count } = await countQuery;
    setTotalCount(count || 0);

    // ??? ????? ?? (RLS ??? ??)
    let query = supabaseAdmin
      .from("game_rounds")
      .select("*")
      .order("start_time", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (filters?.gameType && filters.gameType !== "all") {
      query = query.eq("game_type", filters.gameType);
    }
    if (startDateTime) {
      query = query.gte("start_time", startDateTime);
    }
    if (endDateTime) {
      query = query.lte("start_time", endDateTime);
    }

    const { data, error } = await query;

    if (error) {
      setError(error);
    } else {
      setRounds(data || []);
    }
    setIsLoading(false);
  }, [
    filters?.gameType,
    filters?.startDate,
    filters?.endDate,
    filters?.startTime,
    filters?.endTime,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // ??? ?? - game_rounds ?? ??
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchRounds();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel("admin-game-rounds-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rounds" },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [fetchRounds]);

  const updateRound = async (
    id: string,
    updates: Partial<Tables<"game_rounds">>,
  ) => {
    // ??? ????? ?? (RLS ??? ??)
    const { error } = await supabaseAdmin
      .from("game_rounds")
      .update(updates)
      .eq("id", id);
    if (!error) fetchRounds();
    return { error };
  };

  return {
    rounds,
    totalCount,
    isLoading,
    error,
    refetch: fetchRounds,
    updateRound,
  };
}

// Hook for all game bets (admin)
export function useAllGameBets(filters?: {
  roundId?: string;
  roundIds?: string[];
  gameType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [bets, setBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBets = useCallback(async () => {
    setIsLoading(true);

    try {
      const pageSize = 1000;
      const maxRows = 20000;
      const all: any[] = [];

      for (let from = 0; from < maxRows; from += pageSize) {
        // ??? ????? ?? (RLS ??? ??)
        let query = supabaseAdmin
          .from("game_bets")
          .select(
            "*, user_profiles(name, nickname, phone, points, email, last_login_ip, join_ip), game_rounds(game_type, round_number)",
          )
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (filters?.roundId) {
          query = query.eq("round_id", filters.roundId);
        } else if (filters?.roundIds && filters.roundIds.length > 0) {
          query = query.in("round_id", filters.roundIds);
        }

        if (filters?.status && filters.status !== "all") {
          query = query.eq("status", filters.status);
        }

        if (filters?.startDate) {
          query = query.gte("created_at", filters.startDate);
        }

        if (filters?.endDate) {
          query = query.lte("created_at", filters.endDate);
        }

        if (filters?.gameType && filters.gameType !== "all") {
          // Prefer round_id filters for accuracy; this is a best-effort filter
          query = query.eq("game_rounds.game_type", filters.gameType);
        }

        const { data, error } = await query;
        if (error) throw error;

        const page = data || [];
        all.push(...page);

        if (page.length < pageSize) break;
      }

      setError(null);
      setBets(all);
    } catch (e) {
      setError(e as Error);
      setBets([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters?.roundId,
    filters?.roundIds,
    filters?.gameType,
    filters?.status,
    filters?.startDate,
    filters?.endDate,
  ]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  // ??? ?? - game_bets ?? ??
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchBets();
      }, 100);
    };

    const channel = supabaseAdmin
      .channel("admin-game-bets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_bets" },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [fetchBets]);

  return { bets, isLoading, error, refetch: fetchBets };
}

export function useReserveResult() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requireAdmin = useCallback(async () => {
    // ???? supabaseAdmin?? ????? supabaseAdmin.auth.getUser() ??
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser();
    if (authError || !authData.user?.id) {
      throw new Error("??? ??? ?????.");
    }

    const { data: adminRow, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      throw new Error("??? ??? ?????.");
    }

    return authData.user.id;
  }, []);

  const reserveResult = useCallback(
    async (
      gameType: "powerball" | "ladder",
      roundNumber: string | number,
      reservedResult: any,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const adminId = await requireAdmin();

        const { data, error: updateError } = await supabaseAdmin
          .from("game_rounds")
          .update({
            reserved_result: reservedResult,
            reserved_by: adminId,
            reserved_at: new Date().toISOString(),
          })
          .eq("game_type", gameType)
          .eq("round_number", String(roundNumber))
          .select("id")
          .maybeSingle();

        if (updateError) throw updateError;
        if (!data?.id) throw new Error("??? ?? ? ????.");

        return { success: true };
      } catch (err) {
        const e = err as any;
        const msg = e?.message ? String(e.message) : String(e);
        setError(e instanceof Error ? e : new Error(msg));
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [requireAdmin],
  );

  const cancelReservation = useCallback(
    async (gameType: "powerball" | "ladder", roundNumber: string | number) => {
      setIsLoading(true);
      setError(null);

      try {
        await requireAdmin();

        const { data, error: updateError } = await supabaseAdmin
          .from("game_rounds")
          .update({
            reserved_result: null,
            reserved_by: null,
            reserved_at: null,
          })
          .eq("game_type", gameType)
          .eq("round_number", String(roundNumber))
          .select("id")
          .maybeSingle();

        if (updateError) throw updateError;
        if (!data?.id) throw new Error("??? ?? ? ????.");

        return { success: true };
      } catch (err) {
        const e = err as any;
        const msg = e?.message ? String(e.message) : String(e);
        setError(e instanceof Error ? e : new Error(msg));
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [requireAdmin],
  );

  return { reserveResult, cancelReservation, isLoading, error };
}

// ============================================
// ???? Hooks - Supabase ?? ?? ??
// ============================================

// ?? ??? ??? ??
const POWERBALL_BET_TYPES: Record<string, { name: string; odds: number }> = {
  "normal-odd": { name: "???", odds: 1.95 },
  "normal-even": { name: "???", odds: 1.95 },
  "normal-under": { name: "????", odds: 1.95 },
  "normal-over": { name: "????", odds: 1.95 },
  "powerball-odd": { name: "???", odds: 1.95 },
  "powerball-even": { name: "???", odds: 1.95 },
  "powerball-under": { name: "????", odds: 1.95 },
  "powerball-over": { name: "????", odds: 1.95 },
};

const LADDER_BET_TYPES: Record<string, { name: string; odds: number }> = {
  leftStart: { name: "???", odds: 1.95 },
  rightStart: { name: "???", odds: 1.95 },
  line3: { name: "3?", odds: 1.95 },
  line4: { name: "4?", odds: 1.95 },
  oddEnd: { name: "?", odds: 1.95 },
  evenEnd: { name: "?", odds: 1.95 },
  left3Even: { name: "?3?", odds: 3.8 },
  left4Odd: { name: "?4?", odds: 3.8 },
  right3Odd: { name: "?3?", odds: 3.8 },
  right4Even: { name: "?4?", odds: 3.8 },
};

export const normalizeGameSettingsOdds = (
  gameType: "powerball" | "ladder",
  oddsJson: any,
): { enabled: Record<string, boolean>; odds: Record<string, number> } => {
  const betTypes =
    gameType === "powerball" ? POWERBALL_BET_TYPES : LADDER_BET_TYPES;

  const enabledByBetType: Record<string, boolean> = {};
  const oddsByBetType: Record<string, number> = {};

  Object.entries(betTypes).forEach(([k, v]) => {
    enabledByBetType[k] = true;
    oddsByBetType[k] = v.odds;
  });

  if (!oddsJson || typeof oddsJson !== "object" || Array.isArray(oddsJson)) {
    return { enabled: enabledByBetType, odds: oddsByBetType };
  }

  if (oddsJson.enabled && typeof oddsJson.enabled === "object") {
    Object.entries(oddsJson.enabled).forEach(([k, v]) => {
      if (typeof v === "boolean") enabledByBetType[k] = v;
    });
  }
  if (oddsJson.odds && typeof oddsJson.odds === "object") {
    Object.entries(oddsJson.odds).forEach(([k, v]) => {
      if (typeof v === "number") oddsByBetType[k] = v;
    });
  }

  const applyLegacyOddEvenUnderOver = (key: string, value: number) => {
    if (gameType !== "powerball") return;
    if (key === "odd") {
      oddsByBetType["normal-odd"] = value;
      oddsByBetType["powerball-odd"] = value;
    }
    if (key === "even") {
      oddsByBetType["normal-even"] = value;
      oddsByBetType["powerball-even"] = value;
    }
    if (key === "under") {
      oddsByBetType["normal-under"] = value;
      oddsByBetType["powerball-under"] = value;
    }
    if (key === "over") {
      oddsByBetType["normal-over"] = value;
      oddsByBetType["powerball-over"] = value;
    }
  };

  const applyLegacyLadderKeys = (key: string, value: number) => {
    if (gameType !== "ladder") return;
    if (key === "left") oddsByBetType.leftStart = value;
    if (key === "right") oddsByBetType.rightStart = value;
    if (key === "3") oddsByBetType.line3 = value;
    if (key === "4") oddsByBetType.line4 = value;
    if (key === "odd") oddsByBetType.oddEnd = value;
    if (key === "even") oddsByBetType.evenEnd = value;
  };

  Object.entries(oddsJson).forEach(([k, v]) => {
    if (typeof v === "number") {
      oddsByBetType[k] = v;
      applyLegacyOddEvenUnderOver(k, v);
      applyLegacyLadderKeys(k, v);
      return;
    }

    if (typeof v === "object" && v) {
      const maybeOdds = (v as any).odds;
      const maybeEnabled = (v as any).enabled;
      if (typeof maybeOdds === "number") {
        oddsByBetType[k] = maybeOdds;
      }
      if (typeof maybeEnabled === "boolean") {
        enabledByBetType[k] = maybeEnabled;
      }
    }
  });

  return { enabled: enabledByBetType, odds: oddsByBetType };
};

// ?? ??? ?? ?? (Supabase ??)
export function useGameRoundsEdge(gameType?: string) {
  const [rounds, setRounds] = useState<Tables<"game_rounds">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRounds = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("game_rounds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (gameType) {
        query = query.eq("game_type", gameType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError);
      } else {
        setRounds(data || []);
      }
    } catch (err) {
      setError(err as Error);
    }
    setIsLoading(false);
  }, [gameType]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  return { rounds, isLoading, error, refetch: fetchRounds };
}

// ?? ??? ?? (Supabase ?? + Realtime) - ?? ?? ?? ?????
// ?? ??: Realtime ?? ?? ??, ?? ???, ?? ?? ??
export function useCurrentRoundEdge(gameType: string = "powerball") {
  const [round, setRound] = useState<Tables<"game_rounds"> | null>(null);
  const [completedRound, setCompletedRound] =
    useState<Tables<"game_rounds"> | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ?? ? ??: ??? ?? ??? ??
  const [roundTransitionPending, setRoundTransitionPending] = useState(false);

  // ?? ?? ?? ??? ??
  const serverTimeOffsetRef = useRef<number>(0); // ???? - ???????
  const lastServerSyncRef = useRef<number>(0);
  const fetchInFlightRef = useRef(false);
  const pendingRefetchRef = useRef(false); // ?? ?? refetch ??
  const bettingEndTimeRef = useRef<number | null>(null);
  const previousRoundNumberRef = useRef<number | null>(null);
  const previousCompletedRoundRef = useRef<number | null>(null);

  const fetchCurrentRound = useCallback(async () => {
    if (fetchInFlightRef.current) {
      // fetch ?? ??? ?? ? ?? fetch ??? ??? ??
      pendingRefetchRef.current = true;
      return;
    }
    fetchInFlightRef.current = true;
    pendingRefetchRef.current = false;
    try {
      const clientNow = Date.now();
      let serverNow = clientNow + serverTimeOffsetRef.current;
      const shouldSyncServerTime =
        clientNow - lastServerSyncRef.current > 15000 ||
        lastServerSyncRef.current === 0;

      const serverTimePromise = shouldSyncServerTime
        ? supabase.rpc("get_server_time")
        : Promise.resolve({ data: null, error: null } as {
            data: string | null;
            error: any;
          });

      // ?? ??? ?? (betting/playing/completed) + ?? ??? ?? ?? ??
      // ?? ? ?? - result/reserved_result ?? ??
      const currentRoundPromise = supabase
        .from("game_rounds_secure")
        .select("*")
        .eq("game_type", gameType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const completedRoundPromise = supabase
        .from("game_rounds_secure")
        .select("*")
        .eq("game_type", gameType)
        .in("status", ["completed", "settled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const [currentRoundResult, completedResult, serverNowResult] =
        await Promise.all([
          currentRoundPromise,
          completedRoundPromise,
          serverTimePromise,
        ]);

      if (!serverNowResult.error && serverNowResult.data) {
        const parsed = new Date(serverNowResult.data).getTime();
        if (!Number.isNaN(parsed)) {
          serverNow = parsed;
          serverTimeOffsetRef.current = serverNow - clientNow;
          lastServerSyncRef.current = clientNow;
        }
      }

      const { data, error: fetchError } = currentRoundResult;

      if (fetchError) {
        setError(fetchError);
      } else if (data) {
        const isHiddenState =
          data.status === "betting" || data.status === "playing";
        const safeRound = {
          ...data,
          result: isHiddenState ? null : data.result,
          reserved_result: null, // ?????? ?? ??
        };

        // ??? ?? ?? ??
        if (
          previousRoundNumberRef.current !== null &&
          previousRoundNumberRef.current !== data.round_number
        ) {
          // ??? ?? ?? ? ?? ?? ??
          setRoundTransitionPending(false);
        }
        previousRoundNumberRef.current = data.round_number;

        setRound(safeRound);
        if (data.status === "betting" || data.status === "playing") {
          const phaseEndTime =
            data.status === "playing" && data.end_time
              ? data.end_time
              : data.betting_end_time;
          if (!phaseEndTime) {
            bettingEndTimeRef.current = null;
            setTimeRemaining(0);
          } else {
            const endTimeMs = new Date(phaseEndTime).getTime();
            bettingEndTimeRef.current = endTimeMs;
            const remaining = Math.max(
              0,
              Math.floor((endTimeMs - serverNow) / 1000),
            );
            setTimeRemaining(remaining);
          }
        } else {
          bettingEndTimeRef.current = null;
          setTimeRemaining(0);
        }
      } else {
        // ???? ?? ? ???
        setRound(null);
        bettingEndTimeRef.current = null;
        setTimeRemaining(0);
      }

      const { data: completed, error: completedError } = completedResult;

      if (completedError && (completedError as any).code !== "PGRST116") {
        setError(completedError);
      } else if (completed) {
        // ?? ??? ?? ?? - ?? ???? ??? ?? ????
        const isNewCompletedRound =
          previousCompletedRoundRef.current !== completed.round_number;
        previousCompletedRoundRef.current = completed.round_number;

        const updatedCompletedRound = {
          ...completed,
          reserved_result: null,
        } as any;
        setCompletedRound(updatedCompletedRound);

        // ?? ??? ?? ? ?? ?? ??
        if (isNewCompletedRound) {
          setRoundTransitionPending(false);
        }
      } else {
        setCompletedRound(null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      fetchInFlightRef.current = false;
      setIsLoading(false);

      // ?? ?? refetch ??? ??? ?? ?? fetch
      if (pendingRefetchRef.current) {
        pendingRefetchRef.current = false;
        // ?? ??? refetch ?? (?? ?? ??)
        setTimeout(() => {
          fetchCurrentRound();
        }, 50);
      }
    }
  }, [gameType]);

  // Realtime ?? - ?? ?? ??
  useEffect(() => {
    fetchCurrentRound();
    // ?? ?? ?? 3?
    const interval = setInterval(fetchCurrentRound, 3000);

    // ??? ?? - ?? ?? ?? (?????? ?? ??? ??)
    const channel = supabase
      .channel(`current-round-${gameType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rounds",
          filter: `game_type=eq.${gameType}`,
        },
        (payload: RealtimePostgresPayload) => {
          const eventType = payload.eventType;
          const newData = payload.new as Tables<"game_rounds"> | null;

          // INSERT ???: ? ???? ??? - ?? ??
          if (eventType === "INSERT" && newData) {
            const isHiddenState =
              newData.status === "betting" || newData.status === "playing";
            const safeRound = {
              ...newData,
              result: isHiddenState ? null : newData.result,
              reserved_result: null,
            };
            setRound(safeRound);
            previousRoundNumberRef.current = newData.round_number;

            // ? ???? ??? ??
            if (newData.status === "betting" && newData.betting_end_time) {
              const endTimeMs = new Date(newData.betting_end_time).getTime();
              bettingEndTimeRef.current = endTimeMs;
              const serverNow = Date.now() + serverTimeOffsetRef.current;
              const remaining = Math.max(
                0,
                Math.floor((endTimeMs - serverNow) / 1000),
              );
              setTimeRemaining(remaining);
            }

            // ?? ??
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            triggerProcessingRef.current = false;
            setRoundTransitionPending(false);
          }

          // UPDATE ???: ??? ?? ?? (completed ?)
          if (eventType === "UPDATE" && newData) {
            // completed/settled ??? completedRound ????
            if (
              newData.status === "completed" ||
              newData.status === "settled"
            ) {
              const updatedCompletedRound = {
                ...newData,
                reserved_result: null,
              } as Tables<"game_rounds">;
              setCompletedRound(updatedCompletedRound);
              previousCompletedRoundRef.current = newData.round_number;
            }
          }

          // ??? fetch? ???? ?? ??? ???
          fetchCurrentRound();
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchCurrentRound, gameType]);

  // ???? 0? ?? ?? ?? ?? + ?? ?? ??
  const triggerProcessingRef = useRef(false);
  const lastTriggerTimeRef = useRef(0);
  const lastProcessedRoundRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // timeRemaining? 4? ???? betting ???? ?? ?? ??? (? ?? ??)
    const currentRoundNumber = round?.round_number;
    const shouldTrigger =
      timeRemaining <= 4 &&
      (round?.status === "betting" || round?.status === "playing") &&
      bettingEndTimeRef.current !== null &&
      !triggerProcessingRef.current &&
      lastProcessedRoundRef.current !== currentRoundNumber;

    if (shouldTrigger && currentRoundNumber) {
      const now = Date.now();
      // 1? ?? ?? ?? ??
      if (now - lastTriggerTimeRef.current < 1000) return;

      triggerProcessingRef.current = true;
      lastTriggerTimeRef.current = now;
      lastProcessedRoundRef.current = currentRoundNumber;
      setRoundTransitionPending(true);

      // ??? ??? ?? ?? (??? ?? ??)
      const callGameTick = async (retryCount = 0): Promise<void> => {
        try {
          const result = await supabase.rpc("game_tick_client", {
            p_game_type: gameType,
          });
          if (result.error) {
            console.error("game_tick_client error:", result.error);
            // ?? ??? ???
            if (retryCount < 30) {
              await new Promise((r) => setTimeout(r, 300));
              return callGameTick(retryCount + 1);
            }
            return;
          }

          const data = result.data as {
            success?: boolean;
            skipped?: boolean;
            settled?: any[];
            created?: any[];
          } | null;

          const hasSettled =
            data?.settled &&
            Array.isArray(data.settled) &&
            data.settled.length > 0;
          const hasCreated =
            data?.created &&
            Array.isArray(data.created) &&
            data.created.length > 0;

          if (data?.skipped) {
            // Lock? ????? ??? (50ms ??, ?? 80? = 4?)
            if (retryCount < 80) {
              await new Promise((r) => setTimeout(r, 50));
              return callGameTick(retryCount + 1);
            }
          } else if (!hasSettled && !hasCreated) {
            // ???? ???? ???? ??? (50ms ??, ?? 80? = 4?)
            if (retryCount < 80) {
              await new Promise((r) => setTimeout(r, 50));
              return callGameTick(retryCount + 1);
            }
          }

          if (hasSettled) {
            fetchCurrentRound();
          }

          if (hasCreated) {
            fetchCurrentRound();
          }
        } catch (e) {
          console.error("game_tick_client exception:", e);
          if (retryCount < 30) {
            await new Promise((r) => setTimeout(r, 300));
            return callGameTick(retryCount + 1);
          }
        }
      };

      callGameTick();

      // ?? ?? ?? (RPC ??? ???? ?? - ?? ?? ??)
      let pollCount = 0;
      const maxPolls = 100; // ? 10? (100ms ??)

      const pollForResult = async () => {
        pollCount++;
        await fetchCurrentRound();

        // ???? ?????? ?? - ref ???? stale closure ??
        const newRoundNumber = previousRoundNumberRef.current;
        const newCompletedRound = previousCompletedRoundRef.current;
        const roundChanged = newRoundNumber !== currentRoundNumber;
        // string ?? round_number ?? - ?? ???? ?????? ??
        const completedRoundChanged =
          newCompletedRound !== null &&
          newCompletedRound === currentRoundNumber;

        if (roundChanged || completedRoundChanged || pollCount >= maxPolls) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          triggerProcessingRef.current = false;
          setRoundTransitionPending(false);
        }
      };

      // ?? 1? ??
      pollForResult();

      // 100ms?? ?? (?? ?? ?? ??)
      pollingIntervalRef.current = setInterval(pollForResult, 100);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [
    timeRemaining,
    round?.status,
    round?.round_number,
    gameType,
    fetchCurrentRound,
  ]);

  // ???? 0 ????? ?? ??? ?? ??
  useEffect(() => {
    // timeRemaining? 5? ??, ?? betting ???? 0??? ?? ??? fast polling
    const needsFastPolling =
      (timeRemaining > 0 && timeRemaining <= 5) ||
      (timeRemaining <= 0 &&
        (round?.status === "betting" || round?.status === "playing")) ||
      roundTransitionPending;

    if (needsFastPolling) {
      // 100ms?? ???? ??? ?? ??? ?? ??
      const fastPoll = setInterval(fetchCurrentRound, 100);
      return () => clearInterval(fastPoll);
    }
  }, [timeRemaining, round?.status, roundTransitionPending, fetchCurrentRound]);

  // ?? ?? ?? ????? ???? (1? ??)
  useEffect(() => {
    const timer = setInterval(() => {
      // ?? ?? ???? ???? ?? ?? ??
      if (bettingEndTimeRef.current) {
        const adjustedNow = Date.now() + serverTimeOffsetRef.current;
        const remaining = Math.max(
          0,
          Math.floor((bettingEndTimeRef.current - adjustedNow) / 1000),
        );
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []); // ??? ?? ?? - ??? ? 1? ??

  // ?? ???? ?? ? ? ??? ?? ???
  const noActiveRoundTriggerRef = useRef(false);
  const lastNoActiveRoundTriggerRef = useRef(0);

  useEffect(() => {
    // ?? ??? ??
    if (isLoading) return;

    // ?? ??? ?? ??? ??
    if (triggerProcessingRef.current || noActiveRoundTriggerRef.current) return;

    // ?? ???? ?? ??: round? null??? status? completed/settled
    const noActiveRound =
      !round || round.status === "completed" || round.status === "settled";

    if (noActiveRound) {
      const now = Date.now();
      // 5? ?? ?? ?? ??
      if (now - lastNoActiveRoundTriggerRef.current < 5000) return;

      noActiveRoundTriggerRef.current = true;
      lastNoActiveRoundTriggerRef.current = now;

      const createNewRound = async () => {
        try {
          const result = await supabase.rpc("game_tick_client", {
            p_game_type: gameType,
          });

          if (result.error) {
            console.error(
              "game_tick_client error (no active round):",
              result.error,
            );
          } else {
            const data = result.data as {
              created?: any[];
            } | null;

            // ? ??? ??? fetch
            fetchCurrentRound();
          }
        } catch (e) {
          console.error("game_tick_client exception (no active round):", e);
        } finally {
          noActiveRoundTriggerRef.current = false;
        }
      };

      createNewRound();
    }
  }, [isLoading, round, gameType, fetchCurrentRound]);

  return {
    round,
    completedRound,
    remaining_seconds: timeRemaining,
    isLoading,
    error,
    roundTransitionPending, // ??? ?? ??? ??
    refetch: fetchCurrentRound,
  };
}

export function useBettingRoundBetCount(gameType: "powerball" | "ladder") {
  const [betCount, setBetCount] = useState(0);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: round, error: roundError } = await supabase
        .from("game_rounds")
        .select("id")
        .eq("game_type", gameType)
        .eq("status", "betting")
        .gte("betting_end_time", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roundError) throw roundError;

      if (!round?.id) {
        setCurrentRoundId(null);
        setBetCount(0);
        setIsLoading(false);
        return;
      }

      const roundId = String(round.id);
      setCurrentRoundId(roundId);

      const { count, error: countError } = await (supabase
        .from("game_bets")
        .select("id", { count: "exact", head: true })
        .eq("round_id", roundId) as any);

      if (countError) throw countError;
      setBetCount(Number(count ?? 0));
    } catch (err) {
      setError(err as Error);
      setBetCount(0);
      setCurrentRoundId(null);
    } finally {
      setIsLoading(false);
    }
  }, [gameType]);

  useEffect(() => {
    void fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    const roundsChannel = supabase
      .channel(`betting-round-count-rounds:${gameType}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rounds" },
        (payload: RealtimePostgresPayload) => {
          const row = (payload.new || payload.old) as any;
          if (row?.game_type !== gameType) return;
          void fetchCount();
        },
      )
      .subscribe();

    const betsChannel = supabase
      .channel(`betting-round-count-bets:${gameType}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_bets" },
        (payload: RealtimePostgresPayload) => {
          const row = (payload.new || payload.old) as any;
          if (!row?.round_id) return;
          if (!currentRoundId) return;
          if (String(row.round_id) !== String(currentRoundId)) return;
          void fetchCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [currentRoundId, fetchCount, gameType]);

  return { betCount, isLoading, error, refetch: fetchCount };
}

// ?? ?? (Supabase ??)
export function usePlaceBet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastBetTimeRef = useRef<number>(0);
  const THROTTLE_MS = 2000; // 2? ????

  const resolveGameSettings = async (gameType: string) => {
    const { data, error: settingsError } = await supabase
      .from("game_settings")
      .select("is_active, min_bet, max_bet, odds")
      .eq("game_type", gameType)
      .maybeSingle();

    if (settingsError && (settingsError as any).code !== "PGRST116") {
      throw new Error(settingsError.message);
    }

    const enabledByBetType: Record<string, boolean> = {};
    const oddsByBetType: Record<string, number> = {};

    const oddsJson: any = data?.odds;
    if (oddsJson && typeof oddsJson === "object") {
      if (oddsJson.enabled && typeof oddsJson.enabled === "object") {
        Object.entries(oddsJson.enabled).forEach(([k, v]) => {
          if (typeof v === "boolean") enabledByBetType[k] = v;
        });
      }
      if (oddsJson.odds && typeof oddsJson.odds === "object") {
        Object.entries(oddsJson.odds).forEach(([k, v]) => {
          if (typeof v === "number") oddsByBetType[k] = v;
        });
      }
      Object.entries(oddsJson).forEach(([k, v]) => {
        if (typeof v === "number") oddsByBetType[k] = v;
        if (typeof v === "object" && v && typeof (v as any).odds === "number") {
          oddsByBetType[k] = (v as any).odds;
        }
        if (
          typeof v === "object" &&
          v &&
          typeof (v as any).enabled === "boolean"
        ) {
          enabledByBetType[k] = (v as any).enabled;
        }
      });
    }

    return {
      isActive: data?.is_active ?? true,
      minBet: data?.min_bet ?? null,
      maxBet: data?.max_bet ?? null,
      enabledByBetType,
      oddsByBetType,
    };
  };

  const placeBet = async (
    userId: string,
    roundId: string,
    betType: string,
    betAmount: number,
    ipAddress?: string,
  ) => {
    // ???? ?? - ?? ?? ?? (??? ??)
    const now = Date.now();
    if (now - lastBetTimeRef.current < THROTTLE_MS || isLoading) {
      return { success: true, data: null, throttled: true };
    }
    lastBetTimeRef.current = now;

    setIsLoading(true);
    setError(null);

    try {
      // 1. ??? ?? ??
      const { data: round, error: roundError } = await supabase
        .from("game_rounds")
        .select("*")
        .eq("id", roundId)
        .single();

      if (roundError || !round) {
        throw new Error("???? ?? ? ????.");
      }

      if (round.status !== "betting") {
        throw new Error("?? ??? ???? ??????.");
      }

      const now = new Date();
      if (round.betting_end_time && new Date(round.betting_end_time) < now) {
        throw new Error("?? ??? ???????.");
      }

      // 2. ??? ??? ??
      const { data: user, error: userError } = await supabase
        .from("user_profiles")
        .select("points")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        throw new Error("??? ??? ?? ? ????.");
      }

      if (user.points < betAmount) {
        throw new Error("???? ?????.");
      }

      const settings = await resolveGameSettings(round.game_type);
      if (!settings.isActive) {
        throw new Error("?? ??? ???????.");
      }
      if (settings.minBet != null && betAmount < settings.minBet) {
        throw new Error(
          `?? ?? ??? ${settings.minBet.toLocaleString()}P ???.`,
        );
      }
      if (settings.maxBet != null && betAmount > settings.maxBet) {
        throw new Error(
          `?? ?? ??? ${settings.maxBet.toLocaleString()}P ???.`,
        );
      }

      // 3. ??? ??
      const betTypes =
        round.game_type === "powerball"
          ? POWERBALL_BET_TYPES
          : LADDER_BET_TYPES;
      const betInfo = betTypes[betType];
      if (!betInfo) {
        throw new Error("???? ?? ?? ?????.");
      }

      if (settings.enabledByBetType[betType] === false) {
        throw new Error("?? ??? ?? ??? ?? ???????.");
      }

      const appliedOdds = settings.oddsByBetType[betType] ?? betInfo.odds;

      // 4. Place bet via SECURITY DEFINER RPC to avoid client-side RLS issues
      const { data: betId, error: betError } = await supabase.rpc("place_bet", {
        p_user_id: userId,
        p_round_id: roundId,
        p_bet_type: betType,
        p_amount: betAmount,
        p_odds: appliedOdds,
        p_ip_address: ipAddress || null,
      });

      if (betError || !betId) {
        throw new Error(
          "?? ?? ??? ??????: " + (betError?.message || "unknown"),
        );
      }

      // Minimal compatible return shape for callers
      const bet = {
        id: betId,
        user_id: userId,
        round_id: roundId,
        bet_type: betType,
        bet_amount: betAmount,
        odds: appliedOdds,
        status: "pending",
        win_amount: 0,
      };

      setIsLoading(false);
      return { success: true, data: bet };
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      return { success: false, error: (err as Error).message };
    }
  };

  return { placeBet, isLoading, error };
}

// Admin: ??? ?? (Supabase ??)
export function useCreateRound() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requireAdmin = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user?.id) {
      throw new Error("??? ??? ?????.");
    }

    const { data: adminRow, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      throw new Error("??? ??? ?????.");
    }
  }, []);

  const createRound = async (
    gameType: string,
    bettingDurationSeconds: number = 300,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await requireAdmin();

      void bettingDurationSeconds;
      const { error: tickError } = await supabase.rpc("admin_game_tick", {
        p_game_type: gameType,
      });
      if (tickError) throw tickError;

      const { data, error: fetchError } = await supabase
        .from("game_rounds")
        .select("*")
        .eq("game_type", gameType)
        .eq("status", "betting")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setIsLoading(false);
      return { success: true, data };
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      return { success: false, error: (err as Error).message };
    }
  };

  return { createRound, isLoading, error };
}

export function useGameSettings(
  gameType: "powerball" | "ladder",
  options?: {
    enablePolling?: boolean;
    enableRealtime?: boolean;
    useAdminClient?: boolean;
  },
) {
  const enablePolling = options?.enablePolling ?? true;
  const enableRealtime = options?.enableRealtime ?? true;
  const client = options?.useAdminClient ? supabaseAdmin : supabase;

  const [settings, setSettings] = useState<Tables<"game_settings"> | null>(
    () => {
      const cached = gameSettingsCache.get(gameType);
      return cached === undefined ? null : cached;
    },
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await client
      .from("game_settings")
      .select("*")
      .eq("game_type", gameType)
      .maybeSingle();

    if (error) {
      setError(error);
      setSettings(null);
    } else {
      gameSettingsCache.set(gameType, data || null);
      setSettings(data || null);
    }

    setIsLoading(false);
  }, [client, gameType]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!enableRealtime) return;

    const channel = client
      .channel(`game-settings:${gameType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_settings",
          filter: `game_type=eq.${gameType}`,
        },
        (payload: RealtimePostgresPayload) => {
          const next = (payload as any)?.new;
          if (next && typeof next === "object") {
            gameSettingsCache.set(gameType, next as Tables<"game_settings">);
            setSettings(next as Tables<"game_settings">);
            setError(null);
            return;
          }
          void fetchSettings();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [client, enableRealtime, fetchSettings, gameType]);

  // Polling for settings updates (every 3 seconds) as realtime fallback - only if enabled
  useEffect(() => {
    if (!enablePolling) return;

    const pollInterval = setInterval(() => {
      void fetchSettings();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchSettings, enablePolling]);

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
  };
}

export function useUpdateGameSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateGameSettings = useCallback(
    async (
      gameType: "powerball" | "ladder",
      updates: Partial<Tables<"game_settings">>,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        // ???? supabaseAdmin?? ????? supabaseAdmin.auth.getUser() ??
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.getUser();
        if (authError || !authData.user?.id) {
          throw new Error("??? ??? ?????.");
        }

        const { data: adminRow, error: adminError } = await supabaseAdmin
          .from("admins")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (adminError || !adminRow) {
          throw new Error("??? ??? ?????.");
        }

        const nextUpdates: Partial<Tables<"game_settings">> = {
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: authData.user.id,
        };

        const { data, error: updateError } = await supabaseAdmin
          .from("game_settings")
          .update(nextUpdates)
          .eq("game_type", gameType)
          .select("*")
          .maybeSingle();

        if (updateError) throw updateError;
        if (!data) throw new Error("??? ?? ? ????.");

        return { success: true, data };
      } catch (err) {
        const e = err as any;
        const msg = e?.message ? String(e.message) : String(e);
        setError(e instanceof Error ? e : new Error(msg));
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updateGameSettings, isLoading, error };
}

export function useRankings(
  period: "daily" | "weekly" | "monthly" | "all_time" = "weekly",
) {
  const [rankings, setRankings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRankings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      let startDate: Date | null = null;

      if (period === "daily") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
      } else if (period === "weekly") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "monthly") {
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
      }

      const sinceIso = startDate ? startDate.toISOString() : null;

      const giftStats = new Map<string, { count: number; value: number }>();

      const pageSize = 1000;
      const maxRows = 20000;

      for (let from = 0; from < maxRows; from += pageSize) {
        let txQuery = supabase
          .from("gift_transactions")
          .select("sender_id, quantity, points_amount")
          .eq("sender_type", "user")
          .eq("receiver_type", "profile")
          .eq("transaction_type", "send");

        txQuery = sinceIso ? txQuery.gte("created_at", sinceIso) : txQuery;

        const { data: page, error: pageError } = await txQuery.range(
          from,
          from + pageSize - 1,
        );

        if (pageError) throw pageError;
        if (!page || page.length === 0) break;

        (page || []).forEach((t: any) => {
          const senderId = t.sender_id as string | null;
          if (!senderId) return;

          const quantity = Number(t.quantity ?? 1);
          const value = Number(t.points_amount ?? 0);

          const prev = giftStats.get(senderId) || { count: 0, value: 0 };
          giftStats.set(senderId, {
            count: prev.count + quantity,
            value: prev.value + value,
          });
        });

        if (page.length < pageSize) break;
      }

      const sortedGiftSenders = Array.from(giftStats.entries())
        .sort((a, b) => {
          const countDiff = b[1].count - a[1].count;
          if (countDiff !== 0) return countDiff;
          return b[1].value - a[1].value;
        })
        .slice(0, 200);

      const topSenderIds = sortedGiftSenders.map(([id]) => id);

      let topUsers: any[] = [];
      if (topSenderIds.length > 0) {
        const { data, error: topUsersError } = await supabase
          .from("user_profiles")
          .select("id, name, nickname, points, profile_image")
          .eq("status", "active")
          .in("id", topSenderIds);

        if (topUsersError) throw topUsersError;
        topUsers = data || [];
      }

      const userMap = new Map((topUsers || []).map((u: any) => [u.id, u]));

      const ranked: any[] = [];
      let rank = 1;

      for (const [userId, stats] of sortedGiftSenders) {
        const user = userMap.get(userId);
        if (!user) continue;

        ranked.push({
          ...user,
          gifts_sent_count: stats.count,
          gifts_sent_value: stats.value,
          rank,
        });

        rank += 1;
        if (ranked.length >= 50) break;
      }

      if (ranked.length < 50) {
        const { data: fillerUsers, error: fillerError } = await supabase
          .from("user_profiles")
          .select("id, name, nickname, points, profile_image")
          .eq("status", "active")
          .order("points", { ascending: false })
          .limit(50);

        if (fillerError) throw fillerError;

        for (const u of fillerUsers || []) {
          if (ranked.length >= 50) break;
          if (ranked.some((r) => r.id === u.id)) continue;

          ranked.push({
            ...u,
            gifts_sent_count: 0,
            gifts_sent_value: 0,
            rank,
          });
          rank += 1;
        }
      }

      setRankings(ranked);
    } catch (err) {
      setError(err as Error);
      setRankings([]);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  useEffect(() => {
    const channel = supabase
      .channel(`rankings:${period}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gift_transactions",
          filter: "transaction_type=eq.send",
        },
        (payload: RealtimePostgresPayload) => {
          const row = payload.new as any;
          if (!row) return;
          if (row.sender_type !== "user") return;
          if (row.receiver_type !== "profile") return;
          void fetchRankings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRankings, period]);

  return { rankings, isLoading, error, refetch: fetchRankings };
}

// ============================================
// ??? ?? ?? ?? Hooks
// ============================================

export function useAdminPaymentRequests(adminId?: string) {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const resolveAdminId = useCallback(async () => {
    if (adminId) return adminId;

    // ??? ????? ?? (RLS ??? ??)
    const { data, error } = await supabaseAdmin.auth.getUser();

    if (error) {
      throw error;
    }
    return data.user?.id ?? null;
  }, [adminId]);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);

    // ??? ????? ?? (RLS ??? ??) - ?? ?? ??
    const { data: depositData, error: depositError } = await supabaseAdmin
      .from("deposit_requests")
      .select("*, users:user_profiles(name, nickname, email)")
      .order("created_at", { ascending: false });

    // ??? ????? ?? (RLS ??? ??) - ?? ?? ??
    const { data: withdrawalData, error: withdrawalError } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("*, users:user_profiles(name, nickname, email)")
      .order("created_at", { ascending: false });

    if (depositError || withdrawalError) {
      setError(depositError || withdrawalError);
    } else {
      setDeposits(depositData || []);
      setWithdrawals(withdrawalData || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ??? ?? + ?? ?? (5? ??)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pollingId: ReturnType<typeof setInterval> | null = null;

    const scheduleRefetch = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchRequests();
      }, 100);
    };

    const channelName = `admin-payment-requests`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deposit_requests" },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deposit_requests" },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "deposit_requests" },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "withdrawal_requests" },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "withdrawal_requests" },
        () => {
          scheduleRefetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "withdrawal_requests" },
        () => {
          scheduleRefetch();
        },
      )
      .subscribe();

    // ?? ??: 5??? ??? ???? (??? ?? ?? ? ??)
    pollingId = setInterval(() => {
      void fetchRequests();
    }, 5000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (pollingId) {
        clearInterval(pollingId);
        pollingId = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  const approveDeposit = async (id: string) => {
    try {
      const processedBy = await resolveAdminId();
      if (!processedBy) {
        throw new Error("??? ?? ??? ????.");
      }

      // ??? ????? ?? (RLS ??? ??)
      const { data: approvedRequest, error: approveError } = await supabaseAdmin
        .from("deposit_requests")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
          processed_by: processedBy,
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();

      if (approveError) {
        throw approveError;
      }

      if (!approvedRequest) {
        await fetchRequests();
        return { error: null };
      }

      const depositAmount = approvedRequest.amount || 0;
      const bonusAmount = approvedRequest.bonus_amount ?? 0;

      // 1. ??? ???? ?? (charge ??)
      const { error: addPointsError } = await supabaseAdmin.rpc("add_points", {
        p_user_id: approvedRequest.user_id,
        p_amount: depositAmount,
        p_type: "charge",
        p_reference_id: approvedRequest.id,
        p_description: "?? ??",
      });

      if (addPointsError) {
        throw addPointsError;
      }

      // 2. ???? ?? ?? ??? bonus ?? ???? ??
      if (bonusAmount > 0) {
        const { error: addBonusError } = await supabaseAdmin.rpc("add_points", {
          p_user_id: approvedRequest.user_id,
          p_amount: bonusAmount,
          p_type: "bonus",
          p_reference_id: approvedRequest.id,
          p_description: `?? ??? (${depositAmount.toLocaleString()}? ??)`,
        });

        if (addBonusError) {
          throw addBonusError;
        }
      }

      // ??? ????? ?? (RLS ??? ??)
      await supabaseAdmin.from("admin_action_logs").insert({
        action: "approve_deposit",
        admin_id: processedBy,
        target_id: approvedRequest.id,
        target_type: "deposit_requests",
        ip_address: null,
        changes: {
          userId: approvedRequest.user_id,
          amount: approvedRequest.amount,
          bonusAmount: approvedRequest.bonus_amount ?? 0,
        },
      });

      await fetchRequests();
      return { error: null };
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj);
      return { error: errorObj };
    }
  };

  const rejectDeposit = async (id: string, reason?: string) => {
    try {
      const processedBy = await resolveAdminId();
      if (!processedBy) {
        throw new Error("??? ?? ??? ????.");
      }

      // ??? ????? ?? (RLS ??? ??)
      const { error } = await supabaseAdmin
        .from("deposit_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          processed_by: processedBy,
          reject_reason: reason,
        })
        .eq("id", id)
        .eq("status", "pending");

      if (!error) await fetchRequests();

      if (!error) {
        // ??? ????? ?? (RLS ??? ??)
        await supabaseAdmin.from("admin_action_logs").insert({
          action: "reject_deposit",
          admin_id: processedBy,
          target_id: id,
          target_type: "deposit_requests",
          ip_address: null,
          changes: { reason: reason ?? null },
        });
      }
      return { error };
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj);
      return { error: errorObj };
    }
  };

  const approveWithdrawal = async (id: string) => {
    try {
      const processedBy = await resolveAdminId();
      if (!processedBy) {
        throw new Error("??? ?? ??? ????.");
      }

      const processedAt = new Date().toISOString();
      // ??? ????? ?? (RLS ??? ??)
      const { data: approvedRequest, error: approveError } = await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          status: "approved",
          processed_at: processedAt,
          processed_by: processedBy,
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();

      if (approveError) {
        throw approveError;
      }

      if (!approvedRequest) {
        await fetchRequests();
        return { error: null };
      }

      // ???? ?? ?? ?? ? ??????? ??? ??
      // ?? ?? ???? ?? (?? ???)
      await supabaseAdmin.from("point_transactions").insert({
        user_id: approvedRequest.user_id,
        type: "withdraw",
        amount: -approvedRequest.amount,
        balance_before: null,
        balance_after: null,
        related_id: approvedRequest.id,
        related_type: "withdrawal_request",
        description: "?? ??",
        admin_id: processedBy,
      });

      // ??? ????? ?? (RLS ??? ??)
      await supabaseAdmin.from("admin_action_logs").insert({
        action: "approve_withdrawal",
        admin_id: processedBy,
        target_id: approvedRequest.id,
        target_type: "withdrawal_requests",
        ip_address: null,
        changes: {
          userId: approvedRequest.user_id,
          amount: approvedRequest.amount,
        },
      });

      await fetchRequests();
      return { error: null };
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj);
      return { error: errorObj };
    }
  };

  const rejectWithdrawal = async (id: string, reason?: string) => {
    try {
      const processedBy = await resolveAdminId();
      if (!processedBy) {
        throw new Error("??? ?? ??? ????.");
      }

      // 1. ?? ?? ?? ?? ?? (??? ?? ??)
      const { data: withdrawalRequest, error: fetchError } = await supabaseAdmin
        .from("withdrawal_requests")
        .select("*")
        .eq("id", id)
        .eq("status", "pending")
        .single();

      if (fetchError || !withdrawalRequest) {
        throw fetchError ?? new Error("?? ??? ?? ? ????.");
      }

      // 2. ??? ????? ?? (RLS ??? ??) - ?? ????
      const { error } = await supabaseAdmin
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
          processed_by: processedBy,
          reject_reason: reason,
        })
        .eq("id", id)
        .eq("status", "pending");

      if (error) {
        throw error;
      }

      // 3. ??? ?? (?? ?? ? ??? ??? ??) - ?? ????
      const refundAmount = withdrawalRequest.amount || 0;
      const userId = withdrawalRequest.user_id;

      // ?? ??? ??
      const { data: userProfile, error: userFetchError } = await supabaseAdmin
        .from("user_profiles")
        .select("points")
        .eq("id", userId)
        .single();

      if (userFetchError || !userProfile) {
        // ?? ?? ? ?? ??
        await supabaseAdmin
          .from("withdrawal_requests")
          .update({
            status: "pending",
            processed_at: null,
            processed_by: null,
            reject_reason: null,
          })
          .eq("id", id);
        throw userFetchError ?? new Error("??? ??? ?? ? ????.");
      }

      const currentPoints = userProfile.points ?? 0;
      const newPoints = currentPoints + refundAmount;

      // ??? ????
      const { error: refundError } = await supabaseAdmin
        .from("user_profiles")
        .update({ points: newPoints, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (refundError) {
        // ?? ?? ? ?? ??
        await supabaseAdmin
          .from("withdrawal_requests")
          .update({
            status: "pending",
            processed_at: null,
            processed_by: null,
            reject_reason: null,
          })
          .eq("id", id);
        throw refundError;
      }

      // ??? ???? ??
      await supabaseAdmin.from("point_transactions").insert({
        user_id: userId,
        type: "withdraw_refund",
        amount: refundAmount,
        balance_before: currentPoints,
        balance_after: newPoints,
        related_id: id,
        related_type: "withdrawal_request",
        description: `?? ?? ??${reason ? ` (??: ${reason})` : ""}`,
        admin_id: processedBy,
      });

      await fetchRequests();

      // 4. ??? ?? ?? ??
      await supabaseAdmin.from("admin_action_logs").insert({
        action: "reject_withdrawal",
        admin_id: processedBy,
        target_id: id,
        target_type: "withdrawal_requests",
        ip_address: null,
        changes: {
          reason: reason ?? null,
          refundAmount: refundAmount,
          userId: withdrawalRequest.user_id,
        },
      });

      return { error: null };
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj);
      return { error: errorObj };
    }
  };

  return {
    deposits,
    withdrawals,
    isLoading,
    error,
    refetch: fetchRequests,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
  };
}

// ??? ???? ?? Hooks (?? ?? ??)
export function useAdminPointPackages(adminId?: string) {
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabaseAdmin
      .from("charging_cards")
      .select("*")
      .order("amount", { ascending: true });

    if (error) {
      setError(error);
    } else {
      setPackages(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        void fetchPackages();
      }, 300);
    };

    const channel = supabaseAdmin
      .channel("admin-charging-cards")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "charging_cards" },
        () => scheduleRefetch(),
      )
      .subscribe();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      void supabaseAdmin.removeChannel(channel);
    };
  }, [fetchPackages]);

  const createPackage = async (packageData: any) => {
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();

    const createdBy = adminId ?? user?.id;
    if (authError || !createdBy) {
      return {
        data: null,
        error: authError || new Error("??? ??? ?????."),
      };
    }

    const amount = packageData.amount ?? packageData.price;
    const bonusAmount = packageData.bonus_amount ?? packageData.bonus ?? 0;

    const { data, error } = await supabaseAdmin
      .from("charging_cards")
      .insert({
        name: packageData.name || `${packageData.amount}? ??`,
        amount,
        bonus_amount: bonusAmount,
        is_active: packageData.is_active ?? true,
        created_by: createdBy,
      })
      .select()
      .single();
    if (!error) fetchPackages();
    return { data, error };
  };

  const updatePackage = async (id: string, updates: any) => {
    const { error } = await supabaseAdmin
      .from("charging_cards")
      .update(updates)
      .eq("id", id);
    if (!error) fetchPackages();
    return { error };
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabaseAdmin
      .from("charging_cards")
      .delete()
      .eq("id", id);
    if (!error) fetchPackages();
    return { error };
  };

  return {
    packages,
    isLoading,
    error,
    refetch: fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
  };
}

// ???? ?? ?? ?? ?? Hook
export function useChargingCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      const { data } = await supabase
        .from("charging_cards")
        .select("*")
        .eq("is_active", true)
        .order("amount", { ascending: true }); // Order by amount (low to high)
      setCards(data || []);
      setIsLoading(false);
    };
    fetchCards();
  }, []);

  return { cards, isLoading };
}

// ???? ?? ?? ?? Hook (?? ?? ?? ??)
export function useAdminGameSettings() {
  const [settings, setSettings] = useState<Tables<"game_settings">[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from("game_settings").select("*");
    setSettings(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateGameOpen = async (gameType: string, isOpen: boolean) => {
    const { error } = await supabase
      .from("game_settings")
      .update({ is_active: isOpen })
      .eq("game_type", gameType);
    if (!error) fetchSettings();
    return { error };
  };

  return {
    settings,
    isLoading,
    refetch: fetchSettings,
    updateGameOpen,
  };
}
