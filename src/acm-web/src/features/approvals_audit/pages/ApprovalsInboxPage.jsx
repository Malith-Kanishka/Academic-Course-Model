import React, { useEffect, useState } from "react";
import { fetchPendingApprovals, submitApprovalDecision } from "../../../services/approvalService";

export default function ApprovalsInboxPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    const data = await fetchPendingApprovals();
    setPlans(data);
    setLoading(false);
  };

  const handleDecision = async (planId, status) => {
    try {
      await submitApprovalDecision(planId, status, notes[planId] || "");
      alert(`Plan updated to: ${status}`);
      loadApprovals(); // Refresh list after decision
    } catch (err) {
      alert("Error submitting decision: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading pending approvals...</div>;

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif", maxWidth: "800px" }}>
      <h2>Professor Approval Inbox (Human-in-the-Loop)</h2>
      <p style={{ color: "#666" }}>
        Review automated evaluations and authorize remedial plans before release to students.
      </p>

      {plans.length === 0 ? (
        <div style={{ padding: "16px", backgroundColor: "#e8f5e9", borderRadius: "8px" }}>
          No pending approvals requiring review.
        </div>
      ) : (
        plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
              backgroundColor: "#fff"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Student ID: {plan.studentId}</strong>
              <span
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#fff3cd",
                  color: "#856404",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}
              >
                {plan.approvalStatus}
              </span>
            </div>

            <div style={{ marginTop: "12px" }}>
              <strong>Flagged Remedial Action Items:</strong>
              <ul>
                {plan.actionItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: "12px" }}>
              <input
                type="text"
                placeholder="Add optional professor feedback/notes..."
                value={notes[plan.id] || ""}
                onChange={(e) => setNotes({ ...notes, [plan.id]: e.target.value })}
                style={{ width: "100%", padding: "8px", marginBottom: "8px", boxSizing: "border-box" }}
              />
              <button
                onClick={() => handleDecision(plan.id, "APPROVED_ACTIVE")}
                style={{
                  backgroundColor: "#2e7d32",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  marginRight: "8px",
                  cursor: "pointer"
                }}
              >
                Authorize Remedial Plan
              </button>
              <button
                onClick={() => handleDecision(plan.id, "REJECTED")}
                style={{
                  backgroundColor: "#c62828",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Reject / Request Retake
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}