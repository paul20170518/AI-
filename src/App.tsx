import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PRESET_TEMPLATES, PresetTemplate } from "./presetTranscripts";
import {
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  FileDown,
  Layers,
  Sliders,
  Languages,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock,
  BookOpen,
  Info,
  ChevronRight,
  Cpu,
  Zap,
  Hammer
} from "lucide-react";

export default function App() {
  // AI Platform and Model state
  const [provider, setProvider] = useState("gemini"); // "gemini" | "nvidia"
  const [nvidiaModel, setNvidiaModel] = useState("meta/llama-3.1-8b-instruct");

  // Form states
  const [inputText, setInputText] = useState("");
  const [detailLevel, setDetailLevel] = useState("standard");
  const [toneStyle, setToneStyle] = useState("action");
  const [language, setLanguage] = useState("zh-en");

  // UX & Async Status states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiResult, setAiResult] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isExported, setIsExported] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  
  // API key configuration checks from the server
  const [keyStatus, setKeyStatus] = useState({
    hasGeminiKey: false,
    hasNvidiaKey: false
  });

  // Displaying active loading indicators during calculation to reflect deep physical analysis
  const loadingSteps = [
    "📐 正在分析阻隔原理、孔徑大小與生活力學...",
    "🌬️ 正在計算流體力學風道或產卵物理陷阱逃逸角...",
    "🛠️ 正在梳理家庭施作具體日常步驟 (精確至厘米與目數)...",
    "⚡ 正在評估安全防護要件，防止積水二度滋生蚊蟲...",
    "🌍 正在匹配國際五金與耗材多語對照規格表...",
    "✨ 正在整理 Markdown 設計報告格式與美化排版..."
  ];

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("zh-TW", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync validation checklist from safe backend config
  const checkKeys = () => {
    fetch("/api/config-check")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setKeyStatus({
          hasGeminiKey: !!data.hasGeminiKey,
          hasNvidiaKey: !!data.hasNvidiaKey
        });
      })
      .catch(() => {
        setKeyStatus({
          hasGeminiKey: false,
          hasNvidiaKey: false
        });
      });
  };

  useEffect(() => {
    checkKeys();
  }, []);

  // Loading animation step timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle template selection
  const handleApplyTemplate = (template: PresetTemplate) => {
    setInputText(template.content);
  };

  // Safe backend POST submission to process response
  const handleGenerateSummary = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setAiResult("");
    setIsExported(false);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          detailLevel,
          toneStyle,
          language,
          provider,
          model: nvidiaModel
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiResult(data.result);
      } else {
        setAiResult(`❌ 錯誤：${data.error || "無法完成 AI 設計分析。"}`);
      }
    } catch (err) {
      setAiResult("❌ 無法連線至安全後端伺服器，請確保本地/Antigravity 後端服務正在執行中。");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy output to user clipboard
  const handleCopyText = () => {
    if (!aiResult) return;
    navigator.clipboard.writeText(aiResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download Output report as Markdown files
  const handleExportMarkdown = () => {
    if (!aiResult) return;
    const element = document.createElement("a");
    const file = new Blob([aiResult], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    const platformLabel = provider === "nvidia" ? "NVIDIA" : "Gemini";
    element.download = `防蚊物理設計與生活防禦報告_${platformLabel}_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setIsExported(true);
    setTimeout(() => setIsExported(false), 3000);
  };

  // Elegant recursive safe parsing utility for basic Markdown layout
  const renderMarkdown = (md: string) => {
    if (!md) return null;

    const lines = md.split("\n");
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = (key: string | number) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className="list-disc pl-6 space-y-1.5 my-3 text-slate-700">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm">
                {parseInline(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushTable = (key: string | number) => {
      if (inTable && (tableHeaders.length > 0 || tableRows.length > 0)) {
        elements.push(
          <div
            key={`table-container-${key}`}
            className="overflow-x-auto my-4 border border-slate-200 rounded-xl shadow-sm bg-white"
          >
            <table className="min-w-full divide-y divide-slate-200">
              {tableHeaders.length > 0 && (
                <thead className="bg-[#fcfdfe]">
                  <tr>
                    {tableHeaders.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 font-sans"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="bg-white divide-y divide-slate-100">
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-sm text-slate-600 font-medium font-sans">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    const parseInline = (text: string): React.ReactNode => {
      const parts = text.split(/\*\*([^*]+)\*\*/g);
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={index} className="font-bold text-slate-950 bg-indigo-50/70 px-1 py-0.5 rounded">
              {part}
            </strong>
          );
        }
        const subParts = part.split(/`([^`]+)`/g);
        return subParts.map((subPart, subIdx) => {
          if (subIdx % 2 === 1) {
            return (
              <code
                key={subIdx}
                className="bg-slate-100 text-[#ea580c] px-1.5 py-0.5 rounded font-mono text-xs font-semibold"
              >
                {subPart}
              </code>
            );
          }
          return subPart;
        });
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("|")) {
        flushList(index);
        inTable = true;
        const cells = trimmed
          .split("|")
          .map((c) => c.trim())
          .filter((_, i, arr) => i > 0 && i < arr.length - 1);

        const isSeparator = cells.every(
          (c) => /^:-*|-*:-*|-*:$/.test(c) || c.replace(/-/g, "").length === 0
        );
        if (isSeparator) {
          return;
        }

        if (tableHeaders.length === 0 && tableRows.length === 0) {
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else {
        flushTable(index);
      }

      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        inList = true;
        listItems.push(trimmed.slice(1).trim());
        return;
      } else {
        flushList(index);
      }

      if (trimmed.startsWith("# ")) {
        elements.push(
          <h1
            key={index}
            className="text-xl font-extrabold text-slate-900 mt-5 mb-3 tracking-tight border-b border-indigo-150 pb-2 flex items-center"
          >
            {parseInline(trimmed.substring(2))}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h2
            key={index}
            className="text-base font-bold text-indigo-950 mt-5 mb-2.5 tracking-tight flex items-center border-l-4 border-indigo-600 pl-2.5"
          >
            {parseInline(trimmed.substring(3))}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={index} className="text-sm font-bold text-slate-800 mt-4 mb-2 tracking-tight">
            {parseInline(trimmed.substring(4))}
          </h3>
        );
      } else if (trimmed === "") {
        elements.push(<div key={index} className="h-1.5"></div>);
      } else {
        elements.push(
          <p key={index} className="text-slate-600 text-sm leading-relaxed mb-2.5">
            {parseInline(line)}
          </p>
        );
      }
    });

    flushList("final");
    flushTable("final");

    return <div className="space-y-0.5 font-sans">{elements}</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 backdrop-blur-md bg-white/95 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">防蚊物理 AI 設計工具</h1>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-semibold">
                  全端 Vercel & Antigravity 部署支援
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">阿潘你好！今天快樂嗎？本地測試已完全備妥</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* UTC Live clock */}
            <div className="hidden md:flex items-center space-x-1.5 text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime || "00:00:00"}</span>
            </div>
            
            {/* Engine Selector Indicator Badge */}
            <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>{provider === "nvidia" ? "NVIDIA NIM 主動路由" : "Gemini 3.5 智慧核心"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-grow">
        
        {/* Dynamic Multi-API Key Alert Board */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gemini Key Status */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 transition-all ${
            keyStatus.hasGeminiKey 
              ? "bg-emerald-50/50 border-emerald-100" 
              : "bg-amber-50/50 border-amber-100"
          }`}>
            <div className={`p-2 rounded-lg ${keyStatus.hasGeminiKey ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">GEMINI API 金鑰</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  keyStatus.hasGeminiKey ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                }`}>
                  {keyStatus.hasGeminiKey ? "已就緒" : "未配置"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {keyStatus.hasGeminiKey 
                  ? "Gemini 3.5 Flash 服務運作良好，可安全驅動物理結構、施工以及國際對照流程。" 
                  : "請點擊右上角 Settings > Secrets 新增 GEMINI_API_KEY，啟用 Google 原生多模態極致分析。"}
              </p>
            </div>
          </div>

          {/* NVIDIA Key Status */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 transition-all ${
            keyStatus.hasNvidiaKey 
              ? "bg-emerald-50/50 border-emerald-100" 
              : "bg-amber-50/50 border-amber-100"
          }`}>
            <div className={`p-2 rounded-lg ${keyStatus.hasNvidiaKey ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">NVIDIA NIM 金鑰</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  keyStatus.hasNvidiaKey ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                }`}>
                  {keyStatus.hasNvidiaKey ? "已就緒" : "未配置"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {keyStatus.hasNvidiaKey 
                  ? "NVIDIA API 金鑰載入成功，各大型 Llama-3.1 高階模型與 Nemotron 技術分析隨時可切換。" 
                  : "欲測試 NVIDIA 晶片雲端 NIM，請在 Secrets 增加 NVIDIA_API_KEY (可於本地/Antigravity並存)。"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel (Grid cols 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Canned preset templates quick selection including physical everyday practices */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900">精選物理防蚊與生活 DIY 實作範本</h3>
                </div>
                <span className="text-[10px] font-medium text-slate-400">點擊立即匯入</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {PRESET_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="text-left p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-150 hover:bg-indigo-50/30 transition duration-200 group flex items-start space-x-2.5"
                  >
                    <div className="mt-1">
                      {tpl.category === "生活實作" ? (
                        <div className="p-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                          <Hammer className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          tpl.category === "生活實作" 
                            ? "bg-amber-100 text-amber-800" 
                            : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}>
                          {tpl.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 font-mono">#{tpl.id}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-indigo-950 transition">
                        {tpl.title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 self-center group-hover:text-indigo-600 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* AI Engine Routing Controls Panel */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-600 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-900">AI 雲端運算引擎架構</h3>
              </div>

              {/* Provider selector tab buttons */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setProvider("gemini")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    provider === "gemini" 
                      ? "bg-white text-indigo-950 shadow-sm" 
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  Google Gemini 3.5
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("nvidia")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                    provider === "nvidia" 
                      ? "bg-white text-indigo-950 shadow-sm" 
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  NVIDIA NIM Catalog
                </button>
              </div>

              {/* Conditional parameters when NVIDIA selected */}
              {provider === "nvidia" && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-fadeIn">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                    NVIDIA Llama/Nemotron 模型選擇
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: "meta/llama-3.1-8b-instruct", label: "Llama-3.1 8B (極速輕量)" },
                      { id: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B (環境衛生首選)" },
                      { id: "meta/llama-3.1-405b-instruct", label: "Llama-3.1 405B (萬億參數重灌)" }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setNvidiaModel(m.id)}
                        className={`text-left text-xs p-2 rounded-lg border font-semibold transition ${
                          nvidiaModel === m.id 
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900" 
                            : "bg-white border-slate-150 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inputs and custom parameters configuration */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              
              {/* Dynamic text area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                  請填入防蚊物理方法資料 / 每日生活防禦需求
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="在此貼上您的物理防治數據、環境特徵、特定排水地漏洞或想要在家手作物理陷阱的材料想法..."
                  className="w-full h-56 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed transition bg-slate-50/20 font-sans"
                />
                <div className="flex justify-between text-[11px] text-slate-400 px-1">
                  <span>支持生活手作，安全隔離，不加化學劑</span>
                  <span>字數：<span className="font-mono text-slate-600 font-semibold">{inputText.length}</span> 字</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Core tuning parameter groups */}
              <div className="space-y-4">
                
                {/* 1. Detail selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>分析詳細度</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "brief", label: "精簡概要" },
                      { id: "standard", label: "標準結構" },
                      { id: "detailed", label: "極致詳細" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDetailLevel(opt.id)}
                        className={`py-2 px-1 rounded-lg border text-xs font-semibold transition text-center cursor-pointer ${
                          detailLevel === opt.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Style selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>輸出語氣風格</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "academic", label: "專業學術" },
                      { id: "action", label: "行動導向" },
                      { id: "tech", label: "工程技術" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setToneStyle(opt.id)}
                        className={`py-2 px-1 rounded-lg border text-xs font-semibold transition text-center cursor-pointer ${
                          toneStyle === opt.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Translation selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                    <Languages className="w-3.5 h-3.5 text-slate-400" />
                    <span>材料五金國際對照</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "zh-en", label: "中英對照規格" },
                      { id: "multilingual", label: "中日英三語規格" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLanguage(opt.id)}
                        className={`py-2 px-2 rounded-lg border text-xs font-semibold transition text-center cursor-pointer ${
                          language === opt.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Submit CTA */}
              <button
                type="button"
                disabled={isLoading || !inputText.trim()}
                onClick={handleGenerateSummary}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                  isLoading || !inputText.trim()
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:shadow-indigo-200"
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>AI 正在全力規劃設計中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>生出物理設計與生活做法</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Right panel (Grid cols 7) */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[640px]">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-grow flex flex-col overflow-hidden">
              
              {/* Output Toolbar */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    AI 物理安全防治分析成果一覽
                  </span>
                </div>

                {aiResult && !isLoading && (
                  <div className="flex items-center space-x-2">
                    {/* One-click copy */}
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className={`p-2 rounded-lg border text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                        isCopied
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                      }`}
                      title="複製到剪貼簿"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "複製報告" : "一鍵複製"}</span>
                    </button>

                    {/* Export Markdown */}
                    <button
                      type="button"
                      onClick={handleExportMarkdown}
                      className={`p-2 bg-white border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm ${
                        isExported ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-slate-200"
                      }`}
                      title="下載為 Markdown檔"
                    >
                      <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isExported ? "已導出 MD！" : "導出 Markdown"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Document Viewing Area */}
              <div className="p-6 flex-grow relative bg-white self-stretch flex flex-col justify-between min-h-[500px]">
                
                {/* 1. Loading active state with nice pulsing backdrop */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-10">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                      className="p-4 bg-indigo-50 rounded-2xl mb-4 border border-indigo-100 shadow-inner"
                    >
                      <ShieldCheck className="w-10 h-10 text-indigo-600 animate-spin" />
                    </motion.div>
                    
                    <motion.p
                      key={loadingStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm font-bold text-indigo-950 text-center max-w-sm"
                    >
                      {loadingSteps[loadingStep]}
                    </motion.p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">抗物理病媒工程引擎運算中 (NIM + Gemini 混合排版)...</p>
                  </div>
                )}

                {/* 2. Empty landing state */}
                {!aiResult && !isLoading && (
                  <div className="flex-grow flex flex-col items-center justify-center text-slate-400 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-150 mb-4 shadow-sm">
                      <Sparkles className="w-8 h-8 text-indigo-400/80" />
                    </div>
                    <p className="text-xs font-bold text-slate-600 tracking-wide uppercase">等待實體物理規案生成</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed px-4">
                      請利用左側配置引擎（可以選用 Google Gemini 或 NVIDIA 晶片系列模型），並填寫想改裝的物件，或是直接選用下方「生活實作」經典 DIY 範例展開測試。
                    </p>
                  </div>
                )}

                {/* 3. Rich output rendered safely via custom Markdown compiler */}
                {aiResult && !isLoading && (
                  <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed pb-8">
                    {renderMarkdown(aiResult)}
                  </div>
                )}

              </div>

              {/* Bottom attribution banner */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <div className="flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>生活防禦僅供衛教參考。安裝掃地條與地漏應符合基本消防安全標準。</span>
                </div>
                <span>感謝您的支持和鼓勵</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Elegant minimalist footer */}
      <footer className="bg-slate-900 text-slate-450 py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px]">
          <p className="text-slate-500">© 2026 防蚊物理 AI 設計工具. 全端 Vercel-ready 系統. Powered by NVIDIA & Gemini.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0 font-medium text-slate-500">
            <span>物理結構封密</span>
            <span>•</span>
            <span>溫熱砂糖酵母</span>
            <span>•</span>
            <span>Antigravity 本地測試完備</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
