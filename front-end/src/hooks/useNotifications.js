/**
 * src/hooks/useNotifications.js
 * Fetches and manages notifications for the signed-in user from Supabase.
 * Table: notifications
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) {
      setNotifications((data ?? []).map((n) => ({
        id:    n.id,
        type:  n.type,
        title: n.title,
        body:  n.body,
        read:  n.read,
        time:  timeAgo(n.created_at),
      })));
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        fetchNotifications
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!profile?.id) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", profile.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [profile?.id]);

  const markRead = useCallback(async (id) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markAllRead, markRead };
}

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
