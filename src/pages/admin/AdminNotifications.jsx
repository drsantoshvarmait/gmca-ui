import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function AdminNotifications() {

  const [notifications, setNotifications] = useState([])

  async function load() {

    const { data } = await supabase
      .from("notification_queue")
      .select("*")
      .order("created_at", { ascending: false })

    setNotifications(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>

      <h3>System Notifications</h3>

      <table border="1" cellPadding="6">

        <thead>
          <tr>
            <th>Message</th>
            <th>User</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {notifications.map(n => (
            <tr key={n.notification_id}>
              <td>{n.message}</td>
              <td>{n.user_id}</td>
              <td>{n.status}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}