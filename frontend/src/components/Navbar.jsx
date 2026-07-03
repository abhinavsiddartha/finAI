import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <span className="logo-icon">₹</span>
                <span>FinAI</span>
            </div>
            <div className="nav-links">
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
                <NavLink to="/transactions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Transactions</NavLink>
                <NavLink to="/ai" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>AI Assistant</NavLink>
            </div>
            <div className="nav-user">
                <span className="user-name">👤 {user?.name}</span>
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
}