import { useEffect } from "react"
import { supabase } from "../supabaseClient"
import toast, { Toaster } from "react-hot-toast"
import { useNavigate } from "react-router-dom"

export default function ToastProvider({ user }) {

  const navigate = useNavigate()

  useEffect(() => {

    if (!user?.id) return

    const channel = supabase
      .channel("notifications-toast")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "core",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {

          const notification = payload.new

          toast.dismiss()

          toast(
            (t) => (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => {

                  toast.dismiss(t.id)

                  if (notification.order_id) {
                    navigate(`/task/${notification.order_id}`)
                  }

                }}
              >
                <b>🔔 Notification</b>
                <div>{notification.message}</div>
              </div>
            ),
            { duration: 5000 }
          )

        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }

  }, [user?.id, navigate])

  return <Toaster position="top-right" />
}