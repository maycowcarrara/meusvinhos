const API_BASE = import.meta.env.VITE_API_BASE;

export async function askAI(question, vinhos, compareMode = false) {
    const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, vinhos, compareMode }), // ✅ Agora envia o compareMode
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

export async function suggestRating(vinho) {
    const prompt = `
Você é um sommelier experiente. Analise o vinho abaixo e sugira uma nota de 1 a 5 baseada em:
- Complexidade das uvas
- Teor alcoólico (equilíbrio)
- Força/corpo
- Região e prestígio

Retorne APENAS um número de 1 a 5 (sem texto).

VINHO:
${JSON.stringify(vinho)}
`;

    const res = await fetch(`${import.meta.env.VITE_API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            question: prompt,
            vinhos: [vinho]
        }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erro no /ask");

    // Extrai número da resposta (pode vir como "4" ou "Nota: 4")
    const match = data.answer.match(/[1-5]/);
    return match ? parseInt(match[0]) : 3;
}
