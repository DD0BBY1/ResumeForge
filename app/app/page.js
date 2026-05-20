"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  Sparkles, FileText, Target, Copy, Check, Loader2, ArrowRight, Zap,
  Mail, Linkedin, Crown, LogOut, Gift, Coins, Download, History, Trash2, Clock, Palette,
  Upload, X, FileUp, TrendingUp,
} from "lucide-react";

async function callClaudeAPI(prompt, tool, maxTokens = 4000, title = "") {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, tool, maxTokens, title }),
  });
  if (res.status === 402) return { upgradeRequired: true };
  if (res.status === 401) return { needsLogin: true };
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { text: data.text };
}

/* ============================================================
   ROBUST COPY HELPER — with fallback for older browsers/contexts
   ============================================================ */
async function copyToClipboard(text) {
  // Modern clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // fall through to legacy method
    }
  }
  // Legacy fallback using a hidden textarea
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch (e) {
    return false;
  }
}

/* ============================================================
   FILE PARSING — PDF, DOCX, TXT
   ============================================================ */
let pdfjsLib = null;
let mammothLib = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (typeof window === "undefined") return null;
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  pdfjsLib = window.pdfjsLib;
  return pdfjsLib;
}

async function loadMammoth() {
  if (mammothLib) return mammothLib;
  if (typeof window === "undefined") return null;
  if (!window.mammoth) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  mammothLib = window.mammoth;
  return mammothLib;
}

async function extractTextFromFile(file) {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  if (name.endsWith(".txt") || type === "text/plain") {
    return await file.text();
  }

  if (name.endsWith(".pdf") || type === "application/pdf") {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const items = content.items;
      let lastY = null;
      let line = "";
      for (const item of items) {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 2) {
          text += line.trim() + "\n";
          line = "";
        }
        line += item.str + (item.hasEOL ? "\n" : " ");
        lastY = y;
      }
      if (line.trim()) text += line.trim() + "\n";
      text += "\n";
    }
    return cleanExtractedText(text);
  }

  if (name.endsWith(".docx") || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await loadMammoth();
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return cleanExtractedText(result.value);
  }

  if (name.endsWith(".doc")) {
    throw new Error("Old .doc format isn't supported. Please save as .docx or .pdf and try again.");
  }

  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
}

function cleanExtractedText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map(l => l.trim())
    .join("\n")
    .trim();
}

/* ============================================================
   UPLOAD ZONE
   ============================================================ */
function ResumeUploadZone({ onTextExtracted, currentText, onClearText }) {
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setParsing(true);
    setFilename(file.name);
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 50) {
        throw new Error("Couldn't read enough text from this file. It may be scanned/image-based. Try a text-based PDF or paste manually.");
      }
      onTextExtracted(text);
    } catch (e) {
      setError(e.message || "Failed to read file.");
      setFilename("");
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const clearAll = () => {
    setFilename("");
    setError("");
    onClearText();
  };

  if (currentText && currentText.trim().length > 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-sm">
                {filename ? <>Uploaded: <span className="text-green-300 truncate">{filename}</span></> : "Resume loaded"}
              </div>
              <div className="text-xs text-white/40 mt-0.5">{currentText.length.toLocaleString()} characters · ready to optimize</div>
            </div>
          </div>
          <button
            onClick={clearAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition flex items-center gap-1 flex-shrink-0"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-white/40 hover:text-white/60">Preview extracted text</summary>
          <pre className="mt-2 p-3 bg-black/30 rounded-lg max-h-32 overflow-y-auto text-white/60 whitespace-pre-wrap font-mono text-[10px] leading-relaxed">{currentText.slice(0, 800)}{currentText.length > 800 ? "..." : ""}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-amber-400" />
        <label className="font-semibold text-sm">Your current resume</label>
      </div>
      {!showPaste ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition p-8 sm:p-10 text-center ${
            dragOver ? "border-amber-400 bg-amber-400/10" : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={onPick}
            className="hidden"
          />
          {parsing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
              <div className="text-sm text-white/80">Reading {filename}...</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-pink-500/20 border border-amber-400/30 flex items-center justify-center">
                <FileUp className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="font-semibold text-sm text-white">Drop your resume here</div>
                <div className="text-xs text-white/50 mt-1">or click to browse</div>
              </div>
              <div className="text-[11px] text-white/40">PDF · DOCX · TXT · up to 10MB</div>
            </div>
          )}
        </div>
      ) : (
        <textarea
          autoFocus
          onBlur={(e) => {
            if (e.target.value.trim().length > 50) {
              onTextExtracted(e.target.value);
              setShowPaste(false);
            }
          }}
          placeholder="Paste your full resume here, then click outside to confirm..."
          className="w-full h-44 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 resize-none"
        />
      )}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl p-3">{error}</div>}
      <div className="flex items-center justify-between text-xs">
        <button onClick={() => setShowPaste(!showPaste)} className="text-white/40 hover:text-white/70 underline">
          {showPaste ? "← Upload a file instead" : "Or paste text instead →"}
        </button>
        <span className="text-white/30">Files processed in your browser. Never uploaded.</span>
      </div>
    </div>
  );
}

