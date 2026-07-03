import React from "react"; 
import { useEffect, useState } from "react";
import { getSummary, getAutoInsights } from "../api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6"];

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [insights, setInsights] = useState("");
    const [insightsLoading, setInsightsLoading] = useState(false);

    useEffect(() => {
        getSummary().then(setSummary).catch(console.error);
    }, []);

    const loadInsights = async () => {
        setInsightsLoading(true);
        try {
            const res = await getAutoInsights();
            setInsights(res.insights);
        } catch (e) {
            setInsights("Could not load insights.");
        } finally {
            setInsightsLoading(false);
        }
    };

    const pieData = summary ? Object.entries(summary.by_category).map(([name, value]) => ({ name, value })) : [];
    const barData = summary ? Object.entries(summary.monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, vals]) => ({ month, Income: vals.income, Expenses: vals.expense })) : [];

    return (
        <div className="page">
            <h2 className="page-title">Dashboard</h2>
            {summary && (
                <>
                    <div className="cards-grid">
                        <div className="card card-green">
                            <span className="card-label">Total Income</span>
                            <span className="card-value">₹{summary.total_income.toLocaleString()}</span>
                        </div>
                        <div className="card card-red">
                            <span className="card-label">Total Expenses</span>
                            <span className="card-value">₹{summary.total_expense.toLocaleString()}</span>
                        </div>
                        <div className="card card-blue">
                            <span className="card-label">Balance</span>
                            <span className="card-value">₹{summary.balance.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>Spending by Category</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-card">
                            <h3>Monthly Income vs Expenses</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3a" />
                                    <XAxis dataKey="month" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
            <div className="insights-card">
                <div className="insights-header">
                    <h3>🤖 AI Insights</h3>
                    <button className="btn-secondary" onClick={loadInsights} disabled={insightsLoading}>
                        {insightsLoading ? "Analyzing..." : "Generate Insights"}
                    </button>
                </div>
                {insights && <div className="insights-text">{insights.split("\n").map((line, i) => <p key={i}>{line}</p>)}</div>}
                {!insights && !insightsLoading && <p className="insights-placeholder">Click "Generate Insights" to get AI-powered analysis.</p>}
            </div>
        </div>
    );
}