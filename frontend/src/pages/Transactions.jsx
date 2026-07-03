import React from "react";
import { useEffect, useState } from "react";
import { getTransactions, createTransaction, deleteTransaction, uploadCSV } from "../api";

const CATEGORIES = ["Food", "Housing", "Transport", "Entertainment", "Health", "Shopping", "Education", "Salary", "Investment", "Other"];

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [form, setForm] = useState({ title: "", amount: "", type: "expense", category: "Food", note: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");

    const load = () => getTransactions().then(setTransactions).catch(console.error);

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await createTransaction({ ...form, amount: parseFloat(form.amount) });
            setForm({ title: "", amount: "", type: "expense", category: "Food", note: "" });
            load();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this transaction?")) return;
        await deleteTransaction(id);
        load();
    };

    const handleCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await uploadCSV(file);
            alert(res.message);
            load();
        } catch (err) {
            alert("CSV upload failed: " + err.message);
        }
    };

    const filtered = filter === "all" ? transactions : transactions.filter(t => t.type === filter);

    return (
        <div className="page">
            <h2 className="page-title">Transactions</h2>
            <div className="form-card">
                <h3>Add Transaction</h3>
                <form onSubmit={handleSubmit} className="tx-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Grocery" required />
                    </div>
                    <div className="form-group">
                        <label>Amount (₹)</label>
                        <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500" required min="1" />
                    </div>
                    <div className="form-group">
                        <label>Type</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Note (optional)</label>
                        <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Any extra details" />
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Adding..." : "Add Transaction"}</button>
                </form>
                <div className="csv-upload">
                    <label className="btn-secondary" style={{ cursor: "pointer" }}>
                        📂 Import CSV
                        <input type="file" accept=".csv" onChange={handleCSV} style={{ display: "none" }} />
                    </label>
                    <span className="csv-hint">Format: title, amount, type, category, note</span>
                </div>
            </div>
            <div className="filter-tabs">
                {["all", "income", "expense"].map(f => (
                    <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>
            <div className="tx-list">
                {filtered.length === 0 && <p className="empty-msg">No transactions found.</p>}
                {filtered.map(tx => (
                    <div key={tx.id} className={`tx-item ${tx.type}`}>
                        <div className="tx-left">
                            <span className="tx-category">{tx.category}</span>
                            <span className="tx-title">{tx.title}</span>
                            {tx.note && <span className="tx-note">{tx.note}</span>}
                        </div>
                        <div className="tx-right">
                            <span className="tx-amount">{tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString()}</span>
                            <span className="tx-date">{new Date(tx.date).toLocaleDateString()}</span>
                            <button className="btn-delete" onClick={() => handleDelete(tx.id)}>✕</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}