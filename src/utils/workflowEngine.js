import { supabase } from "../supabaseClient"

export async function startWorkflow({
  eventId,
  sopId,
  subjectId,
  personId
}) {

  const { data, error } = await supabase.rpc(
    "start_workflow_instance",
    {
      p_event_id: eventId,
      p_sop_id: sopId,
      p_subject_id: subjectId,
      p_started_by: personId
    }
  )

  if (error) {
    console.error("Workflow start failed:", error)
    throw error
  }

  return data
}