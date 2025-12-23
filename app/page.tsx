"use client";

import { useEffect, useRef, useState } from "react";

const CANVAS_ASPECT = 4 / 3;

function getCanvasSize(container: HTMLDivElement) {
  const width = container.clientWidth;
  const height = Math.round(width / CANVAS_ASPECT);
  return { width, height };
}

export default function HomePage() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState("#1c1b19");
  const [size, setSize] = useState(10);
  const [status, setStatus] = useState("准备好了就开始画吧！");
  const [guess, setGuess] = useState("等待你的作品");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const { width, height } = getCanvasSize(wrap);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctxRef.current = ctx;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = size;
    }
  }, [color, size]);

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(event.pointerId);
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ctxRef.current || event.buttons !== 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctxRef.current.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctxRef.current.stroke();
  };

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    canvas.releasePointerCapture(event.pointerId);
    ctxRef.current.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setGuess("等待你的作品");
    setStatus("画布已清空，继续挑战！");
  };

  const requestGuess = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoading(true);
    setStatus("AI 正在思考...");

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const response = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: dataUrl
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = payload?.detail ? String(payload.detail) : "";
        const message = payload?.error ? String(payload.error) : "AI 请求失败";
        setStatus(detail ? `${message}：${detail}` : message);
        return;
      }

      setGuess(payload?.guess ?? "AI 没有给出答案");
      setStatus("完成！要不要再画一个？");
    } catch (error) {
      setStatus("出错了，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <header className="hero">
        <span className="badge">AI 你画我猜 · Gemini</span>
        <h1>在线你画我猜：画一笔，AI 来猜</h1>
        <p>
          在画布上随手涂鸦，点击“让 AI 猜”即可让 Gemini 识别你的作品。无需安装插件，直接在线体验。
        </p>
      </header>

      <section className="layout">
        <div className="panel">
          <h2>你的画布</h2>
          <div className="canvas-wrap" ref={wrapRef}>
            <canvas
              ref={canvasRef}
              className="canvas"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
            />
          </div>
          <div className="controls">
            <label className="control">
              画笔大小
              <input
                type="range"
                min={3}
                max={28}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
              />
            </label>
            <label className="control">
              画笔颜色
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
            <button
              className="secondary"
              type="button"
              onClick={clearCanvas}
            >
              清空画布
            </button>
            <button
              className="primary"
              type="button"
              onClick={requestGuess}
              disabled={loading}
            >
              {loading ? "AI 思考中..." : "让 AI 猜"}
            </button>
          </div>
          <div className="status">{status}</div>
        </div>

        <div className="panel">
          <h2>AI 猜测结果</h2>
          <div className="guess">{guess}</div>
          <div className="tips">
            <p>建议：画清晰的轮廓 + 1-2 个关键特征。</p>
            <p>你也可以尝试：水果、动物、交通工具、日用品。</p>
            <p>注意：结果由 Gemini 模型生成，仅供娱乐。</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        技术栈：Next.js · Gemini API · 纯后端接口调用（无 SDK）
      </footer>
    </main>
  );
}
