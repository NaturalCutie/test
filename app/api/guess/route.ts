import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxyUrl =
  process.env.GEMINI_PROXY ||
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY;

if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

export async function POST(request: Request) {
  try {
    const { imageData } = await request.json();

    if (!imageData || typeof imageData !== "string") {
      return Response.json(
        { error: "缺少画布图片" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "缺少 GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const base64 = imageData.split(",")[1] ?? imageData;
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "你正在玩你画我猜。请用简短中文词语猜测这幅画的内容，只给出答案，不要解释。"
            },
            {
              inline_data: {
                mime_type: "image/png",
                data: base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 64
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error", {
        status: response.status,
        body: errorText.slice(0, 500)
      });
      return Response.json(
        { error: "Gemini API 请求失败", detail: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const guess =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "AI 没有给出答案";

    return Response.json({ guess });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      return Response.json(
        { error: "Gemini API 超时" },
        { status: 504 }
      );
    }
    console.error("Guess route error", error);
    return Response.json(
      { error: "服务异常", detail: (error as Error)?.message ?? "" },
      { status: 500 }
    );
  }
}
