import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function MyTasks() {

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {

    const user = await supabase.auth.getUser();

    const { data } = await supabase
      .from("v_my_tasks")
      .select("*")
      .eq("person_id", user.data.user.id);

    setTasks(data || []);
  }

  return (
    <div>

      <h2>My Tasks</h2>

      <table border="1">

        <thead>
          <tr>
            <th>SOP</th>
            <th>Step</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((t) => (
            <tr key={t.task_id}>
              <td>{t.sop_title}</td>
              <td>{t.step_description}</td>
              <td>{t.task_status}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}