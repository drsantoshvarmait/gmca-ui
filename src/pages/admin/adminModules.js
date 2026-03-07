import SchemaView from "./SchemaView"
import FunctionsView from "./FunctionsView"
import TriggersView from "./TriggersView"
import RLSView from "./RLSView"
import RpcContractsView from "./RpcContractsView"
import MetaDashboard from "./MetaDashboard"

import DocsViewer from "../DocsViewer"
import WorkflowVisualizer from "../WorkflowVisualizer"
import WorkflowBuilder from "../WorkflowBuilder"

import AdminUsers from "../AdminUsers"
import WorkflowInstances from "./WorkflowInstances"
import AdminOrganizations from "./AdminOrganizations"
import AdminNotifications from "./AdminNotifications"
import AdminSettings from "./AdminSettings"

export const adminModules = [

  { id: "schema", label: "Schema", component: SchemaView },

  { id: "functions", label: "Functions", component: FunctionsView },

  { id: "triggers", label: "Triggers", component: TriggersView },

  { id: "rls", label: "RLS Policies", component: RLSView },

  { id: "rpc", label: "RPC Contracts", component: RpcContractsView },

  { id: "meta", label: "Meta", component: MetaDashboard },

  { id: "docs", label: "Docs", component: DocsViewer },

  {
    id: "workflow",
    label: "Workflow Visualizer",
    component: WorkflowVisualizer,
    props: { sop_id: "4b16b820-c13a-4263-a183-8635c14fbf1a" }
  },

  {
    id: "builder",
    label: "Workflow Builder",
    component: WorkflowBuilder,
    props: { sop_id: "4b16b820-c13a-4263-a183-8635c14fbf1a" }
  },

  { id: "users", label: "Users", component: AdminUsers },

  { id: "instances", label: "Workflow Instances", component: WorkflowInstances },

  { id: "orgs", label: "Organizations", component: AdminOrganizations },

  { id: "notifications", label: "Notifications", component: AdminNotifications },

  { id: "settings", label: "Settings", component: AdminSettings }

]