import { useEffect, useState } from "react"
import { supabase } from "../../services/supabaseClient"
import useEntityTranslations from "../../hooks/useEntityTranslations"

export default function OrganisationList() {
  const [organisations, setOrganisations] = useState([])

  const { getTranslation, loading } =
    useEntityTranslations("organisations")

  useEffect(() => {
    async function fetchOrganisations() {
      const { data } = await supabase
        .from("organisations")
        .select("*")
        .order("organisation_name")

      setOrganisations(data || [])
    }

    fetchOrganisations()
  }, [])

  if (loading) return <p>Loading translations...</p>

  return (
    <div>
      <h2>Organisations</h2>
      {organisations.map(o => (
        <div key={o.organisation_id}>
          {getTranslation(
            o.organisation_id,
            "organisation_name",
            o.organisation_name
          )}
        </div>
      ))}
    </div>
  )
}