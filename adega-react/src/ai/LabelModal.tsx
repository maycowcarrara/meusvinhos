import { useState } from "react";
import { extractLabel } from "./api";

export default function LabelModal({ open, onClose }) {
    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!open) return null;

    async function handleExtract() {
        if (!frontFile || !backFile) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const wine = await extractLabel(frontFile, backFile);
            setResult(wine);
        } catch (err) {
            setError(err?.message ?? String(err));
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setFrontFile(null);
        setBackFile(null);
        setResult(null);
        setError("");
        onClose?.();
    }

    function copyJSON() {
        if (!result) return;
        const json = JSON.stringify(result, null, 2);
        navigator.clipboard.writeText(json);
        alert("JSON copiado para a área de transferência!");
    }

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close-modal" onClick={handleClose}>
                    ×
                </span>

                <h2
                    style={{
                        fontFamily: "var(--font-title)",
                        color: "var(--primary)",
                        marginBottom: "20px",
                    }}
                >
                    📸 Adicionar rótulo (IA)
                </h2>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", fontWeight: "700", marginBottom: "6px" }}>
                        Foto frente:
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
                        style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", fontWeight: "700", marginBottom: "6px" }}>
                        Foto verso:
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                        style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)",
                        }}
                    />
                </div>

                <button
                    onClick={handleExtract}
                    disabled={loading || !frontFile || !backFile}
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
                    {loading ? "Analisando..." : "Analisar rótulo"}
                </button>

                {error && (
                    <div
                        style={{
                            marginTop: "15px",
                            padding: "12px",
                            background: "#fee",
                            borderRadius: "8px",
                            color: "#a33",
                        }}
                    >
                        ❌ {error}
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: "20px" }}>
                        <h3
                            style={{
                                fontFamily: "var(--font-title)",
                                color: "var(--accent)",
                                marginBottom: "8px",
                            }}
                        >
                            Resultado (cole no array vinhos):
                        </h3>

                        <textarea
                            readOnly
                            value={JSON.stringify(result, null, 2)}
                            rows={12}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid var(--border-color)",
                                fontFamily: "monospace",
                                fontSize: "0.85em",
                                background: "rgba(0,0,0,0.03)",
                                resize: "vertical",
                            }}
                        />

                        <button
                            onClick={copyJSON}
                            style={{
                                marginTop: "10px",
                                padding: "8px 16px",
                                background: "var(--accent)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "700",
                            }}
                        >
                            📋 Copiar JSON
                        </button>

                        <p style={{ marginTop: "8px", fontSize: "0.85em", color: "var(--text-muted)" }}>
                            ⚠️ Lembre-se de adicionar <code>imgFrente</code> e <code>imgVerso</code>{" "}
                            manualmente (ex.: "images/20260119_...jpg")
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
