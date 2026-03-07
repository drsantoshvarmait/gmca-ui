import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function AdminOrganizations() {

  const [orgs, setOrgs] = useState([])

  async function load() {

    const { data } = await supabase
      .from("organisations")
      .select("*")
      .order("organisation_name")

    setOrgs(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>

      <h3>Organizations</h3>

      <table border="1" cellPadding="6">

        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
          </tr>
        </thead>

        <tbody>

          {orgs.map(o => (
            <tr key={o.organisation_id}>
              <td>{o.organisation_id}</td>
              <td>{o.organisation_name}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}
