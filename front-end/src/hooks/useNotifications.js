import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useDemoModeContext } from "./useDemoMode";
import { demoStore } from "../data/demoStore";

export function useNotifications() {
  const { profile, loading: authLoading } = useAuth();
  const { isDemoMode, refreshKey } = useDemoModeContext();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const channelRef = useRef(null);

  // ── Demo mode ──
  useEffect(() => {
    if (!isDemoMode) return;
    setLoading(true);
    setNotifications(demoStore.get("notifications"));
    setLoading(false);
    const sync = () => setNotifications(demoStore.get("notifications"));
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, [isDemoMode, refreshKey]);

  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) { setNotifications([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) {
      setNotifications((data ?? []).map(n => ({
        id: n.id, type: n.type, title: n.title,
        body: n.body, read: n.read, time: timeAgo(n.created_at),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDemoMode) return;
    if (authLoading) return;
    fetchNotifications(profile?.id ?? null);
  }, [isDemoMode, authLoading, profile?.id, fetchNotifications]);

  // Real-time with safe channel management (live mode only)
  useEffect(() => {
    if (isDemoMode) return;
    if (!profile?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const ch = supabase
      .channel(`notifications-${profile.id}-${Date.now()}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        () => fetchNotifications(profile.id)
      );

    ch.subscribe();
    channelRef.current = ch;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isDemoMode, profile?.id, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (isDemoMode) {
      const updated = demoStore.get("notifications").map(n => ({ ...n, read: true }));
      demoStore.set("notifications", updated);
      setNotifications(updated);
      return;
    }
    if (!profile?.id) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [isDemoMode, profile?.id]);

  const markRead = useCallback(async (id) => {
    if (isDemoMode) {
      const updated = demoStore.get("notifications").map(n => n.id === id ? { ...n, read: true } : n);
      demoStore.set("notifications", updated);
      setNotifications(updated);
      return;
    }
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", profile.id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [isDemoMode, refreshKey]);

  const unreadCount = notifications.filter(n => !n.read).length;
  return { notifications, loading, unreadCount, markAllRead, markRead };
}

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
