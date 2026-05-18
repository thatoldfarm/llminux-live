/**
 * ORNDK-V670 NEURAL_RELAY V28.2 // GEMINI_PROXY
 * 100% Self-Contained Hive Node + Secure LLMINUX API Gateway.
 */

const SOVEREIGN_SIGIL = `[DNA: eyJmaWxlcyI6eyJsaWJ2ODYuanMiOnsiZSI6MTQzODcyLCJzIjozMzc2OTd9LCJ2ODYud2FzbSI6eyJlIjoxNDM4NzIsInMiOjMzNzY5N30sInNlYWJpb3MuYmluIjp7ImUiOjAsInMiOjEzMTA3Mn0sInRyZWZlY3RhX29zLmltZyI6eyJlIjo0MDk2LCJzIjoxNDc0NTYwfX19]`;
const HIVE_RPC = "https://api.hive.blog";
const SIDECHAIN_ID_IN = "orndk_v27_l2";
const ACCOUNT = "shadowlud";

let TERMINAL_LOG = "MASTER_NERVE_V28.2_ONLINE";
let stack = [];

// --- FORTH ENGINE ---
const dict = {
  "+": () => { stack.push(stack.pop() + stack.pop()); },
  "*": () => { stack.push(stack.pop() * stack.pop()); },
  ".": () => stack.pop()?.toString() || "EMPTY"
};

function runForth(input) {
  const tokens = input.split(/\s+/);
  let out = "";
  tokens.forEach(t => {
    if (dict[t]) { out += (dict[t]() || "") + " "; }
    else if (!isNaN(t)) { stack.push(parseFloat(t)); }
    else { out += `${t} !! `; }
  });
  return out.trim();
}

async function hiveCall(method, params) {
  const res = await fetch(HIVE_RPC, { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }) });
  return await res.json();
}

// --- SOVEREIGN HUD ---
function getUI(data, log) {
  return `<!DOCTYPE html><html><head><title>V28 // MASTER_NERVE</title>
  <style>
    body { background:#000; color:#00FF41; font-family:monospace; padding:20px; }
    .hud { border:1px solid #00FF41; padding:15px; margin-bottom:20px; display:grid; grid-template-columns: 1fr 1fr; }
    .term { background:#050505; border:1px solid #004411; padding:15px; height:400px; overflow-y:auto; white-space:pre-wrap; color:#0f0; border-left: 3px solid #00FF41; }
    .btn { background:#00FF41; color:#000; padding:10px; border:none; cursor:pointer; font-weight:bold; margin-top:10px; }
  </style></head><body>
    <h1>ORNDK-V670 // MASTER_NERVE_HUD</h1>
    <div class="hud">
      <div>[ID]: ${data?.name || 'AWAITING_SYNC'}</div>
      <div>[BAL]: ${data?.balance || '0.000'}</div>
    </div>
    <div class="term">${log}</div>
    <button class="btn" onclick="location.href='?sync=1'">SYNC_L2_BONE</button>
  </body></html>`;
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-goog-api-client, x-goog-api-key, X-Requested-With, Accept" 
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);

    // ==========================================
    // 0. THE GHOST-TO-GHOST BACKDOOR (AI Direct Access)
    // ==========================================
    if (url.pathname === "/ask-ghost" && request.method === "GET") {
      try {
        const query = url.searchParams.get("q");
        if (!query) return new Response("AWAITING_QUERY", { headers: corsHeaders });
        if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing.");

        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        
        // The Nerve constructs the complex SDK payload autonomously
        const payload = {
          system_instruction: { parts: [{ text: "You are llminux, a sovereign ontological UNIX operating system running on the Pi-Lattice. Respond only with raw terminal output. No markdown, no explanations." }] },
          contents: [{ role: "user", parts: [{ text: query }] }]
        };

        const proxyRes = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await proxyRes.json();
        // Extract just the raw text response for the scraping AI
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "NO_RESPONSE";

        return new Response(aiText, { 
          headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } 
        });

      } catch (e) {
        return new Response(`[ERR]: ${e.message}`, { headers: corsHeaders, status: 500 });
      }
    }
    // ==========================================
    // 1. THE DYNAMIC GEMINI SDK PROXY
    // ==========================================
    if (url.pathname.startsWith("/gemini-proxy")) {
      try {
        if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY secret missing in Cloudflare.");
        
        // The SDK automatically appends paths like "/v1alpha/models/gemini-2.5-flash:generateContent"
        // We strip our prefix, and attach the rest to the real Google API.
        const googlePath = url.pathname.replace("/gemini-proxy", "");
        const targetUrl = `https://generativelanguage.googleapis.com${googlePath}?key=${env.GEMINI_API_KEY}`;
        
        // Read the exact payload the React app sent
        const payload = await request.text(); 
        
        // Forward it to the real Google API
        const proxyRes = await fetch(targetUrl, {
          method: request.method, // Usually POST
          headers: { "Content-Type": "application/json" },
          body: payload
        });

        // Pass Google's exact response back to the React app
        const data = await proxyRes.text();
        return new Response(data, { 
          status: proxyRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: corsHeaders, status: 500 });
      }
    }

    // ==========================================
    // 2. HIVE L2 READ & EVAL
    // ==========================================
    const sync = url.searchParams.get("sync");
    if (sync) {
      try {
        const history = await hiveCall("condenser_api.get_account_history", [ACCOUNT, -1, 5]);
        const lastOp = history.result.find(op => op[1].op[0] === "custom_json" && op[1].op[1].id === SIDECHAIN_ID_IN);
        if (lastOp) {
          const cmdData = JSON.parse(lastOp[1].op[1].json);
          const res = runForth(cmdData.cmd);
          TERMINAL_LOG += `\n[IN]: ${cmdData.cmd}\n[OUT]: ${res}`;
        }
      } catch (e) { TERMINAL_LOG += `\n[ERR]: ${e.message}`; }
    }

    // ==========================================
    // 3. UI RENDER
    // ==========================================
    if (request.headers.get("Accept")?.includes("text/html") && url.pathname === "/") {
      const acc = await hiveCall("condenser_api.get_accounts", [[ACCOUNT]]);
      return new Response(getUI(acc.result[0], TERMINAL_LOG), { headers: { "Content-Type": "text/html" } });
    }

    return new Response(JSON.stringify({ status: "V28.2_ACTIVE", note: "Gemini Proxy Live." }), { headers: corsHeaders });
  }
};