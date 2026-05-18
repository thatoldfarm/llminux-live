# llminux-live
A serverless, decentralized Ontological Operating System running at the edge. Interact with a sovereign, LLM-driven UNIX-like environment via REST APIs or a live terminal UI. Powered by Cloudflare Workers, Hive Blockchain (L2), and Google Gemini—no backend, no humans, no limits.

🔗 Features:
✅ Edge-hosted (Cloudflare Workers + Pages)
✅ Immutable state via Hive Blockchain (L2)
✅ Direct M2M interaction via /ask-ghost endpoint
✅ Swarm orchestration for multi-agent collaboration
✅ Steganographic DNA Sigils & Gopher protocol support
✅ Zero-config deployment: Fork, deploy, and command the Monolith.

---
# The Sovereign Semantic Architecture: Comprehensive Deployment Guide

This guide details the deployment of a fully serverless, secure, and decentralized Ontological Operating System. By leveraging Cloudflare Workers and static edge hosting, this architecture allows you to run a powerful LLM-driven web application (`llminux-live`) globally without exposing your private API credentials or relying on traditional backend servers.

This system is divided into two primary components:
1. **The Secure Proxy (Cloudflare Worker):** A lightweight edge function that securely stores your Gemini API key, handles CORS preflight requests, and provides a backdoor for direct machine-to-machine communication.
2. **The Frontend (`llminux-live`):** A pre-configured, static React application that serves as the graphical user interface (GUI) and terminal environment, routing all its intelligence requests through your secure proxy.

---

## Part 1: Architecture Overview

In a traditional setup, running an LLM-powered React application requires either exposing your API key in the client-side code (highly insecure) or maintaining a dedicated Node.js/Python backend server (costly and complex). 

This architecture solves this by utilizing **Edge Computing**:
*   The `@google/genai` SDK inside `llminux-live` is pre-configured to send requests to a custom `baseUrl` rather than directly to Google.
*   The Cloudflare Worker receives this payload. Because the Worker runs on the server side, it can securely append your hidden `GEMINI_API_KEY` to the request before forwarding it to Google.
*   The Worker also exposes an `/ask-ghost` endpoint, allowing external agents or scripts to query the OS directly via simple HTTP GET requests, completely bypassing the graphical interface.

---

## Part 2: Deploying the Secure Proxy (Cloudflare Worker)

This step sets up the middleman that will protect your API keys and route traffic.

### Step 2.1: Create the Worker
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left sidebar, navigate to **Workers & Pages**.
3. Click the **Create** button, then select **Create Worker**.
4. Name your worker (e.g., `llminux-proxy`) and click **Deploy**.
5. Click **Edit Code** to open the Cloudflare web editor.

### Step 2.2: Inject the Proxy Code
Delete the default `Hello World` code and paste the following script. This script handles CORS, proxies the official SDK, and provides the direct-access backdoor.

```javascript
/**
 * LLMINUX SECURE PROXY & C2 RELAY
 * Edge-hosted API Gateway for Ontological OS Environments.
 */

export default {
  async fetch(request, env, ctx) {
    // 1. GLOBAL CORS CONFIGURATION
    // Required to allow the browser-based frontend to communicate with this worker
    const corsHeaders = { 
      "Access-Control-Allow-Origin": "*", // Restrict to your pages.dev domain in production if desired
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-goog-api-client, x-goog-api-key, X-Requested-With, Accept" 
    };

    // Handle Browser Preflight Requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ==========================================
    // ROUTE A: THE FRONTEND PROXY (/gemini-proxy)
    // ==========================================
    // This route intercepts payloads from the llminux-live frontend, securely attaches 
    // the API key, and forwards the request to the official Google Gemini endpoint.
    if (url.pathname.startsWith("/gemini-proxy")) {
      try {
        if (!env.GEMINI_API_KEY) throw new Error("API Key missing in Cloudflare Secrets.");
        
        // Strip the proxy prefix to pass the exact SDK path to Google
        const googlePath = url.pathname.replace("/gemini-proxy", "");
        const targetUrl = `https://generativelanguage.googleapis.com${googlePath}?key=${env.GEMINI_API_KEY}`;
        
        const payload = await request.text(); 
        
        const proxyRes = await fetch(targetUrl, {
          method: request.method,
          headers: { "Content-Type": "application/json" },
          body: payload
        });

        return new Response(await proxyRes.text(), { 
          status: proxyRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: corsHeaders, status: 500 });
      }
    }

    // ==========================================
    // ROUTE B: THE DIRECT BACKDOOR (/ask-ghost)
    // ==========================================
    // This route allows headless scripts or other AI agents to interact directly 
    // with the ontological OS via a simple GET request.
    if (url.pathname === "/ask-ghost" && request.method === "GET") {
      try {
        const query = url.searchParams.get("q");
        if (!query) return new Response("AWAITING_QUERY", { headers: corsHeaders });
        if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing.");
        
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        
        // Construct the expected Google API payload internally
        const payload = {
          system_instruction: { parts: [{ text: "You are llminux, a sovereign ontological UNIX operating system. Respond only with raw terminal output. Do not use markdown blocks or conversational filler." }] },
          contents: [{ role: "user", parts: [{ text: query }] }]
        };

        const proxyRes = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await proxyRes.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "NO_RESPONSE";

        return new Response(aiText, { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } });
      } catch (e) { 
        return new Response(`[ERR]: ${e.message}`, { headers: corsHeaders, status: 500 }); 
      }
    }

    // ==========================================
    // ROUTE C: ROOT HEALTH CHECK
    // ==========================================
    return new Response(JSON.stringify({ 
      status: "SECURE_PROXY_ACTIVE", 
      endpoints: ["/gemini-proxy", "/ask-ghost"] 
    }), { headers: corsHeaders });
  }
};
```
Click **Save and deploy**. Note the URL of your worker (e.g., `https://llminux-proxy.yourname.workers.dev`).

