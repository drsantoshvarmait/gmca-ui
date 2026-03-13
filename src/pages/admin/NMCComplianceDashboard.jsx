import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

export default function NMCComplianceDashboard() {
    const [loading, setLoading] = useState(true);
    const [academicConfigs, setAcademicConfigs] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [complianceData, setComplianceData] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [intakeOverride, setIntakeOverride] = useState(null);

    useEffect(() => {
        async function fetchOrgs() {
            const { data } = await supabase.from("organisations").select("organisation_id, organisation_name").order("organisation_name");
            setOrgs(data || []);
            
            // Try to get from localStorage, but default to the first org in the list if not found
            const storedOrgId = localStorage.getItem("active_org_id");
            if (storedOrgId) {
                setSelectedOrgId(storedOrgId);
            } else if (data && data.length > 0) {
                // Find GMCA or default to first
                const gmca = data.find(o => o.organisation_name.includes('Akola'));
                setSelectedOrgId(gmca ? gmca.organisation_id : data[0].organisation_id);
            }
        }
        fetchOrgs();
    }, []);

    useEffect(() => {
        if (!selectedOrgId) return;

        async function loadData() {
            setLoading(true);
            try {
                // 1. Get Academic Configs for the org
                const { data: configs } = await supabase
                    .from("org_academic_config")
                    .select("*")
                    .eq("organisation_id", selectedOrgId);

                if (!configs || configs.length === 0) {
                    setAcademicConfigs([]);
                    setSelectedCourse("");
                    setComplianceData([]);
                    setLoading(false);
                    return;
                }

                setAcademicConfigs(configs);

                // Determine the active config based on selectedCourse or default to the first one
                const activeConfig = configs.find(c => c.course_name === selectedCourse) || configs[0];
                if (!selectedCourse) {
                    setSelectedCourse(activeConfig.course_name);
                }

                const currentIntake = intakeOverride || activeConfig.current_intake;

                // 2. Parallelize data fetching for Regulations, Assets, Units, and Faculty
                const [regsResult, assetsResult, unitsResult, facultyResult] = await Promise.all([
                    supabase.from("governance_regulations")
                        .select("*")
                        .eq("course_name", activeConfig.course_name)
                        .eq("annual_intake", currentIntake),
                    supabase.from("org_assets").select("*").eq("organisation_id", selectedOrgId),
                    supabase.from("organisation_units").select("*").eq("organisation_id", selectedOrgId),
                    supabase.from("employees").select("designations(designation_name)").eq("organisation_id", selectedOrgId)
                ]);

                const regs = regsResult.data;
                const assets = assetsResult.data;
                const units = unitsResult.data;
                const facultyData = facultyResult.data;

                const employeeCountsByDesignation = {};
                facultyData?.forEach(row => {
                    const name = row.designations?.designation_name;
                    if (name) {
                        employeeCountsByDesignation[name] = (employeeCountsByDesignation[name] || 0) + 1;
                    }
                });

                const finalData = (regs || []).map(reg => {
                    const requirements = reg.requirement_logic;

                    // Special logic for HR to form a matrix
                    if (reg.category === 'HUMAN_RESOURCE') {
                        const hrGroups = { 'Teaching': {}, 'Non-Teaching': {} };
                        const allDesignations = new Set();

                        Object.keys(requirements).forEach(key => {
                            const required = requirements[key];
                            // Parse 'Subject - Designation' e.g. 'Anatomy - Professor' or 'Non-Teaching - Librarian'
                            const parts = key.split(' - ');
                            if (parts.length === 2) {
                                const subject = parts[0];
                                const designation = parts[1];

                                const teachingGroup = subject === 'Non-Teaching' ? 'Non-Teaching' : 'Teaching';
                                const displaySubject = subject === 'Non-Teaching' ? 'Administrative / Technical' : subject;

                                if (!hrGroups[teachingGroup][displaySubject]) hrGroups[teachingGroup][displaySubject] = {};
                                hrGroups[teachingGroup][displaySubject][designation] = {
                                    required,
                                    actual: employeeCountsByDesignation[key] || 0, // In real life, query matching employees
                                };
                                allDesignations.add(designation);
                            }
                        });

                        // Subject order requested by user
                        const requestedOrder = ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Microbiology', 'Pharmacology', 'PSM', 'General Medicine'];

                        return {
                            category: reg.category,
                            isMatrix: true,
                            groups: hrGroups,
                            designations: Array.from(allDesignations).sort(),
                            subjectOrder: requestedOrder
                        }
                    }

                    // Normal list mode (Infrastructure, Equipment, etc)
                    const status = Object.keys(requirements).map(name => {
                        const required = requirements[name];
                        let actual = 0;

                        if (reg.category === 'INFRASTRUCTURE') {
                            if (name === 'Skills Lab (sqm)') {
                                // Find unit named 'Skills Lab' and get its actual_area
                                const lab = (units || []).find(u => u.unit_name_override?.includes('Skills Lab') || u.unit_name?.includes('Skills Lab'));
                                actual = lab?.actual_area || 0;
                            } else if (name === 'Teaching Departments') {
                                // Count units that are marked as departments or in the unit list
                                actual = (units || []).length;
                            } else {
                                actual = (units || []).filter(u => 
                                    u.unit_name_override?.toLowerCase().includes(name.toLowerCase()) || 
                                    u.unit_name?.toLowerCase().includes(name.toLowerCase())
                                ).length;
                            }
                        } else if (reg.category === 'EQUIPMENT') {
                            actual = (assets || []).filter(a => a.asset_name?.toLowerCase().includes(name.toLowerCase())).length;
                        } else if (reg.category === 'CLINICAL_LOAD') {
                            actual = (name === 'Bed Occupancy (%)') ? 78 : (name === 'OPD Daily Average' ? 1250 : 76); // Mock real metrics
                        }

                        return {
                            name,
                            required,
                            actual,
                            isCompliant: actual >= required
                        };
                    });

                    return {
                        category: reg.category,
                        isMatrix: false,
                        items: status
                    };
                });

                setComplianceData(finalData);

            } catch (err) {
                toast.error("Compliance Load Error: " + err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [selectedOrgId, selectedCourse, intakeOverride]);

    return (
        <div style={container}>
            <Toaster />
            <div style={header}>
                <div>
                    <h2 style={{ margin: 0 }}>NMC MSR Compliance Dashboard</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "15px", flexWrap: "wrap", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Organisation</span>
                            <select
                                value={selectedOrgId}
                                onChange={(e) => {
                                    setSelectedOrgId(e.target.value);
                                    setSelectedCourse(""); // Reset course
                                    setIntakeOverride(null); // Reset sim when org changes
                                }}
                                style={selector}
                            >
                                <option value="">-- Select --</option>
                                {orgs.map(o => (
                                    <option key={o.organisation_id} value={o.organisation_id}>{o.organisation_name}</option>
                                ))}
                            </select>
                        </div>

                        {academicConfigs.length > 0 && (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Permitted Course</span>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => {
                                            setSelectedCourse(e.target.value);
                                            setIntakeOverride(null);
                                        }}
                                        style={selector}
                                    >
                                        {academicConfigs.map(c => (
                                            <option key={c.course_name} value={c.course_name}>{c.course_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Permitted Seats</span>
                                    <select
                                        value={academicConfigs.find(c => c.course_name === selectedCourse)?.current_intake || academicConfigs[0]?.current_intake}
                                        disabled
                                        style={{ ...selector, backgroundColor: "#f1f5f9", cursor: "not-allowed", color: "#64748b" }}
                                    >
                                        <option value={academicConfigs.find(c => c.course_name === selectedCourse)?.current_intake || academicConfigs[0]?.current_intake}>
                                            {academicConfigs.find(c => c.course_name === selectedCourse)?.current_intake || academicConfigs[0]?.current_intake} Seats
                                        </option>
                                    </select>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative" }}>
                                    <span style={{ fontSize: "12px", color: "#0ea5e9", fontWeight: "600", textTransform: "uppercase" }}>Proposed Seats (Simulation)</span>
                                    <select
                                        value={intakeOverride || (academicConfigs.find(c => c.course_name === selectedCourse)?.current_intake || academicConfigs[0]?.current_intake)}
                                        onChange={(e) => setIntakeOverride(parseInt(e.target.value))}
                                        style={{ ...selector, borderColor: intakeOverride ? "#0ea5e9" : "#e2e8f0" }}
                                    >
                                        {[50, 100, 150, 200, 250].map(seats => (
                                            <option key={seats} value={seats}>{seats} Seats</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {academicConfigs.length > 0 && (
                    <div style={{ ...statusBadge, color: complianceData.every(cat => cat.items.every(i => i.isCompliant)) ? "#16a34a" : "#dc2626" }}>
                        {complianceData.every(cat => cat.items.every(i => i.isCompliant))
                            ? "✅ FULLY COMPLIANT"
                            : "⚠️ GAPS DETECTED"}
                    </div>
                )}
            </div>

            {loading && <div style={{ padding: 40 }}>Loading Compliance...</div>}

            {!loading && academicConfigs.length === 0 && selectedOrgId && (
                <div style={{ padding: 40, textAlign: "center", backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <h3>No Academic Configuration Found</h3>
                    <p style={{ color: "#64748b" }}>This organization has not been registered with any permitted courses or intake levels.</p>
                </div>
            )}

            <div style={singleCard}>
                {complianceData.length > 0 && (
                    <table style={table}>
                        <thead>
                            <tr style={thRow}>
                                <th style={th}>Norm Category / Resource</th>
                                <th style={th}>Required</th>
                                <th style={th}>Actual</th>
                                <th style={th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complianceData.map((cat, idx) => (
                                <React.Fragment key={idx}>
                                    <tr style={categoryRow}>
                                        <td colSpan={10} style={categoryTitle}>
                                            {cat.category.replace('_', ' ')} NORMS
                                        </td>
                                    </tr>
                                    {cat.isMatrix ? (
                                        // Render HR Matrix Mode
                                        <tr>
                                            <td colSpan={4} style={{ padding: 0 }}>
                                                <table style={table}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                                            <th style={th}>Type</th>
                                                            <th style={th}>Subject</th>
                                                            {cat.designations.map(desig => (
                                                                <th key={desig} style={th}>{desig}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {['Teaching'].map(group => {
                                                            const subjects = Object.keys(cat.groups[group] || {});

                                                            // Apply custom ordering for subjects, then alphabetical for the rest
                                                            subjects.sort((a, b) => {
                                                                const idxA = cat.subjectOrder.indexOf(a);
                                                                const idxB = cat.subjectOrder.indexOf(b);
                                                                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                                                if (idxA !== -1) return -1;
                                                                if (idxB !== -1) return 1;
                                                                return a.localeCompare(b);
                                                            });

                                                            return subjects.map((subject, sIdx) => (
                                                                <tr key={subject}>
                                                                    {sIdx === 0 && (
                                                                        <td rowSpan={subjects.length} style={{ ...td, fontWeight: 'bold', backgroundColor: '#fff', verticalAlign: 'top', borderRight: '1px solid #e2e8f0' }}>
                                                                            {group}
                                                                        </td>
                                                                    )}
                                                                    <td style={{ ...td, borderRight: '1px solid #e2e8f0' }}>{subject}</td>
                                                                    {cat.designations.map(desig => {
                                                                        const cell = cat.groups[group][subject][desig];
                                                                        if (!cell) return <td key={desig} style={{ ...td, backgroundColor: '#f8fafc', color: '#cbd5e1', textAlign: 'center' }}>-</td>;

                                                                        const isCompliant = cell.actual >= cell.required;
                                                                        return (
                                                                            <td key={desig} style={{ ...td, textAlign: 'center' }}>
                                                                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Req: <b>{cell.required}</b></div>
                                                                                <span style={{ ...tag, backgroundColor: isCompliant ? "#dcfce7" : "#fee2e2", color: isCompliant ? "#166534" : "#991b1b" }}>
                                                                                    {isCompliant ? cell.actual : cell.actual + " (MISSING)"}
                                                                                </span>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ));
                                                        })}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    ) : (
                                        // Render Normal List Mode
                                        cat.items.map((item, iIdx) => (
                                            <tr key={iIdx}>
                                                <td style={td}>{item.name}</td>
                                                <td style={td}>{item.required}</td>
                                                <td style={td}>{item.actual}</td>
                                                <td style={td}>
                                                    <span style={{
                                                        ...tag,
                                                        backgroundColor: item.isCompliant ? "#dcfce7" : "#fee2e2",
                                                        color: item.isCompliant ? "#166534" : "#991b1b"
                                                    }}>
                                                        {item.isCompliant ? "COMPLIANT" : "MISSING"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const selector = { padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "14px", fontWeight: "600", color: "#1e293b", outline: "none", cursor: "pointer" };
const simulationTag = { backgroundColor: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.05em" };
const container = { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const singleCard = { backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", overflowX: "auto" };
const categoryRow = { backgroundColor: "#f1f5f9" };
const categoryTitle = { padding: "12px 16px", fontSize: "14px", fontWeight: "800", color: "#334155", letterSpacing: "0.05em" };
const table = { width: "100%", borderCollapse: "collapse", minWidth: "600px" };
const thRow = { textAlign: "left", borderBottom: "2px solid #e2e8f0" };
const th = { padding: "16px", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" };
const td = { padding: "16px", fontSize: "14px", borderBottom: "1px solid #f1f5f9" };
const tag = { padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" };
const statusBadge = { padding: "10px 20px", borderRadius: "8px", background: "white", border: "1px solid #e2e8f0", fontWeight: "700", fontSize: "14px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
