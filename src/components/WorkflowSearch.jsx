import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function WorkflowSearch() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  async function search() {

    const { data } = await supabase
      .from("v_universal_workflow_search")
      .select("*")
      .ilike("sop_title", `%${query}%`);

    setResults(data || []);
  }

  return (
    <div>

      <h2>Workflow Search</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search SOP"
      />

      <button onClick={search}>Search</button>

      <ul>
        {results.map((r) => (
          <li key={r.task_id}>
            {r.sop_title} - {r.task_status}
          </li>
        ))}
      </ul>

    </div>
  );
}