import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function WorkflowHealth() {

  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from("v_workflow_health_dashboard")
      .select("*");

    setData(data || []);
  }

  return (
    <div>
      <h2>Workflow Health</h2>

      <table border="1">
        <thead>
          <tr>
            <th>Organisation</th>
            <th>In Progress</th>
            <th>Completed</th>
            <th>Locked</th>
            <th>SLA Breach</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.organisation_name}>
              <td>{row.organisation_name}</td>
              <td>{row.tasks_in_progress}</td>
              <td>{row.tasks_completed}</td>
              <td>{row.locked_tasks}</td>
              <td>{row.possible_sla_breach}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}