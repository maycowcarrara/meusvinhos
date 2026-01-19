const API_BASE = import.meta.env.VITE_API_BASE;

export async function askAI(question, vinhos) {
    const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, vinhos }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erro no /ask");
    return data.answer;
}

export async function extractLabel(frontFile, backFile) {
    const fd = new FormData();
    fd.append("front", frontFile);
    fd.append("back", backFile);

    const res = await fetch(`${API_BASE}/extract-label`, {
        method: "POST",
        body: fd,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erro no /extract-label");
    return data.wine;
}
