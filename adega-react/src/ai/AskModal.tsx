import { useState } from "react";
import { askAI } from "./api";

export default function AskModal({ open, onClose, vinhos }) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!open) return null;

    async function handleAsk() {
        if (!question.trim()) return;
        setLoading(true);
        setError("");
        setAnswer("");
        try {
            const ans = await askAI(question, vinhos);
            setAnswer(ans);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setQuestion("");
        setAnswer("");
        setError("");
        onClose();
    }

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close-modal" onClick={handleClose}>×</span>
                <h2 style={{ fontFamily: "var(--font-title)", color: "var(--primary)", marginBottom: "20px" }}>
                    🍷 Perguntar sobre vinhos
                </h2>

                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ex.: Quais vinhos são de Portugal? Qual tem maior teor alcoólico?"
                    rows={4}
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.95em",
                        marginBottom: "12px",
                        resize: "vertical",
                    }}
                />

                <button
                    onClick={handleAsk}
                    disabled={loading || !question.trim()}
                    style={{
                        padding: "10px 20px",
                        background: "var(--primary)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: loading ? "wait" : "pointer",
                        fontWeight: "700",
                        fontSize: "0.95em",
                    }}
                >
                    {loading ? "Consultando IA..." : "Perguntar"}
                </button>

                {error && (
                    <div style={{ marginTop: "15px", padding: "12px", background: "#fee", borderRadius: "8px", color: "#a33" }}>
                        ❌ {error}
                    </div>
                )}

                {answer && (
                    <div style={{ marginTop: "20px" }}>
                        <h3 style={{ fontFamily: "var(--font-title)", color: "var(--accent)", marginBottom: "8px" }}>Resposta:</h3>
                        <div
                            style={{
                                padding: "12px",
                                background: "rgba(0,0,0,0.03)",
                                borderRadius: "8px",
                                whiteSpace: "pre-wrap",
                                lineHeight: "1.6",
                            }}
                        >
                            {answer}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
