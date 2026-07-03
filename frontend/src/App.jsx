import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AIInsights from "./pages/AIInsights";

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen">Loading...</div>;
    return user ? children : <Navigate to="/" />;
}

function AppLayout({ children }) {
    return (
        <>
            <Navbar />
            <main className="main-content">{children}</main>
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AuthPage />} />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <AppLayout><Dashboard /></AppLayout>
                        </PrivateRoute>
                    } />
                    <Route path="/transactions" element={
                        <PrivateRoute>
                            <AppLayout><Transactions /></AppLayout>
                        </PrivateRoute>
                    } />
                    <Route path="/ai" element={
                        <PrivateRoute>
                            <AppLayout><AIInsights /></AppLayout>
                        </PrivateRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}