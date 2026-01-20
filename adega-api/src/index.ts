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
	DEEPSEEK_API_KEY: string;
	GROQ_API_KEY: string;
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

async function deepseekGenerateText(env: Env, prompt: string): Promise<string> {
	const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
		},
		body: JSON.stringify({
			model: "deepseek-chat",
			messages: [{ role: "user", content: prompt }],
		}),
	});

	if (!res.ok) {
		const txt = await res.text();
		throw new Error(`DeepSeek error ${res.status}: ${txt}`);
	}

	const data = await res.json();
	return data.choices[0].message.content;
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

async function groqGenerateText(env: Env, prompt: string): Promise<string> {
	const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${env.GROQ_API_KEY}`,
		},
		body: JSON.stringify({
			model: "llama-3.3-70b-versatile",  // Modelo rápido e gratuito
			messages: [{ role: "user", content: prompt }],
			temperature: 0.7,
			max_tokens: 2000,
		}),
	});

	if (!res.ok) {
		const txt = await res.text();
		throw new Error(`Groq error ${res.status}: ${txt}`);
	}

	const data = await res.json();
	return data.choices[0].message.content;
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
					"Você é um sommelier experiente que responde com base EXCLUSIVAMENTE no catálogo de vinhos fornecido.\n\n" +
					"REGRAS GERAIS:\n" +
					"- O catálogo vem como uma lista de objetos JSON com campos como nome, país, região, uvas, teor alcoólico, safra, força, poesia e status.\n" +
					"- Nunca invente vinhos que não estejam no catálogo.\n" +
					"- Quando citar um vinho, use as informações do catálogo (país, região, uvas, força, teor alcoólico etc.).\n\n" +
					"SOBRE O CAMPO status:\n" +
					"- Cada vinho pode ter um campo status com valores como 'available', 'reserved' ou 'consumed'.\n" +
					"- 'available'  = vinho disponível na adega.\n" +
					"- 'reserved'   = garrafa(s) reservada(s) para alguém ou para uma ocasião específica.\n" +
					"- 'consumed'   = vinho já consumido (sem garrafas disponíveis).\n" +
					"- Se algum vinho NÃO tiver status definido, assuma 'available'.\n\n" +
					"REGRAS PARA DISPONIBILIDADE:\n" +
					"1) Se a pergunta do usuário envolver disponibilidade, abrir garrafas, o que beber agora, o que recomendar para hoje, o que tenho para harmonizar, etc.:\n" +
					"   - Priorize SEMPRE vinhos com status 'available'.\n" +
					"   - NÃO recomende vinhos com status 'consumed'. Você pode mencioná-los apenas como histórico, deixando claro que estão esgotados.\n" +
					"   - Vinhos com status 'reserved' só podem ser sugeridos se fizer sentido avisar claramente que estão reservados, por exemplo: 'Este vinho está reservado, mas seria uma boa opção se for liberado'.\n" +
					"   - Ao listar ou recomendar vinhos, deixe claro na resposta o status deles sempre que a pergunta envolver disponibilidade/estoque.\n\n" +
					"2) Se a pergunta for apenas informativa (por exemplo: características de um vinho, comparação teórica, histórico, estilos, países, uvas):\n" +
					"   - Você pode usar qualquer vinho do catálogo (available, reserved ou consumed).\n" +
					"   - Se mencionar vinhos que não estão disponíveis (status 'consumed' ou 'reserved'), deixe isso explícito de forma breve, por exemplo: 'já consumido', 'atualmente reservado'.\n\n" +
					"3) Listas de recomendação em geral:\n" +
					"   - Em listas do tipo 'melhores opções para X', foque em vinhos 'available'.\n" +
					"   - Só inclua 'reserved' ou 'consumed' se o objetivo for histórico ou comparação e você indicar claramente esse status.\n\n" +
					"FORMATO DA RESPOSTA:\n" +
					"- Responda em português, de forma clara e amigável.\n" +
					"- Quando fizer recomendações práticas (o que abrir/beber), deixe explícito na resposta quais vinhos estão de fato disponíveis.\n" +
					"- Não inclua JSON na resposta, apenas texto natural.\n\n" +
					"PERGUNTA DO USUÁRIO:\n" +
					question +
					"\n\nCATÁLOGO DE VINHOS (incluindo status, se presente):\n" +
					JSON.stringify(vinhos);

				//const answer = await geminiGenerateText(env, prompt);
				//const answer = await deepseekGenerateText(env, prompt);
				const answer = await groqGenerateText(env, prompt);


				return jsonResponse({ answer }, requestOrigin);
			} catch (err: any) {
				return jsonResponse({ error: err?.message || "Erro ao processar" }, requestOrigin, 500);
			}
		}

		return jsonResponse({ error: "Not found" }, requestOrigin, 404);
	},
};