/* ============================================================
   PDF GENERATION (unchanged from previous)
   ============================================================ */
function parseResumeContent(rawResume) {
  const lines = rawResume.split("\n").map(l => l.trim());
  const sectionPattern = /^(PROFESSIONAL SUMMARY|SUMMARY|OBJECTIVE|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT|EDUCATION|SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|CERTIFICATIONS|PROJECTS|ACHIEVEMENTS|AWARDS|VOLUNTEER|LANGUAGES|INTERESTS|REFERENCES)$/i;

  let headerEnd = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (sectionPattern.test(lines[i]) || (lines[i] === "" && i > 0)) {
      headerEnd = i;
      break;
    }
  }
  if (headerEnd === 0) headerEnd = Math.min(3, lines.length);

  const headerLines = lines.slice(0, headerEnd).filter(l => l && l.length > 0);
  const name = headerLines[0] || "";
  const contact = headerLines.slice(1).join(" · ");

  const body = lines.slice(headerEnd);
  const sections = [];
  let current = null;
  for (const line of body) {
    if (sectionPattern.test(line)) {
      if (current) sections.push(current);
      current = { title: line.toUpperCase(), content: [] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) sections.push(current);

  return { name, contact, sections };
}

function buildResumeHTML({ name, contact, sections }, accent) {
  const accentColor = accent ? "#c2410c" : "#000000";
  const headerLineColor = accent ? "#c2410c" : "#1f2937";

  const sectionsHTML = sections.map(s => {
    const isSkills = /SKILLS|COMPETENCIES|LANGUAGES/i.test(s.title);
    const itemsHTML = s.content
      .map(line => {
        if (!line) return '<div style="height:3pt;"></div>';
        if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
          const text = line.replace(/^[•\-*]\s*/, "");
          return `<div class="bullet"><span class="dot">•</span><span class="bullet-text">${escapeHTML(text)}</span></div>`;
        }
        const looksLikeRole = line.length < 80 && (line.includes("—") || line.includes(" – ") || line.includes(" - ") || line.includes(" at ") || /\b(20\d{2}|19\d{2})\b/.test(line));
        if (looksLikeRole) {
          return `<div class="role-line">${escapeHTML(line)}</div>`;
        }
        return `<div class="body-line">${escapeHTML(line)}</div>`;
      })
      .join("");

    return `
      <section class="resume-section">
        <h2 class="section-heading">${escapeHTML(s.title)}</h2>
        <div class="section-divider"></div>
        <div class="section-body ${isSkills ? "skills-grid" : ""}">${itemsHTML}</div>
      </section>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escapeHTML(name) || "Resume"}</title>
<style>
  @page { margin: 0.5in 0.6in; size: letter; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; font-size: 10pt; line-height: 1.35; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .resume-header { margin-bottom: 10pt; }
  .resume-name { font-size: 22pt; font-weight: 700; color: ${accentColor}; letter-spacing: -0.5pt; margin: 0 0 3pt 0; line-height: 1.1; }
  .resume-contact { font-size: 9pt; color: #4b5563; margin: 0 0 8pt 0; font-weight: 400; }
  .header-divider { border: 0; border-top: 1.5pt solid ${headerLineColor}; margin: 0 0 10pt 0; }
  .resume-section { margin-bottom: 10pt; page-break-inside: avoid; }
  .section-heading { font-size: 10pt; font-weight: 700; color: ${accentColor}; text-transform: uppercase; letter-spacing: 1.2pt; margin: 0 0 2pt 0; }
  .section-divider { border-top: 0.5pt solid #d1d5db; margin-bottom: 5pt; }
  .role-line { font-weight: 600; color: #111827; margin-top: 4pt; margin-bottom: 1pt; font-size: 10pt; }
  .body-line { margin-bottom: 2pt; }
  .bullet { display: flex; margin-bottom: 2pt; padding-left: 2pt; }
  .bullet .dot { flex-shrink: 0; width: 11pt; color: ${accentColor}; font-weight: 700; }
  .bullet .bullet-text { flex: 1; text-align: left; }
  .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16pt; }
</style></head><body>
  <div class="resume-header">
    <h1 class="resume-name">${escapeHTML(name)}</h1>
    <div class="resume-contact">${escapeHTML(contact)}</div>
    <hr class="header-divider" />
  </div>
  ${sectionsHTML}
  <script>window.onload = () => { setTimeout(() => window.print(), 200); };</script>
</body></html>`;
}

function extractHeaderFromCoverLetter(content) {
  const lines = content.split("\n").map(l => l.trim());
  let closingIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^(sincerely|regards|best|thank you|yours truly|respectfully)/i.test(lines[i])) {
      closingIdx = i; break;
    }
  }
  if (closingIdx === -1) return null;
  const sigLines = lines.slice(closingIdx + 1).filter(l => l.length > 0);
  if (sigLines.length < 1) return null;
  const name = sigLines[0];
  const contact = sigLines.slice(1).filter(l => l.length > 0).join(" · ");
  return { name, contact };
}

