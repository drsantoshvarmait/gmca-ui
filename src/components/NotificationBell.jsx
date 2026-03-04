import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

export default function NotificationBell() {

  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {

    const { data } = await supabase
      .from("v_my_notifications")
      .select("*")
      .order("created_at", { ascending: false })

    setNotifications(data || [])
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  async function markAsRead(id) {

    await supabase
      .from("notification_queue")
      .update({ is_read: true })
      .eq("notification_queue_id", id)

    loadNotifications()
  }

  async function handleClick(n) {

    await markAsRead(n.notification_queue_id)

    if (n.task_id) {
      navigate(`/task/${n.task_id}`)
    }
  }

  return (

    <div style={{ position: "relative" }}>

      <button
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
      >
        🔔 {unreadCount > 0 && <span style={{ color: "red" }}>({unreadCount})</span>}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          width: 320,
          background: "white",
          border: "1px solid #ddd",
          borderRadius: 6
        }}>

          {notifications.map(n => (
            <div
              key={n.notification_queue_id}
              onClick={() => handleClick(n)}
              style={{
                padding: 12,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                background: n.is_read ? "#fff" : "#eef6ff"
              }}
            >
              <div>{n.message || "Workflow update"}</div>
            </div>
          ))}

        </div>
      )}

    </div>
  )
}