import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    setLoading(true)

    const { data, error } = await supabase
    .from("v_notification_inapp")
    .select("*")
    .order("event_created_at", { ascending: false })

    if (!error && data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }

    setLoading(false)
  }

  const markAsRead = async (id) => {
    await supabase
      .from("notification_queue")
      .update({
        is_read: true,
        read_at: new Date()
      })
      .eq("notification_queue_id", id)

    fetchNotifications()
  }

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel("notification-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_queue"
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead
  }
}