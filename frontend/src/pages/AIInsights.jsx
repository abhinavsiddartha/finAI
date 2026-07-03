import React from "react"; 
import { useState, useRef, useEffect } from "react";
import { aiChat } from "../api";

const SUGGESTIONS = [
    "Where am I spending the most?",
    "How can I save more this month?",
    "Am I spending too much on food?",
    "Give me a monthly budget plan",
];

export default function AIInsights() {
    const [messages, setMessages] = useState([
        { role: "bot", text: "👋 Hi! I'm FinBot, your AI finance assistant. Ask me anything about your spending!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg) return;
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: msg }]);
        setLoading(true);
        try {
            const res = await aiChat(msg);
            setMessages(prev => [...prev, { role: "bot", text: res.reply }]);
        } catch {
            setMessages(prev => [...prev, { role: "bot", text: "Sorry, I couldn't process that. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <h2 className="page-title">AI Finance Assistant</h2>
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-bubble ${m.role}`}>
                            {m.role === "bot" && <span className="bot-avatar">🤖</span>}
                            <div className="bubble-text">
                                {m.text.split("\n").map((line, j) => <p key={j}>{line}</p>)}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-bubble bot">
                            <span className="bot-avatar">🤖</span>
                            <div className="bubble-text typing">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
                <div className="suggestions">
                    {SUGGESTIONS.map((s, i) => (
                        <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                    ))}
                </div>
                <div className="chat-input-row">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        placeholder="Ask about your finances..."
                        disabled={loading}
                    />
                    <button className="btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>Send</button>
                </div>
            </div>
        </div>
    );
}
