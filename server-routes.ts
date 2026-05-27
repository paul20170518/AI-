import express from "express";
import { GoogleGenAI } from "@google/genai";

export function registerApiRoutes(app: express.Express) {
  // System instructions for environmental sanitary physical mosquito engineering design
  const MOSQUITO_SYSTEM_INSTRUCTION = `
你是一位享譽國際的「環境衛生與物理防蚊工程設計專家」。你的任務是分析使用者提供的「防蚊物理方法具體資料」或「安全防範做法」，並將其轉化為極具專業度、結構化的物理防禦設計圖架構與生活中具體施作細節。

請嚴格遵循以下輸出格式與規範（一律使用繁體中文呈現主要內容）：

# 🛡️ 物理防衛工程與生活防禦優化報告

## 1. 🛠️ 物理防禦核心機制
說明該方法的物理阻隔或驅蚊原理。強調力學、風道、材料光譜特性及空間物理阻絕之機制，說明其如何不依靠化學藥劑達成純物理屏障。

## 2. 📐 結構設計與日常具體實施步驟
以極其詳細、步驟化的方法，拆解如何在日常生活中施作建置該物理防蚊裝置或防禦工程。請提供具體的生活中可用材料與詳盡細緻量化指標（例如：利用家中的寶特瓶、細孔絲襪、紗網目數 20-24目、黏貼型密封長度、高度 80-120 公分、風幕吹風風速 12 m/s 等）。步驟要極具實用性、好上手、好測試。

## 3. ⚠️ 安全防範與維護要點
詳述在生活中施作及後續運作時的安全注意事項（防割傷、電器防水防短路、定期排除積水防止二度孳生蚊蟲等），並具體告知清洁保養期與耗材更換頻率。

## 4. 🌍 國際技術材料名詞對照 (Translation Summary)
建立一個高解析的 Markdown 規格對照表（表格格式），將此物理設計中提到的核心關鍵字、特殊材料名稱及專業防護工藝，翻譯為繁體中文、英文、日文。方便使用者進行國際耗材採購（例如：淘寶、日本亞馬遜）或查閱國際維修文獻。

回應風格請保持：專業、嚴謹、步驟清晰至極、極具生活實作可操作性。
`;

  // API Route to process the request
  app.post("/api/summarize", async (req, res) => {
    try {
      const { text, detailLevel, toneStyle, language, provider, model } = req.body;

      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "請提供有效的防蚊資料內容。" });
      }

      // Determine model parameters
      const detailText =
        detailLevel === "brief"
          ? "精簡概要模式（專注核心，提煉重點，適合快速概覽）"
          : detailLevel === "detailed"
          ? "極致詳細模式（充實每一生活細節與結構特徵，補充大量量化物理指標）"
          : "標準結構模式（均衡比例，生活實作與科學機制並重）";

      const toneText =
        toneStyle === "tech"
          ? "工程與量化技術感（強調材質規格、力學、數值、嚴密科學）"
          : toneStyle === "action"
          ? "生活日常動手實作導向（強調簡單好上手、如何使用家常回收物資、直覺安全步驟）"
          : "專業學術商務（強調環境衛生、病媒蚊生態學、綜合防治論述）";

      const langText =
        language === "zh-en"
          ? "繁體中文主要摘要，第四區塊特別加強「中英文」核心材料技術對照表。"
          : "繁體中文主要摘要，第四區塊特別加強「中、美、日」三國語言核心材料與技術工藝語彙對照表。";

      const userPrompt = `
請針對以下防蚊資料與需求，進行生活與工程深度物理優化，並給出具體的施作步驟、安全防範要求：

[使用者提供的防蚊資料或日常訴求]
${text}

[物理設計參數要求]
- 總結詳細度：${detailText}
- 輸出語氣風格：${toneText}
- 主要語言與對照目標：${langText}
`;

      // 1. Process with NVIDIA if selected
      if (provider === "nvidia") {
        const apiKey = process.env.NVIDIA_API_KEY || "";
        if (!apiKey) {
          return res.status(400).json({
            error: "伺服器尚未配置 NVIDIA_API_KEY 環境變數，請在 Secrets 中增設。",
          });
        }

        // Nvidia NIM unified OpenAI-compatible endpoint
        // Supported models typically include meta/llama-3.1-405b-instruct or nvidia/llama-3.1-nemotron-70b-instruct or meta/llama-3.1-8b-instruct
        const selectedNvidiaModel = model || "meta/llama-3.1-8b-instruct";
        console.log(`Calling NVIDIA NIM with model: ${selectedNvidiaModel}`);

        const responseNvidia = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: selectedNvidiaModel,
            messages: [
              { role: "system", content: MOSQUITO_SYSTEM_INSTRUCTION },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 3000
          })
        });

        if (!responseNvidia.ok) {
          const errData = await responseNvidia.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `NVIDIA API responded with status ${responseNvidia.status}`);
        }

        const dataNvidia = await responseNvidia.json();
        const resultText = dataNvidia?.choices?.[0]?.message?.content || "未能生成有效的 NVIDIA 物理分析結果。";
        return res.json({ result: resultText });
      } 
      
      // 2. Default standard: Process with Gemini (Server-side environment key)
      const aiKey = process.env.GEMINI_API_KEY;
      if (!aiKey) {
        return res.status(400).json({
          error: "伺服器尚未配置 GEMINI_API_KEY 環境變數，請於 Secrets 中配置。",
        });
      }

      const ai = new GoogleGenAI({
        apiKey: aiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      console.log("Calling Google Gemini Gen AI...");
      const responseGemini = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: MOSQUITO_SYSTEM_INSTRUCTION,
          temperature: 0.3,
        },
      });

      const resultText = responseGemini.text || "未能生成有效的學術分析結果。";
      return res.json({ result: resultText });

    } catch (error: any) {
      console.error("API Route Error:", error);
      return res.status(500).json({
        error: error.message || "處理物理防蚊智慧設計時發生未知錯誤。",
      });
    }
  });

  // Config Checker route
  app.get("/api/config-check", (req, res) => {
    res.json({
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasNvidiaKey: !!process.env.NVIDIA_API_KEY
    });
  });
}
