import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

export default function WorkflowInspector(){

  const [data,setData] = useState([])

  useEffect(()=>{

    loadInspector()

  },[])

  async function loadInspector(){

    const {data,error} = await supabase
      .from("v_workflow_instance_inspector")
      .select("*")
      .order("started_at",{ascending:false})

    if(!error) setData(data)

  }

  return(

    <div style={{padding:20}}>

      <h2>Workflow Instance Inspector</h2>

      <table style={{width:"100%",borderCollapse:"collapse"}}>

        <thead>
          <tr>
            <th>Workflow</th>
            <th>SOP</th>
            <th>Status</th>
            <th>Step</th>
            <th>Task Status</th>
            <th>Office</th>
            <th>Started</th>
            <th>Elapsed</th>
          </tr>
        </thead>

        <tbody>

          {data.map(row=>(
            <tr key={row.task_id}>
              <td>{row.workflow_instance_id}</td>
              <td>{row.sop_id}</td>
              <td>{row.current_status}</td>
              <td>{row.current_step_id}</td>
              <td>{row.task_status}</td>
              <td>{row.office_id}</td>
              <td>{new Date(row.started_at).toLocaleString()}</td>
              <td>{row.elapsed_time}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}