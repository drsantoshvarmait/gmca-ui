import SchemaView from "./SchemaView"
import FunctionsView from "./FunctionsView"
import TriggersView from "./TriggersView"
import RLSView from "./RLSView"
import RpcContractsView from "./RpcContractsView"
import MetaDashboard from "./MetaDashboard"
import MasterDataCleanup from "./MasterDataCleanup"

import DocsViewer from "../DocsViewer"
import AdminUsers from "../AdminUsers"
import OrganisationManagement from "./OrganisationManagement"
import AdminNotifications from "./AdminNotifications"
import AdminSettings from "./AdminSettings"
import SuperTenantManager from "./SuperTenantManager"
import AdminWorkflows from "./AdminWorkflows"
import FinanceDashboard from "../FinanceDashboard"
import NMCComplianceDashboard from "./NMCComplianceDashboard"
import HRModule from "./HRModule"
import AllocationTracker from "./AllocationTracker"
import SpacesManager from "./SpacesManager"
import SubUnitMasterManager from "./SubUnitMasterManager"
import UnitMasterManager from "./UnitMasterManager"

const isDev = import.meta.env.VITE_APP_ENV === "DEV" || !import.meta.env.VITE_APP_ENV;

export const adminModules = [

  // --- MASTER DATA & SPACES ---
  {
    id: "masters",
    label: "Masters",
    subModules: [
      { 
        id: "tenants", 
        label: "Tenants", 
        component: SuperTenantManager,
        visibility: (ctx) => !ctx.contextCode 
      },
      { 
        id: "organisations", 
        label: "Affiliated Organisations", 
        component: OrganisationManagement,
        visibility: (ctx) => !!ctx.contextCode 
      },
      { id: "spaces", label: "Organisation Types", component: SpacesManager },
      { id: "unit_masters", label: "Units", component: UnitMasterManager },
      { id: "sub_unit_masters", label: "Sub-Units", component: SubUnitMasterManager },
    ]
  },

  // --- IDENTITY & ORG HIERARCHY ---
  {
    id: "directory",
    label: "Directory",
    subModules: [
      { id: "allocation_tracker", label: "Allocation & Status Tracker", component: AllocationTracker },
      { id: "users", label: "Users", component: AdminUsers }
    ]
  },

  // --- BUSINESS LOGIC & OPERATIONS ---
  {
    id: "modules",
    label: "Modules",
    subModules: [
      { id: "workflows", label: "Workflows", component: AdminWorkflows },
      { id: "nmc_msr", label: "NMC MSR", component: NMCComplianceDashboard },
      { 
          id: "compliance_dashboard", 
          label: "NMC MSR Compliance Dashboard", 
          component: NMCComplianceDashboard,
          visibility: (context) => context.isMedicalCollege // Custom filtering logic
      },
      { id: "hr", label: "HR & Recruitment", component: HRModule },
      { id: "finance", label: "Finance", component: FinanceDashboard }
    ]
  },

  // --- DEVELOPER TOOLS & INFRASTRUCTURE ---
  ...(isDev ? [
    {
      id: "developer",
      label: "Developer",
      subModules: [
        { id: "docs", label: "System Docs", component: DocsViewer },
        { id: "schema", label: "Data Schema", component: SchemaView },
        { id: "functions", label: "Functions", component: FunctionsView },
        { id: "rpc", label: "RPC Contracts", component: RpcContractsView },
        { id: "triggers", label: "Triggers", component: TriggersView },
        { id: "rls", label: "RLS Policies", component: RLSView },
        { id: "meta", label: "Insights Dashboard", component: MetaDashboard },
        { id: "cleanup", label: "Master Data Cleanup", component: MasterDataCleanup },
        { id: "settings", label: "Settings", component: AdminSettings }
      ]
    }
  ] : [
    {
      id: "system",
      label: "System",
      subModules: [
        { id: "docs", label: "Project Docs", component: DocsViewer },
        { id: "settings", label: "Settings", component: AdminSettings }
      ]
    }
  ]),

  { id: "notifications", label: "Notifications", component: AdminNotifications }
]