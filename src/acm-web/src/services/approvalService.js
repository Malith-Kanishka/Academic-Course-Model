const API_BASE = "http://localhost:5000/api/approval";

export const fetchPendingApprovals = async () => {
  try {
    const response = await fetch(`${API_BASE}/pending`);
    if (!response.ok) throw new Error("Failed to fetch pending approvals");
    return await response.json();
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    // Return mock data for isolated frontend testing if API is offline
    return [
      {
        id: "b21e4270-4286-4e55-8961-34df729df999",
        studentId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        approvalStatus: "PAUSED_FOR_PROFESSOR_APPROVAL",
        actionItems: [
          "Review & re-study concept: Confused Dependency Injection lifetimes (Transient vs Singleton)"
        ],
        createdAt: new Date().toISOString()
      }
    ];
  }
};

export const submitApprovalDecision = async (planId, status, notes) => {
  const response = await fetch(`${API_BASE}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, status, notes })
  });
  if (!response.ok) throw new Error("Failed to submit decision");
  return await response.json();
};