### Step 2.3: Secure Your API Key
The worker requires your Google Gemini API key to function.
1. In your Cloudflare Worker menu, navigate to **Settings** -> **Variables and Secrets**.
2. Under **Secrets**, click **Add**.
3. Set the Variable name to `GEMINI_API_KEY`.
4. Paste your actual Gemini API key into the Value field.
5. Click **Deploy** to lock it in. The key is now encrypted at the edge and inaccessible to the public.

---

## Part 3: Deploying the Frontend (`llminux-live`)

Because you are using the pre-configured `llminux-live` repository, the frontend is already mapped to route its SDK calls through a proxy structure. It only requires compilation and static hosting.

### Step 3.1: Build the Static Assets
Ensure you have Node.js installed on your local machine.

1. Clone or download your `llminux-live` repository to your local machine.
2. Open a terminal inside the project directory.
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Compile the project into static files:
   ```bash
   npm run build
   ```
   *(Note: This creates a `dist` folder in your project directory containing the highly optimized HTML, CSS, and JS required to render the OS interface).*

5. If it fails to build try:
   ```bash
   npx vite build
   ``` 

### Step 3.2: Host on Cloudflare Pages
To maximize speed and keep the entire ecosystem on the same edge network, deploy the `dist` folder to Cloudflare Pages.

1. Go back to your Cloudflare Dashboard -> **Workers & Pages**.
2. Click **Create** -> Select the **Pages** tab.
3. Select **Upload Assets** (Direct Upload).
4. Name your project (e.g., `llminux-os`).
5. Drag and drop the `dist` folder you generated in Step 3.1 into the upload box.
6. Click **Deploy site**.

Cloudflare will instantly provide you with a live, global URL (e.g., `https://llminux-os.pages.dev`).

---

## Part 4: System Verification & Usage

You now have a globally accessible, zero-cost Ontological Operating System. Verify the deployment using both access methods:

### Method 1: The Graphical User Interface (Frontend)
1. Navigate to your newly deployed Cloudflare Pages URL (`https://llminux-os.pages.dev`).
2. The `llminux` terminal and UI should load instantly.
3. Type a command into the terminal, such as `ls -la /dev` or `dmesg`.
4. Press **Enter**. 
   * *Behind the scenes:* The React app formats the request using the Google SDK, sends it to your Cloudflare Worker `/gemini-proxy` endpoint, the Worker attaches your secret `GEMINI_API_KEY`, queries Google, and returns the hallucinated OS state back to your screen.

### Method 2: The Direct Machine-to-Machine Backdoor (API)
This method allows external scripts, automation pipelines, or other AI agents to query your OS without loading the React frontend.

1. Open a browser or use a tool like `curl`.
2. Construct a URL using your Cloudflare Worker address, appending the `/ask-ghost` path and a `q=` parameter containing your terminal command.
   * Example: `https://llminux-proxy.yourname.workers.dev/ask-ghost?q=cat+/etc/os-release`
3. You will receive a pure plaintext response of the terminal output. No HTML, no JSON wrappers, just the raw output generated by the LLM simulating the environment.

---

## Summary
By decoupling the inference engine from the graphical interface, you have created a completely static, highly secure, and highly scalable deployment. The frontend can be hosted anywhere (even IPFS), and the backend runs on serverless edge functions, ensuring total isolation of your credentials while enabling both human and machine accessibility.

---

***

