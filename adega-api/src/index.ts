type Wine = {
	nome: string;
	pais: string | null;
	regiao: string | null;
	uvas: string | null;
	abv: string | null;
	safra: string | null;
	forca: number;
	poesia: string;
};

type Env = {
	GEMINI_API_KEY: string;
};

const ALLOWED_ORIGINS = [
	"https://maycowcarrara.github.io",
	"http://localhost:5173",
	"http://localhost:5174",
];

function corsHeaders(requestOrigin: string) {
	const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "86400",
	};
}

function jsonResponse(data: unknown, requestOrigin: string, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			...corsHeaders(requestOrigin),
		},
	});
}

function base64FromArrayBuffer(buf: ArrayBuffer) {
	let binary = "";
	const bytes = new Uint8Array(buf);
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

async function geminiGenerateJSON<T>(
	env: Env,
	parts: any[],
	responseJsonSchema: any
): Promise<T> {
	const url =
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
		+
		encodeURIComponent(env.GEMINI_API_KEY);

	const body = {
		contents: [{ role: "user", parts }],
		generationConfig: {
			response_mime_type: "application/json",
			response_json_schema: responseJsonSchema,
		},
	};

	const r = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!r.ok) {
		const txt = await r.text();
		throw new Error(`Gemini error ${r.status}: ${txt}`);
	}

	const out = await r.json();
	const text = out?.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!text) throw new Error("Resposta vazia do Gemini");

	return JSON.parse(text) as T;
}

async function geminiGenerateText(env: Env, prompt: string): Promise<string> {
	const url =
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
		+
		encodeURIComponent(env.GEMINI_API_KEY);

	const body = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

	const r = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!r.ok) {
		const txt = await r.text();
		throw new Error(`Gemini error ${r.status}: ${txt}`);
	}

	const out = await r.json();
	return out?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const requestOrigin = request.headers.get("Origin") || "";
		const { pathname } = new URL(request.url);

		// Preflight CORS
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders(requestOrigin) });
		}

		// Healthcheck
		if (request.method === "GET" && pathname === "/health") {
			return jsonResponse({ ok: true }, requestOrigin);
		}

		// 1) POST /extract-label
		if (request.method === "POST" && pathname === "/extract-label") {
			try {
				const form = await request.formData();
				const front = form.get("front");
				const back = form.get("back");

				if (!(front instanceof File) || !(back instanceof File)) {
					return jsonResponse(
						{ error: "Envie multipart/form-data com arquivos 'front' e 'back'." },
						requestOrigin,
						400
					);
				}

				const frontB64 = base64FromArrayBuffer(await front.arrayBuffer());
				const backB64 = base64FromArrayBuffer(await back.arrayBuffer());

				const schema = {
					type: "object",
					properties: {
						nome: { type: "string", description: "Nome do vinho (rótulo)." },
						pais: { type: ["string", "null"], description: "País de origem." },
						regiao: { type: ["string", "null"], description: "Região / denominação." },
						uvas: { type: ["string", "null"], description: "Uvas (se constar)." },
						abv: { type: ["string", "null"], description: "Teor alcoólico (ex.: 13,5%)." },
						safra: { type: ["string", "null"], description: "Ano (ou 'NV')." },
						forca: { type: "integer", minimum: 1, maximum: 5 },
						poesia: { type: "string", description: "Descrição poética curta (1–2 frases)." },
					},
					required: ["nome", "pais", "regiao", "uvas", "abv", "safra", "forca", "poesia"],
					additionalProperties: false,
				};

				const parts = [
					{
						text:
							"Você é um extrator de dados de rótulos de vinho. " +
							"Use a foto da frente e do verso. " +
							"Extraia somente o que estiver legível; se não encontrar, use null. " +
							"Para safra, use 'NV' se estiver indicado como sem safra.",
					},
					{ inlineData: { mimeType: front.type || "image/jpeg", data: frontB64 } },
					{ inlineData: { mimeType: back.type || "image/jpeg", data: backB64 } },
				];

				const wine = await geminiGenerateJSON<Wine>(env, parts, schema);

				return jsonResponse(
					{
						wine: {
							...wine,
							imgFrente: null,
							imgVerso: null,
						},
					},
					requestOrigin
				);
			} catch (err: any) {
				return jsonResponse({ error: err?.message || "Erro ao processar" }, requestOrigin, 500);
			}
		}

		// 2) POST /ask
		if (request.method === "POST" && pathname === "/ask") {
			try {
				const body = await request.json();
				const { question, vinhos } = body;

				if (typeof question !== "string" || !Array.isArray(vinhos)) {
					return jsonResponse(
						{ error: "Envie JSON: { question: string, vinhos: array }" },
						requestOrigin,
						400
					);
				}
				// PROMPT 
				const prompt =
					"Você é um sommelier experiente. Responda com base no catálogo abaixo.\n\n" +
					"Se a pergunta for sobre harmonização ou recomendações e o catálogo não tiver detalhes suficientes, " +
					"use as características dos vinhos (país, região, uvas, força, teor alcoólico) e seu conhecimento de sommelier " +
					"para sugerir qual(is) vinho(s) do catálogo seria(m) melhor(es).\n\n" +
					"IMPORTANTE: Recomende APENAS vinhos que estão no catálogo abaixo. Nunca sugira vinhos que não estão listados.\n\n" +
					"PERGUNTA:\n" +
					question +
					"\n\nCATÁLOGO:\n" +
					JSON.stringify(vinhos);


				const answer = await geminiGenerateText(env, prompt);
				return jsonResponse({ answer }, requestOrigin);
			} catch (err: any) {
				return jsonResponse({ error: err?.message || "Erro ao processar" }, requestOrigin, 500);
			}
		}

		return jsonResponse({ error: "Not found" }, requestOrigin, 404);
	},
};
