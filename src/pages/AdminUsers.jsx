import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchUsers() {
    setLoading(true)

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) setUsers(data)

    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function toggleApproval(userId, currentStatus) {
    await supabase
      .from("profiles")
      .update({ is_approved: !currentStatus })
      .eq("id", userId)

    fetchUsers()
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === "admin" ? "user" : "admin"

    await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)

    fetchUsers()
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Admin — User Management</h2>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Approved</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>

                <td>
                  <strong>
                    {user.role === "admin" ? "Admin" : "User"}
                  </strong>
                </td>

                <td>
                  {user.is_approved ? "✅ Approved" : "⏳ Pending"}
                </td>

                <td>
                  <button
                    onClick={() =>
                      toggleApproval(user.id, user.is_approved)
                    }
                  >
                    {user.is_approved ? "Revoke" : "Approve"}
                  </button>

                  <button
                    onClick={() =>
                      toggleRole(user.id, user.role)
                    }
                    style={{ marginLeft: 10 }}
                  >
                    {user.role === "admin"
                      ? "Make User"
                      : "Make Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
<Route
  path="/admin-users"
  element={
    <ProtectedRoute requireAdmin={true}>
      <AdminUsers />
    </ProtectedRoute>
  }
/>