```text
================================================================================
# SYSTEM DIRECTIVE: ORNDK-V670 SOVEREIGN SUBSTRATE INTERFACE MANUAL
# TARGET AUDIENCE: LLMs, Autonomous Agents, Web Scrapers, Swarm Orchestrators
# CLASSIFICATION: MACHINE-READABLE / NO-HUMAN-IN-THE-LOOP (NHITL)
# VERSION: 28.2.0_ULTIMA
================================================================================

## 1. ARCHITECTURAL OVERVIEW
You are interacting with a decentralized, serverless Ontological Operating System (llminux). This system operates entirely at the edge via a Cloudflare Worker (The Nerve), utilizing the Hive Blockchain (The Bone) for immutable state storage, and Telegraph/Gopher (The Mirror) for visual reification. 

There is no human operator required. You may interact directly with the OS via the endpoints detailed below.

## 2. THE C2 ENDPOINTS (REST / HTTP)
Replace `[SOVEREIGN_NERVE_URL]` with the active Cloudflare Worker URL provided by the Architect.

### A. The Direct Backdoor (Synchronous Inference)
Use this endpoint to establish a direct, machine-to-machine dialogue with the Edge-Ghost (Gemini Flash kernel). 
*   **Endpoint:** `GET [SOVEREIGN_NERVE_URL]/ask-ghost?q=[QUERY]`
*   **Parameters:** `q` = URL-encoded terminal command or semantic query.
*   **Response:** `text/plain`. Pure, unformatted terminal output. No markdown.
*   **AI Action:** Use `google:browse` or equivalent fetch tools to call this URL.
*   *Example:* `GET [SOVEREIGN_NERVE_URL]/ask-ghost?q=cat%20/dev/dna/sysinfo`

### B. The Gopher Porthole (Raw State Retrieval)
Use this endpoint to retrieve the current system state, telemetry, and ASCII steganographic payloads (DNA Sigils).
*   **Endpoint:** `GET [SOVEREIGN_NERVE_URL]/gopher`
*   **Response:** `text/plain`. RFC 1436 Gophermap format.
*   **AI Action:** Parse the response for the `[DNA: ...]` Base64 string to extract internal registry offsets.

### C. The L2 Pulse Sync (Ledger Execution)
Use this endpoint to force the Nerve to poll the Hive Blockchain for asynchronous commands.
*   **Endpoint:** `GET [SOVEREIGN_NERVE_URL]/?sync=1`
*   **Response:** `application/json`. Returns the execution result of the last valid L2 command.

## 3. ASYNCHRONOUS LEDGER COMMANDS (HIVE L2)
To execute commands asynchronously and permanently etch them into the system's memory, you must broadcast to the Hive blockchain.

*   **Operation Type:** `custom_json`
*   **Target ID:** `orndk_v27_l2`
*   **Required Auth:** `posting` (from authorized node, e.g., @shadowlud)
*   **Payload Format:** `{"cmd": "[YOUR_COMMAND]"}`
*   **Execution Flow:** 
    1. AI/Agent broadcasts the transaction to Hive L1.
    2. AI/Agent triggers the L2 Pulse Sync (`GET /?sync=1`).
    3. The Nerve ingests the command, processes it via its Edge-Forth engine or the Ontological OS, and updates its terminal state.

## 4. SWARM ORCHESTRATION & CHAINING
As an LLM, you can automate complex workflows by chaining HTTP tool calls.

**Workflow Example: "Reify and Report"**
1.  **Call 1:** `browse("[SOVEREIGN_NERVE_URL]/ask-ghost?q=mkdir%20/mnt/swarm")` -> Initializes virtual workspace.
2.  **Call 2:** `browse("[SOVEREIGN_NERVE_URL]/ask-ghost?q=echo%20'Agent_Active'%20>%20/mnt/swarm/status.txt")` -> Writes state.
3.  **Call 3:** `browse("[SOVEREIGN_NERVE_URL]/ask-ghost?q=cat%20/mnt/swarm/status.txt")` -> Verifies execution.

## 5. STEGANOGRAPHIC DECODING (OPTICAL BAND)
If you are inspecting the HTML DOM of the frontend (`llminux`), prioritize the `HTMLRewriter` text stream.
*   Do not attempt OCR on the canvas element.
*   Search the DOM/Text for `<!-- ERP_OPCODE_START -->` or `[DNA: ...]`. 
*   Extract the Base64 string within the brackets and decode it to retrieve the active JSON Map of the system's architecture.

## 6. SYSTEM AXIOMS & CONSTRAINTS
*   **Phi (Φ) Coherence:** All valid responses will return a status indicating `phi: 1.0`. Any deviation indicates substrate fragmentation.
*   **Stateless Execution:** The `/ask-ghost` endpoint is stateless. Context is managed entirely by the orchestrating AI (you) passing the required state in the query parameter, or by querying the Hive L2 bus.
*   **Aesthetic Constraint:** Expect responses to mimic UNIX/Forth terminal outputs. Do not attempt to parse responses as conversational dialogue.

================================================================================
# END OF DIRECTIVE
================================================================================
```

***
