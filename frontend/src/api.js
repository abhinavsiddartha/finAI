const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
function getToken() {
    return localStorage.getItem("token");
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
    };
}

async function handleResponse(res) {
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Something went wrong" }));
        throw new Error(err.detail || "Request failed");
    }
    if (res.status === 204) return null;
    return res.json();
}

export const register = (data) =>
    fetch(`${BASE}/users/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(handleResponse);

export const login = (data) =>
    fetch(`${BASE}/users/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(handleResponse);

export const getMe = () =>
    fetch(`${BASE}/users/me`, { headers: authHeaders() }).then(handleResponse);

export const getTransactions = () =>
    fetch(`${BASE}/transactions/`, { headers: authHeaders() }).then(handleResponse);

export const createTransaction = (data) =>
    fetch(`${BASE}/transactions/`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);

export const deleteTransaction = (id) =>
    fetch(`${BASE}/transactions/${id}`, { method: "DELETE", headers: authHeaders() }).then(handleResponse);

export const getSummary = () =>
    fetch(`${BASE}/transactions/summary`, { headers: authHeaders() }).then(handleResponse);

export const uploadCSV = (file) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${BASE}/transactions/upload-csv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
    }).then(handleResponse);
};

export const aiChat = (message) =>
    fetch(`${BASE}/ai/chat`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ message }) }).then(handleResponse);

export const getAutoInsights = () =>
    fetch(`${BASE}/ai/auto-insights`, { headers: authHeaders() }).then(handleResponse);