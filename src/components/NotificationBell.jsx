import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useNotifications } from "../hooks/useNotifications"

export default function NotificationBell() {
  const navigate = useNavigate()
  const { notifications, unreadCount, loading, markAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  const handleNotificationClick = async (n) => {
    await markAsRead(n.notification_queue_id)
    setOpen(false)

    if (n.task_id) {
      navigate(`/communication/${n.task_id}`)
    }
  }

  return (
    <div style={{ position: "relative" }}>
      {/* 🔔 Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          position: "relative"
        }}
      >
        🔔

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-10px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "11px",
              fontWeight: "bold"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* 🔽 Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            width: "340px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            maxHeight: "420px",
            overflowY: "auto",
            zIndex: 999
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px",
              borderBottom: "1px solid #eee",
              fontWeight: "bold",
              background: "#f8f9fa"
            }}
          >
            Notifications
          </div>

          {loading && (
            <div style={{ padding: "12px", textAlign: "center" }}>
              Loading...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: "12px", textAlign: "center" }}>
              No notifications
            </div>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n.notification_queue_id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #eee",
                  background: n.is_read ? "#ffffff" : "#e6f2ff",
                  cursor: "pointer",
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f1f5f9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = n.is_read
                    ? "#ffffff"
                    : "#e6f2ff")
                }
              >
                <div style={{ fontWeight: "600", fontSize: "14px" }}>
                  {n.task_title || "Workflow Update"}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#555",
                    marginTop: "4px"
                  }}
                >
                  {n.step_description || n.event_type}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    marginTop: "6px"
                  }}
                >
                  {n.event_created_at
                    ? new Date(n.event_created_at).toLocaleString()
                    : ""}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}