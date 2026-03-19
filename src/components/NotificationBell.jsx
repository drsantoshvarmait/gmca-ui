import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../supabaseClient"
import { toast } from "react-hot-toast"

export default function NotificationBell() {

  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const dropdownRef = useRef(null)

  useEffect(() => {
    loadNotifications()

    // realtime refresh

  }, [])

  // close dropdown when clicking outside
  useEffect(() => {

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }

  }, [])

  async function loadNotifications() {

    setLoading(true)

    const { data, error } = await supabase
      .from("v_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (!error && data) {
      setNotifications(data)
    }

    setLoading(false)
  }

  const unreadCount = notifications.filter(n => !(n.is_read || n.read)).length

  async function markAsRead(id) {

    const { error } = await supabase
      .from("notification_queue")
      .update({ is_read: true })
      .eq("notification_queue_id", id)

    if (!error) {
      setNotifications(prev =>
        prev.map(n =>
          n.notification_queue_id === id ? { ...n, is_read: true, read: true } : n
        )
      )
    }
  }

  async function handleClick(n) {

    await markAsRead(n.notification_queue_id)

    setOpen(false)

    if (n.task_id) {
      navigate(`/task/${n.task_id}`)
    }
  }

  return (

    <div ref={dropdownRef} style={{ position: "relative" }}>

      {/* Bell Button */}

      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 20,
          position: "relative"
        }}
      >
        🔔

        {unreadCount > 0 && (
          <span
            style={{
              color: "white",
              background: "red",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: 12,
              position: "absolute",
              top: -6,
              right: -10
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}

      {open && (

        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            width: 320,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            maxHeight: 400,
            overflowY: "auto",
            zIndex: 1000
          }}
        >

          {loading && (
            <div style={{ padding: 12 }}>
              Loading notifications...
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>
              <button 
                onClick={async () => {
                   const unreadIds = notifications.filter(n => !(n.is_read || n.read)).map(n => n.notification_queue_id);
                   if (unreadIds.length > 0) {
                      const { error } = await supabase
                        .from("notification_queue")
                        .update({ is_read: true })
                        .in("notification_queue_id", unreadIds);
                      
                      if (!error) {
                        setNotifications(notifications.map(n => ({ ...n, is_read: true, read: true })));
                        toast.success("All notifications cleared");
                      }
                   }
                }}
                style={{ fontSize: '11px', color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '700' }}
              >
                Mark all as read
              </button>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: 12 }}>
              No notifications
            </div>
          )}

          {!loading && notifications.map(n => (

            <div
              key={n.notification_queue_id}
              onClick={() => handleClick(n)}
              style={{
                padding: 12,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                background: (n.is_read || n.read) ? "#fff" : "#eef6ff"
              }}
            >

              <div style={{ fontSize: 14 }}>
                {n.message || "Workflow update"}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#666",
                  marginTop: 4
                }}
              >
                {new Date(n.created_at).toLocaleString()}
              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  )
}