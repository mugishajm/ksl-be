// Base URL for the backend API
const API_URL = "http://localhost:9000/api";

export async function getGestures() {
  const res = await fetch(`${API_URL}/gestures`);
  if (!res.ok) throw new Error("Failed to fetch gestures");
  return res.json();
}

export async function createGesture(data: { name: string; category: string; difficulty: string; status: string }) {
  const res = await fetch(`${API_URL}/gestures`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create gesture");
  return res.json();
}

export async function getUsers() {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function inviteUser(data: { name: string; email: string; role: string }) {
  const res = await fetch(`${API_URL}/users/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to invite user");
  return res.json();
}

export async function updateUser(id: string, data: { role?: string; status?: string }) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

export async function deleteUser(id: string) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function getLogs() {
  const res = await fetch(`${API_URL}/logs`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function getReportStats(range: "7d" | "30d" | "90d" = "30d") {
  const res = await fetch(`${API_URL}/reports/stats?range=${range}`);
  if (!res.ok) throw new Error("Failed to fetch report stats");
  return res.json();
}

export async function getRecentUsers() {
  const res = await fetch(`${API_URL}/reports/recent-users`);
  if (!res.ok) throw new Error("Failed to fetch recent users");
  return res.json();
}