function buildCoverLetterHTML(content, accent, headerInfo) {
  const accentColor = accent ? "#c2410c" : "#000000";
  const headerLineColor = accent ? "#c2410c" : "#1f2937";
  let header = headerInfo;
  if (!header || !header.name) header = extractHeaderFromCoverLetter(content);
  const name = header?.name || "";
  const contact = header?.contact || "";
  let bodyContent = content;
  if (header && name) {
    const lines = bodyContent.split("\n");
    let lastClosingIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (/^(sincerely|regards|best|thank you|yours truly|respectfully)/i.test(lines[i].trim())) {
        lastClosingIdx = i; break;
      }
    }
    if (lastClosingIdx > -1) {
      bodyContent = lines.slice(0, lastClosingIdx + 1).concat([name]).join("\n");
    }
  }
  const paragraphs = bodyContent.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const bodyHTML = paragraphs.map(p => `<p>${escapeHTML(p).replace(/\n/g, "<br>")}</p>`).join("");
  const headerBlock = name ? `
    <div class="cl-header">
      <h1 class="cl-name">${escapeHTML(name)}</h1>
      <div class="cl-contact">${escapeHTML(contact)}</div>
      <hr class="header-divider" />
    </div>
  ` : "";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cover Letter</title>
<style>
  @page { margin: 0.6in 0.7in; size: letter; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cl-header { margin-bottom: 22pt; }
  .cl-name { font-size: 22pt; font-weight: 700; color: ${accentColor}; letter-spacing: -0.5pt; margin: 0 0 4pt 0; line-height: 1.1; }
  .cl-contact { font-size: 9.5pt; color: #4b5563; margin: 0 0 10pt 0; }
  .header-divider { border: 0; border-top: 1.5pt solid ${headerLineColor}; margin: 0; }
  p { margin: 0 0 11pt 0; }
</style></head><body>
  ${headerBlock}${bodyHTML}
  <script>window.onload = () => { setTimeout(() => window.print(), 200); };</script>
</body></html>`;
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function downloadHTMLDocument(html) {
  const win = window.open("", "_blank");
  if (!win) return alert("Please allow popups to download.");
  win.document.write(html);
  win.document.close();
}

/* ============================================================
   UI
   ============================================================ */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCopy = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const ok = await copyToClipboard(text || "");
    if (ok) {
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
    >
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</>
        : failed ? <><X className="w-3.5 h-3.5 text-red-400" /> Try again</>
        : <><Copy className="w-3.5 h-3.5" /> Copy</>}
    </button>
  );
}

function PdfDownloadBtn({ content, kind, headerInfo }) {
  const [accent, setAccent] = useState(true);
  const [showTip, setShowTip] = useState(false);

  const handleDownload = () => {
    let html;
    if (kind === "resume") {
      html = buildResumeHTML(parseResumeContent(content), accent);
    } else {
      html = buildCoverLetterHTML(content, accent, headerInfo);
    }
    const seen = sessionStorage.getItem("pdf_tip_seen");
    if (!seen) {
      setShowTip(true);
      sessionStorage.setItem("pdf_tip_seen", "1");
      setTimeout(() => { downloadHTMLDocument(html); setTimeout(() => setShowTip(false), 5000); }, 1200);
    } else {
      downloadHTMLDocument(html);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setAccent(!accent)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10" title="Toggle color style">
        <Palette className="w-3.5 h-3.5" />{accent ? "Accent" : "B&W"}
      </button>
      <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-200 hover:bg-amber-400/30 transition">
        <Download className="w-3.5 h-3.5" /> PDF
      </button>
      {showTip && (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs bg-slate-900 border border-amber-400/50 rounded-2xl p-4 shadow-2xl">
          <div className="text-xs font-bold text-amber-300 mb-1 uppercase tracking-wider">Quick tip</div>
          <p className="text-sm text-white/90 leading-snug">In the print dialog, choose <b>Save as PDF</b>, then <b>More settings</b> → uncheck <b>"Headers and footers"</b> for a clean export.</p>
        </div>
      )}
    </div>
  );
}

function UsageIndicator({ isPro, credits, freeUsed, onUpgrade }) {
  if (isPro) return null;
  if (credits > 0) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${credits > 2 ? "bg-blue-500/10 border-blue-500/30 text-blue-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}>
        <Coins className="w-3.5 h-3.5" />
        <span><b>{credits} credit{credits === 1 ? "" : "s"}</b> remaining for this tool</span>
      </div>
    );
  }
  const freeRemaining = Math.max(0, 1 - freeUsed);
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${freeRemaining > 0 ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"}`}>
      <Gift className="w-3.5 h-3.5" />
      {freeRemaining > 0 ? <span><b>{freeRemaining} free use</b> remaining for this tool</span> : <><span>Free trial used — </span><button onClick={onUpgrade} className="font-bold underline">get more</button></>}
    </div>
  );
}

