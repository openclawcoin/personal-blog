const PROVIDERS = {
  deepseek: {
    keyEnv: "DEEPSEEK_API_KEY",
    baseEnv: "DEEPSEEK_BASE_URL",
    defaultBase: "https://api.deepseek.com",
    path: "/chat/completions"
  },
  qwen: {
    keyEnv: "QWEN_API_KEY",
    baseEnv: "QWEN_BASE_URL",
    defaultBase: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    path: "/chat/completions"
  },
  zhipu: {
    keyEnv: "ZHIPU_API_KEY",
    baseEnv: "ZHIPU_BASE_URL",
    defaultBase: "https://open.bigmodel.cn/api/paas/v4",
    path: "/chat/completions"
  },
  doubao: {
    keyEnv: "DOUBAO_API_KEY",
    baseEnv: "DOUBAO_BASE_URL",
    defaultBase: "https://ark.cn-beijing.volces.com/api/v3",
    path: "/chat/completions"
  }
};

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractProxyToken(request) {
  const fromHeader = request.headers.get("x-proxy-token");
  if (fromHeader) return fromHeader.trim();

  const auth = request.headers.get("authorization") || "";
  const matched = auth.match(/^Bearer\s+(.+)$/i);
  return matched ? matched[1].trim() : "";
}

function getCorsDecision(request, env) {
  const allowList = splitCsv(env.ALLOWED_ORIGINS);
  const origin = request.headers.get("origin") || "";

  if (!origin) {
    return {
      allowed: true,
      allowOrigin: allowList[0] || "*"
    };
  }

  if (!allowList.length) {
    return {
      allowed: true,
      allowOrigin: "*"
    };
  }

  if (allowList.includes(origin)) {
    return {
      allowed: true,
      allowOrigin: origin
    };
  }

  return {
    allowed: false,
    allowOrigin: "null"
  };
}

function buildCorsHeaders(allowOrigin) {
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Proxy-Token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function jsonResponse(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clampNumber(value, min, max, fallback) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeMaxTokens(value, fallback) {
  if (!Number.isInteger(value)) return fallback;
  if (value < 1) return fallback;
  return Math.min(value, 8192);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsDecision = getCorsDecision(request, env);
    const corsHeaders = buildCorsHeaders(corsDecision.allowOrigin);

    if (request.method === "OPTIONS") {
      if (!corsDecision.allowed) {
        return new Response("Forbidden origin", { status: 403, headers: corsHeaders });
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!corsDecision.allowed) {
      return jsonResponse({ error: { message: "Origin not allowed" } }, 403, corsHeaders);
    }

    const validPath = url.pathname === "/v1/chat" || url.pathname === "/chat" || url.pathname === "/";
    if (!validPath) {
      return jsonResponse({ error: { message: "Not Found" } }, 404, corsHeaders);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: { message: "Method Not Allowed" } }, 405, corsHeaders);
    }

    const requiredProxyToken = String(env.PROXY_TOKEN || "").trim();
    if (requiredProxyToken) {
      const provided = extractProxyToken(request);
      if (!provided || provided !== requiredProxyToken) {
        return jsonResponse({ error: { message: "Unauthorized" } }, 401, corsHeaders);
      }
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: { message: "Invalid JSON body" } }, 400, corsHeaders);
    }

    const provider = String(body.provider || "").trim().toLowerCase();
    const route = PROVIDERS[provider];
    if (!route) {
      return jsonResponse({ error: { message: "Unsupported provider" } }, 400, corsHeaders);
    }

    const model = String(body.model || "").trim();
    if (!model) {
      return jsonResponse({ error: { message: "model is required" } }, 400, corsHeaders);
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) {
      return jsonResponse({ error: { message: "messages is required" } }, 400, corsHeaders);
    }

    const apiKey = String(env[route.keyEnv] || "").trim();
    if (!apiKey) {
      return jsonResponse(
        { error: { message: `Missing secret: ${route.keyEnv}` } },
        500,
        corsHeaders
      );
    }

    const baseUrl = String(env[route.baseEnv] || route.defaultBase)
      .trim()
      .replace(/\/+$/, "");

    const upstreamUrl = `${baseUrl}${route.path}`;

    const payload = {
      model,
      messages,
      temperature: clampNumber(body.temperature, 0, 2, 0.7),
      top_p: clampNumber(body.top_p, 0, 1, 1),
      max_tokens: sanitizeMaxTokens(body.max_tokens, 1024),
      stream: Boolean(body.stream)
    };

    if (Array.isArray(body.tools)) {
      payload.tools = body.tools;
    }
    if (typeof body.tool_choice !== "undefined") {
      payload.tool_choice = body.tool_choice;
    }

    try {
      const upstreamResp = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const contentType = upstreamResp.headers.get("content-type") || "application/json; charset=utf-8";
      const responseHeaders = new Headers(corsHeaders);
      responseHeaders.set("Content-Type", contentType);
      responseHeaders.set("Cache-Control", "no-store");

      if (payload.stream && contentType.includes("text/event-stream")) {
        return new Response(upstreamResp.body, {
          status: upstreamResp.status,
          headers: responseHeaders
        });
      }

      const text = await upstreamResp.text();
      return new Response(text, {
        status: upstreamResp.status,
        headers: responseHeaders
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return jsonResponse({ error: { message: `Upstream request failed: ${message}` } }, 502, corsHeaders);
    }
  }
};
