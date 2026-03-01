import { useEffect, useState, useMemo } from "react"
import { supabase } from "../services/supabaseClient"
import { useLanguage } from "../context/LanguageContext"

export default function useEntityTranslations(entityType) {
  const { language } = useLanguage()

  const [translations, setTranslations] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!entityType || !language) return

    let isMounted = true

    async function fetchTranslations() {
      setLoading(true)

      const { data, error } = await supabase.rpc(
        "get_entity_translations_bulk",
        {
          p_entity_type: entityType,
          p_language_code: language
        }
      )

      if (error) {
        setError(error)
        setLoading(false)
        return
      }

      if (!isMounted) return

      const map = {}

      data?.forEach(row => {
        if (!map[row.entity_id]) {
          map[row.entity_id] = {}
        }
        map[row.entity_id][row.field_name] = row.translated_value
      })

      setTranslations(map)
      setLoading(false)
    }

    fetchTranslations()

    return () => {
      isMounted = false
    }
  }, [entityType, language])

  const getTranslation = useMemo(() => {
    return (entityId, fieldName, fallbackValue = "") => {
      return (
        translations?.[entityId]?.[fieldName] ??
        fallbackValue
      )
    }
  }, [translations])

  return {
    translations,
    getTranslation,
    loading,
    error
  }
}