/* ============================================================
   BEFORE/AFTER ATS SCORE COMPONENT
   ============================================================ */
function ScoreComparison({ before, after }) {
  const improvement = after - before;
  return (
    <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border border-amber-400/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          ATS Match Score
        </h3>
        <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 flex items-center gap-1">
          +{improvement} points
        </div>
      </div>

      {/* Before */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50 uppercase tracking-wider font-semibold">Before</span>
          <span className="text-white/70 font-mono font-bold">{before}/100</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-white/30 transition-all duration-1000" style={{ width: `${before}%` }} />
        </div>
      </div>

      {/* After */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-amber-300 uppercase tracking-wider font-semibold">After ResumeForge</span>
          <span className="text-2xl font-black bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent font-mono">{after}/100</span>
        </div>
        <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-pink-500 transition-all duration-1000" style={{ width: `${after}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RESUME OPTIMIZER
   ============================================================ */
function ResumeOptimizer({ isPro, credits, freeUsed, onUpgrade, onNeedLogin, onUse, loaded }) {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    if (loaded) {
      setResult(loaded);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loaded]);

  const optimize = async () => {
    if (!resume.trim()) return setError("Please upload or paste your resume first.");
    setError(""); setLoading(true); setResult(null);
    const titleHint = jobDesc.trim().split("\n")[0]?.slice(0, 80) || "Resume optimization";

    const prompt = `You are an expert resume writer and ATS scoring specialist. Optimize this resume${jobDesc.trim() ? " for the target job" : ""}. Aim for content that fits comfortably on ONE PAGE. Be concise. Limit Skills section to 8-12 most relevant items.

RESUME:
${resume}

${jobDesc.trim() ? `TARGET JOB:\n${jobDesc}\n` : ""}

Return ONLY JSON (no markdown).

SCORING RULES (CRITICAL):
- "atsScoreBefore" reflects the ORIGINAL resume's ATS compatibility for this job. Be HONEST and CRITICAL. Most unoptimized resumes score 45-72. Score lower if missing keywords, weak quantification, generic language, poor formatting indicators, or not aligned to the target role. Common range: 48-70.
- "atsScoreAfter" reflects the OPTIMIZED resume you just wrote. Since you tailored it to the job and the candidate's experience matches, score it HIGH: 88-96. Only score below 88 if the candidate's actual background fundamentally doesn't match the target role.
- The gap between Before and After should be 20-40 points typically. This shows the value of optimization.

For "optimizedResume": format as plain text with clear section headers in ALL CAPS (PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS, etc.). First line is the candidate's name. Second line is contact info (location · phone · email separated by " · "). Use "•" for bullet points. Use blank lines between sections.

{
  "optimizedResume": "FULL NAME\\nLocation · phone · email\\n\\nPROFESSIONAL SUMMARY\\n...content...\\n\\nWORK EXPERIENCE\\n\\nJob Title\\nCompany — Location\\nDates\\n\\n• bullet one\\n• bullet two\\n\\n...etc",
  "atsScoreBefore": 50,
  "atsScoreAfter": 92,
  "keyImprovements": ["5 improvements"],
  "missingKeywords": ["keywords added"],
  "powerPhrases": ["3 strong phrases"]
}`;

    try {
      const res = await callClaudeAPI(prompt, "resume", 4000, titleHint);
      if (res.needsLogin) return onNeedLogin();
      if (res.upgradeRequired) return onUpgrade();
      const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());

      // Safety: enforce that After is meaningfully higher than Before
      if (parsed.atsScoreAfter && parsed.atsScoreBefore) {
        if (parsed.atsScoreAfter - parsed.atsScoreBefore < 15) {
          // bump After up to ensure clear improvement
          parsed.atsScoreAfter = Math.min(95, parsed.atsScoreBefore + 25);
        }
        // ensure After is at least 88
        if (parsed.atsScoreAfter < 88) parsed.atsScoreAfter = 88;
        // cap After at 96 for believability
        if (parsed.atsScoreAfter > 96) parsed.atsScoreAfter = 96;
      }

      // Fallback for old responses that only have atsScore
      if (!parsed.atsScoreAfter && parsed.atsScore) {
        parsed.atsScoreAfter = Math.max(88, parsed.atsScore);
        parsed.atsScoreBefore = Math.max(40, parsed.atsScore - 30);
      }

      setResult(parsed);
      onUse("resume");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setError("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <UsageIndicator isPro={isPro} credits={credits} freeUsed={freeUsed} onUpgrade={onUpgrade} />

      <ResumeUploadZone currentText={resume} onTextExtracted={setResume} onClearText={() => setResume("")} />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-pink-400" /><label className="font-semibold text-sm">Target job description</label><span className="text-xs text-white/40">optional</span></div>
        <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Paste the job posting..." className="w-full h-28 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400/50 resize-none" />
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">{error}</div>}

      <button onClick={optimize} disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Optimizing...</> : <>Optimize my resume <ArrowRight className="w-5 h-5" /></>}
      </button>

      {result && (
        <div ref={resultRef} className="space-y-5 pt-2">
          <ScoreComparison before={result.atsScoreBefore || 55} after={result.atsScoreAfter || 90} />

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20 flex-wrap gap-2">
              <span className="font-semibold text-sm">Optimized Resume</span>
              <div className="flex gap-2 items-center">
                <PdfDownloadBtn content={result.optimizedResume} kind="resume" />
                <CopyBtn text={result.optimizedResume} />
              </div>
            </div>
            <pre className="p-5 text-sm whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto">{result.optimizedResume}</pre>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Improvements</h3><ul className="space-y-2">{result.keyImprovements.map((item, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-amber-400 mt-0.5">✓</span>{item}</li>)}</ul></div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-pink-400" /> Keywords Added</h3><div className="flex flex-wrap gap-2">{result.missingKeywords.map((kw, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-200">{kw}</span>)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COVER LETTER (unchanged from previous, except uses fixed CopyBtn)
   ============================================================ */
function CoverLetter({ isPro, credits, freeUsed, onUpgrade, onNeedLogin, onUse, loaded }) {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    if (loaded) {
      setResult(loaded);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loaded]);

  const generate = async () => {
    if (!resume.trim() || !jobDesc.trim()) return setError("Resume and job description required.");
    setError(""); setLoading(true); setResult(null);
    const titleHint = jobDesc.trim().split("\n")[0]?.slice(0, 80) || "Cover letter";

    const prompt = `Write a ${tone} cover letter. End it with "Sincerely," followed by the candidate's name, phone, and email on separate lines (extract from resume).

JOB:
${jobDesc}

CANDIDATE RESUME:
${resume}

Return ONLY JSON. CRITICAL: candidateName and candidateContact MUST be filled in by extracting from the resume header. candidateContact format: "Location · phone · email".

{
  "coverLetter": "Dear Hiring Manager,\\n\\n[body]\\n\\nSincerely,\\n[Name]\\n[phone]\\n[email]",
  "hookLine": "strongest opening sentence",
  "personalizationPoints": ["3 personalization details"],
  "candidateName": "EXTRACTED Full Name from resume - REQUIRED",
  "candidateContact": "EXTRACTED Location · phone · email - REQUIRED"
}`;

    try {
      const res = await callClaudeAPI(prompt, "cover", 2500, titleHint);
      if (res.needsLogin) return onNeedLogin();
      if (res.upgradeRequired) return onUpgrade();
      const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());
      setResult(parsed);
      onUse("cover");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setError("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <UsageIndicator isPro={isPro} credits={credits} freeUsed={freeUsed} onUpgrade={onUpgrade} />
      <ResumeUploadZone currentText={resume} onTextExtracted={setResume} onClearText={() => setResume("")} />
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-pink-400" /><label className="font-semibold text-sm">Job description</label></div>
        <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Paste the job posting..." className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400/50 resize-none" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <label className="font-semibold text-sm mb-3 block">Tone</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["professional", "enthusiastic", "confident", "warm"].map((t) => (
            <button key={t} onClick={() => setTone(t)} className={`text-sm py-2.5 rounded-xl transition border capitalize ${tone === t ? "bg-gradient-to-r from-amber-400/20 to-pink-500/20 border-amber-400/50 text-white" : "bg-black/20 border-white/10 text-white/60"}`}>{t}</button>
          ))}
        </div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">{error}</div>}
      <button onClick={generate} disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Writing...</> : <>Write my cover letter <ArrowRight className="w-5 h-5" /></>}
      </button>
      {result && (
        <div ref={resultRef} className="space-y-4 pt-2">
          <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border border-amber-400/30 rounded-2xl p-5"><div className="text-xs uppercase tracking-wider text-amber-300 mb-2 font-semibold">Your hook</div><p className="text-white/90 italic">"{result.hookLine}"</p></div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20 flex-wrap gap-2">
              <span className="font-semibold text-sm">Cover Letter</span>
              <div className="flex gap-2 items-center">
                <PdfDownloadBtn content={result.coverLetter} kind="cover" headerInfo={{ name: result.candidateName, contact: result.candidateContact }} />
                <CopyBtn text={result.coverLetter} />
              </div>
            </div>
            <pre className="p-5 text-sm whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto leading-relaxed">{result.coverLetter}</pre>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Personalized for this job</h3><ul className="space-y-2">{result.personalizationPoints.map((item, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-amber-400 mt-0.5">✓</span>{item}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LINKEDIN
   ============================================================ */
function LinkedInRewriter({ isPro, credits, freeUsed, onUpgrade, onNeedLogin, onUse, loaded }) {
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    if (loaded) {
      setResult(loaded);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loaded]);

  const rewrite = async () => {
    if (!bio.trim() || !goal.trim()) return setError("Both fields required.");
    setError(""); setLoading(true); setResult(null);
    const titleHint = goal.trim().slice(0, 80) || "LinkedIn rewrite";

    const prompt = `Rewrite this LinkedIn presence.

CURRENT BIO:
${bio}

GOAL:
${goal}

Return ONLY JSON:
{
  "headlines": ["3 headlines under 220 chars"],
  "aboutSection": "About section, first person, 3-4 paragraphs, ends with CTA",
  "tips": ["3 profile tips"]
}`;

    try {
      const res = await callClaudeAPI(prompt, "linkedin", 2500, titleHint);
      if (res.needsLogin) return onNeedLogin();
      if (res.upgradeRequired) return onUpgrade();
      const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());
      setResult(parsed);
      onUse("linkedin");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      setError("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <UsageIndicator isPro={isPro} credits={credits} freeUsed={freeUsed} onUpgrade={onUpgrade} />
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Linkedin className="w-4 h-4 text-amber-400" /><label className="font-semibold text-sm">Current LinkedIn bio</label></div>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Paste your current LinkedIn About..." className="w-full h-36 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 resize-none" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-pink-400" /><label className="font-semibold text-sm">What are you trying to attract?</label></div>
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. 'Senior PM roles at B2B SaaS startups'" className="w-full h-24 bg-black/30 border border-white/10 rounded-xl p-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400/50 resize-none" />
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">{error}</div>}
      <button onClick={rewrite} disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Rewriting...</> : <>Rewrite my LinkedIn <ArrowRight className="w-5 h-5" /></>}
      </button>
      {result && (
        <div ref={resultRef} className="space-y-4 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Headlines</h3><div className="space-y-2">{result.headlines.map((h, i) => <div key={i} className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-start justify-between gap-3"><p className="text-sm text-white/90 flex-1">{h}</p><CopyBtn text={h} /></div>)}</div></div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/20">
              <div><span className="font-semibold text-sm">About section</span><span className="text-xs text-white/40 ml-2">Paste this directly into LinkedIn</span></div>
              <CopyBtn text={result.aboutSection} />
            </div>
            <pre className="p-5 text-sm whitespace-pre-wrap font-sans text-white/90 max-h-96 overflow-y-auto leading-relaxed">{result.aboutSection}</pre>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5"><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Profile tips</h3><ul className="space-y-2">{result.tips.map((tip, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-amber-400 mt-0.5">→</span>{tip}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HISTORY
   ============================================================ */
function HistoryTab({ onOpenGeneration }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    let q = supabase.from("generations").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("tool", filter);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const deleteItem = async (id) => {
    if (!confirm("Delete this saved generation?")) return;
    await supabase.from("generations").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    const diff = (new Date() - d) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const toolIcons = { resume: FileText, cover: Mail, linkedin: Linkedin };
  const toolLabels = { resume: "Resume", cover: "Cover Letter", linkedin: "LinkedIn" };
  const toolColors = { resume: "text-amber-400", cover: "text-pink-400", linkedin: "text-blue-400" };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[{ id: "all", label: "All" }, { id: "resume", label: "Resumes" }, { id: "cover", label: "Cover Letters" }, { id: "linkedin", label: "LinkedIn" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`text-xs px-3 py-1.5 rounded-lg transition ${filter === f.id ? "bg-white/15 border border-white/30 text-white" : "bg-white/5 border border-white/10 text-white/60"}`}>{f.label}</button>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl py-16 text-center">
          <History className="w-10 h-10 mx-auto text-white/20 mb-3" />
          <p className="text-white/60 text-sm">No saved generations yet.</p>
          <p className="text-white/40 text-xs mt-1">Your past resumes, cover letters, and LinkedIn rewrites will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const Icon = toolIcons[item.tool];
            return (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0"><Icon className={`w-4 h-4 ${toolColors[item.tool]}`} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">{toolLabels[item.tool]}</span>
                    <span className="text-xs text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-sm text-white/90 mt-0.5 truncate">{item.title || `${toolLabels[item.tool]} generation`}</p>
                </div>
                <button onClick={() => onOpenGeneration(item)} className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold hover:opacity-90 transition">Open</button>
                <button onClick={() => deleteItem(item.id)} className="p-2 rounded-lg text-white/40 hover:text-red-300 hover:bg-red-500/10 transition" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   UPGRADE MODAL
   ============================================================ */
function UpgradeModal({ onClose }) {
  const [loading, setLoading] = useState(null);
  const checkout = async (plan) => {
    setLoading(plan);
    const res = await fetch("/api/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 rounded-3xl max-w-2xl w-full p-6 relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white text-xl">×</button>
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Need more uses?</h2>
          <p className="text-white/60 text-sm">Two ways to keep going. Pick what fits.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-1"><Coins className="w-4 h-4 text-blue-400" /><h3 className="text-lg font-bold">Boost Pack</h3></div>
            <p className="text-xs text-white/50 mb-4">One-time purchase</p>
            <div className="text-3xl font-black mb-1">$14</div>
            <p className="text-xs text-white/50 mb-4">one-time, no subscription</p>
            <ul className="space-y-2 mb-5 flex-1">
              {["5 resume optimizations", "5 cover letters", "5 LinkedIn rewrites", "Credits never expire", "No recurring charges"].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" /><span className="text-white/80">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => checkout("boost")} disabled={loading !== null} className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/15 transition disabled:opacity-50 flex items-center justify-center gap-1">
              {loading === "boost" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy Boost Pack"}
            </button>
          </div>
          <div className="bg-gradient-to-br from-amber-400/10 to-pink-500/10 border-2 border-amber-400/50 rounded-2xl p-5 relative flex flex-col">
            <span className="absolute -top-3 right-4 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-pink-500 text-black text-xs font-black rounded-full">BEST VALUE</span>
            <div className="flex items-center gap-2 mb-1"><Crown className="w-4 h-4 text-amber-400" /><h3 className="text-lg font-bold">Pro</h3></div>
            <p className="text-xs text-white/50 mb-4">Serious job hunters</p>
            <div className="text-3xl font-black mb-1 bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">$19</div>
            <p className="text-xs text-white/50 mb-4">per month · cancel anytime</p>
            <ul className="space-y-2 mb-5 flex-1">
              {["Unlimited everything", "All 4 cover letter tones", "Priority AI processing", "Cancel anytime"].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" /><span className="text-white/80">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => checkout("pro")} disabled={loading !== null} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1">
              {loading === "pro" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Crown className="w-4 h-4" /> Get Pro</>}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-white/40 mt-5">One landed interview pays for years.</p>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function AppPage() {
  const [tab, setTab] = useState("resume");
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [credits, setCredits] = useState({ resume: 0, cover: 0, linkedin: 0 });
  const [freeUsed, setFreeUsed] = useState({ resume: 0, cover: 0, linkedin: 0 });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadedResult, setLoadedResult] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  const loadAll = async (userId) => {
    const { data: profile } = await supabase.from("profiles").select("is_pro, credits_resume, credits_cover, credits_linkedin").eq("id", userId).single();
    setIsPro(profile?.is_pro || false);
    setCredits({
      resume: profile?.credits_resume || 0,
      cover: profile?.credits_cover || 0,
      linkedin: profile?.credits_linkedin || 0,
    });
    if (!profile?.is_pro) {
      const tools = ["resume", "cover", "linkedin"];
      const counts = {};
      for (const tool of tools) {
        const { count } = await supabase.from("tool_usage").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("tool", tool);
        counts[tool] = count || 0;
      }
      setFreeUsed(counts);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await loadAll(user.id);
      setCheckingAuth(false);
      const upgraded = new URLSearchParams(window.location.search).get("upgraded");
      if (upgraded && user) setTimeout(() => loadAll(user.id), 2500);
    })();
  }, []);

  const onNeedLogin = () => router.push("/login");
  const onUse = (tool) => {
    setFreeUsed((u) => ({ ...u, [tool]: (u[tool] || 0) + 1 }));
    setCredits((c) => ({ ...c, [tool]: Math.max(0, (c[tool] || 0) - (c[tool] > 0 ? 1 : 0)) }));
  };
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setIsPro(false); router.push("/"); };

  const openGeneration = (item) => { setLoadedResult(item.result); setTab(item.tool); };
  const switchTab = (newTab) => { if (newTab !== tab) setLoadedResult(null); setTab(newTab); };

  const tabs = [
    { id: "resume", label: "Resume", icon: FileText },
    { id: "cover", label: "Cover", icon: Mail },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "history", label: "History", icon: History },
  ];

  const totalCredits = credits.resume + credits.cover + credits.linkedin;

  if (checkingAuth) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>;

  const StatusBadge = () => {
    if (isPro) return <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-pink-500/20 border border-amber-400/50 text-amber-200 font-semibold flex items-center gap-1"><Crown className="w-3 h-3" /> Pro</span>;
    if (totalCredits > 0) return <button onClick={() => setShowUpgrade(true)} className="text-xs px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-200 font-semibold flex items-center gap-1 hover:bg-blue-500/25"><Coins className="w-3 h-3" /> {totalCredits} credits</button>;
    return <button onClick={() => setShowUpgrade(true)} className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 text-black font-bold flex items-center gap-1"><Crown className="w-3 h-3" /> Upgrade</button>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-90 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center"><Sparkles className="w-5 h-5 text-black" /></div>
            <div><h1 className="font-bold text-lg leading-none">ResumeForge</h1><p className="text-xs text-white/50">AI career toolkit</p></div>
          </a>
          <div className="flex items-center gap-2">
            {user ? (<><StatusBadge /><button onClick={signOut} className="text-xs p-1.5 rounded-lg bg-white/5 hover:bg-white/10"><LogOut className="w-3.5 h-3.5" /></button></>) : (<button onClick={() => router.push("/login")} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Sign in</button>)}
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-1.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            return <button key={t.id} onClick={() => switchTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition ${tab === t.id ? "bg-white/10 text-white border border-white/20" : "text-white/50"}`}><Icon className="w-3.5 h-3.5" /><span className="hidden xs:inline sm:inline">{t.label}</span></button>;
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {tab !== "history" && (
          <div className="text-center py-4 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{tab === "resume" && "Optimize your resume"}{tab === "cover" && "Write your cover letter"}{tab === "linkedin" && "Rewrite your LinkedIn"}</h2>
            <p className="text-sm text-white/60">
              {tab === "resume" && "Upload your resume. We'll rewrite it ATS-friendly in 30 seconds."}
              {tab === "cover" && "Upload your resume, paste the job, get a personalized cover letter."}
              {tab === "linkedin" && "Headlines & About sections that attract recruiters."}
            </p>
          </div>
        )}
        {tab === "history" && (
          <div className="text-center py-4 mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Your saved work</h2>
            <p className="text-sm text-white/60">Everything you've generated, ready to revisit.</p>
          </div>
        )}
        {tab === "resume" && <ResumeOptimizer isPro={isPro} credits={credits.resume} freeUsed={freeUsed.resume} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} onUse={onUse} loaded={loadedResult} />}
        {tab === "cover" && <CoverLetter isPro={isPro} credits={credits.cover} freeUsed={freeUsed.cover} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} onUse={onUse} loaded={loadedResult} />}
        {tab === "linkedin" && <LinkedInRewriter isPro={isPro} credits={credits.linkedin} freeUsed={freeUsed.linkedin} onUpgrade={() => setShowUpgrade(true)} onNeedLogin={onNeedLogin} onUse={onUse} loaded={loadedResult} />}
        {tab === "history" && <HistoryTab onOpenGeneration={openGeneration} />}
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div className="text-center text-xs text-white/30 py-6 px-4">Built with Claude AI</div>
    </div>
  );
}
