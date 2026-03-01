import { useEffect } from "react"
import { supabase } from "../../supabaseClient"

export default function useMetaRealtime(refreshCallback) {
  useEffect(() => {
    const channel = supabase
      .channel("meta-schema-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meta_tables" },
        refreshCallback
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meta_columns" },
        refreshCallback
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meta_functions" },
        refreshCallback
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meta_policies" },
        refreshCallback
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshCallback])
}
