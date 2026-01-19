import { useState } from "react";
import { askAI } from "./api";

export default function AskModal({ open, onClose, vinhos }) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [compareMode, setCompareMode] = useState(false);
    const [wine1, setWine1] = useState("");
    const [wine2, setWine2] = useState("");

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

    async function handleCompare() {
        if (!wine1 || !wine2) {
            setError("Selecione 2 vinhos para comparar");
            return;
        }

        const v1 = vinhos.find(v => v.nome === wine1);
        const v2 = vinhos.find(v => v.nome === wine2);

        const prompt = `Compare detalhadamente estes dois vinhos:

VINHO 1: ${JSON.stringify(v1)}
VINHO 2: ${JSON.stringify(v2)}

Analise: corpo, força, uvas, região, harmonização, e qual você recomendaria para diferentes ocasiões.`;

        setLoading(true);
        setError("");
        setAnswer("");
        try {
            const ans = await askAI(prompt, vinhos);
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
        setCompareMode(false);
        setWine1("");
        setWine2("");
        onClose();
    }

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close-modal" onClick={handleClose}>×</span>
                <h2 style={{ fontFamily: "var(--font-title)", color: "var(--primary)", marginBottom: "20px" }}>
                    🍷 Perguntar sobre vinhos
                </h2>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={compareMode}
                            onChange={(e) => setCompareMode(e.target.checked)}
                        />
                        <span style={{ fontWeight: "700" }}>Modo comparação</span>
                    </label>
                </div>

                {!compareMode ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontWeight: "700", marginBottom: "6px" }}>
                                Vinho 1:
                            </label>
                            <select
                                value={wine1}
                                onChange={(e) => setWine1(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--border-color)",
                                }}
                            >
                                <option value="">Selecione...</option>
                                {vinhos.map(v => (
                                    <option key={v.nome} value={v.nome}>{v.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontWeight: "700", marginBottom: "6px" }}>
                                Vinho 2:
                            </label>
                            <select
                                value={wine2}
                                onChange={(e) => setWine2(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--border-color)",
                                }}
                            >
                                <option value="">Selecione...</option>
                                {vinhos.map(v => (
                                    <option key={v.nome} value={v.nome}>{v.nome}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleCompare}
                            disabled={loading || !wine1 || !wine2}
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
                            {loading ? "Comparando..." : "Comparar vinhos"}
                        </button>
                    </>
                )}

                {error && (
                    <div style={{ marginTop: "15px", padding: "12px", background: "#fee", borderRadius: "8px", color: "#a33" }}>
                        ❌ {error}
                    </div>
                )}

                {answer && (
                    <div style={{ marginTop: "20px" }}>
                        <h3 style={{ fontFamily: "var(--font-title)", color: "var(--accent)", marginBottom: "8px" }}>
                            {compareMode ? "Comparação:" : "Resposta:"}
                        </h3>
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
