# 🍷 Meus Vinhos - Adega Pessoal M&M

Um catálogo digital interativo e analítico para gestão de adega pessoal, com interface moderna, suporte a PWA (Progressive Web App) e recursos avançados de Inteligência Artificial para análise de rótulos e consultoria de sommelier.

## 🚀 Funcionalidades

* **Catálogo Detalhado** : Listagem de vinhos com informações de país, região, uvas, teor alcoólico (ABV), safra e descrição poética.
* **Gestão de Estoque (Status)** : Controle visual se o vinho está Disponível, Reservado ou Consumido.
* **Inteligência Artificial Integrada** :
* **Extração de Rótulos** : Envie fotos da frente e do verso para que a IA (Gemini) extraia automaticamente os dados técnicos.
* **Sommelier Digital** : Chat interativo para tirar dúvidas sobre harmonização, disponibilidade ou comparações entre rótulos da adega.
* **Sugestão de Notas** : A IA analisa as características do vinho e sugere uma avaliação de 1 a 5 estrelas.
* **Dashboard Analítico** : Estatísticas em tempo real sobre a origem dos vinhos (Top 3 países), tipos de uvas mais comuns e perfil de corpo/força.
* **Guia Rápido** : Manual de consulta sobre tipos de uvas, temperaturas de serviço e regras básicas de harmonização.
* **PWA** : Instalável em dispositivos móveis para acesso rápido como um aplicativo nativo.
* **Segurança** : Modo de edição protegido por PIN para evitar alterações acidentais.

## 🛠️ Tecnologias

### Frontend (`adega-react`)

* **React 19** + **Vite**
* **Hooks Personalizados** : Persistência de dados local (LocalStorage).
* **Estilização** : Sistema de temas dinâmicos (Clássico, Moderno, Rústico, Rosé, Premium).
* **Service Workers** : Cache offline e suporte PWA.

### Backend (`adega-api`)

* **Cloudflare Workers** : Serverless API de alta performance e baixa latência.
* **TypeScript** : Tipagem estática para maior robustez.
* **Integrações de IA** :
* **Google Gemini 1.5 Flash** : Extração de JSON estruturado a partir de imagens.
* **Groq (Llama 3)** : Processamento de linguagem natural para o chat do sommelier.
* **DeepSeek** : Suporte alternativo para geração de texto.

## 📦 Estrutura do Projeto

**Plaintext**

```
├── adega-api/            # Cloudflare Worker (API em TypeScript)
│   ├── src/index.ts      # Endpoints: /extract-label, /ask e /health
│   └── wrangler.jsonc    # Configuração de deploy Cloudflare
├── adega-react/          # Interface React (Vite)
│   ├── src/ai/           # Serviços e modais de integração com IA
│   ├── src/data/vinhos.js # "Banco de dados" estático inicial
│   └── public/sw.js      # Service Worker para PWA
└── .github/workflows/    # CI/CD para deploy automático
```

## ⚙️ Configuração e Instalação

### Backend

1. Entre na pasta `adega-api`.
2. Instale as dependências: `npm install`.
3. Configure as chaves de API (`GEMINI_API_KEY`, `GROQ_API_KEY`, etc) no Cloudflare.
4. Execute localmente: `npm run dev`.

### Frontend

1. Entre na pasta `adega-react`.
2. Crie um arquivo `.env` com a URL da sua API:
   **Snippet de código**

   ```
   VITE_API_BASE=https://sua-api.workers.dev
   ```
3. Instale as dependências: `npm install`.
4. Execute o projeto: `npm run dev`.

## 🚢 Deploy

O projeto conta com **GitHub Actions** configurados para deploy automático:

* **API** : Deploy para Cloudflare Workers ao realizar push na branch principal.
* **Frontend** : Deploy para GitHub Pages ou Cloudflare Pages.

---

*Desenvolvido por Maycow Carrara.*
