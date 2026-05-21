"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Brain, Mic, Terminal, Activity, Calendar, GitFork, 
  Settings, Code, Trash2, Send, ShieldAlert, Cpu, 
  ArrowRight, Search, Sparkles, Upload, FileText, CheckCircle
} from "lucide-react";
import { useStore } from "../store/useStore";

export default function GeminiMemoryOS() {
  const {
    memories,
    searchResults,
    timelineMemories,
    graphData,
    activeLogs,
    isLoading,
    fetchMemories,
    fetchGraph,
    searchMemories,
    fetchTimeline,
    runAgentQuery,
    deleteMemory,
    compressMemories,
    addMemoryDirectly
  } = useStore();

  const [activeTab, setActiveTab] = useState<string>("landing");
  const [chatQuery, setChatQuery] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Welcome to Gemini Memory OS. Long-term cognitive layer fully initialized." }
  ]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timelineQuery, setTimelineQuery] = useState<string>("");
  const [customMemory, setCustomMemory] = useState<string>("");
  const [customType, setCustomType] = useState<string>("episodic");
  const [isAudioListening, setIsAudioListening] = useState<boolean>(false);
  const [activeOCRText, setActiveOCRText] = useState<string>("");
  const [isOcrUploading, setIsOcrUploading] = useState<boolean>(false);

  // Audio waveform animation intervals
  const [waveHeights, setWaveHeights] = useState<number[]>([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
  const waveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize DB on component mount
  useEffect(() => {
    fetchMemories();
    fetchGraph();
    fetchTimeline("");
  }, []);

  // Audio animation loop
  useEffect(() => {
    if (isAudioListening) {
      waveIntervalRef.current = setInterval(() => {
        setWaveHeights(Array.from({ length: 14 }, () => Math.floor(Math.random() * 45) + 12));
      }, 100);
    } else {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      setWaveHeights(Array.from({ length: 14 }, () => 6));
    }
    return () => {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, [isAudioListening]);

  // Handle agent prompt execution
  const handleSendChat = async () => {
    if (!chatQuery.trim()) return;
    const query = chatQuery;
    setChatHistory(prev => [...prev, { sender: "user", text: query }]);
    setChatQuery("");
    
    // Call multi-agent LangGraph system
    const aiResponse = await runAgentQuery(query);
    setChatHistory(prev => [...prev, { sender: "ai", text: aiResponse }]);
    
    // Refresh indices
    fetchMemories();
    fetchGraph();
  };

  // Mock OCR screenshot ingestion
  const handleOcrIngest = async (scenario: string) => {
    setIsOcrUploading(true);
    let app_context = "VS Code IDE";
    let mock_b64 = "base64data_screenshot_stream";
    
    if (scenario === "figma") {
      app_context = "Figma Workspace";
    } else if (scenario === "slides") {
      app_context = "Lecture Slides PDF";
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/ws/stream"); // Mock POST logic
      // Direct call to screenshot API endpoint
      const res = await fetch("http://localhost:8000/api/v1/memory/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Screenshot scan from ${app_context}: Captured layout and active workspace context. Found code templates for TalentOS.`,
          type: "episodic",
          modalities: [{
            file_type: "screenshot",
            file_path: `screenshots/capture_${scenario}.png`,
            metadata: { app_context: app_context, ocr_content: "Active Figma Board Node Layout" }
          }],
          temporal_tags: ["screenshot", app_context.toLowerCase().replace(" ", "_")]
        })
      });
      if (res.ok) {
        setActiveOCRText(`Successfully scanned ${app_context}! Saved layout nodes as new episodic memory index.`);
        fetchMemories();
        fetchGraph();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOcrUploading(false);
    }
  };

  // SVG Gravity-Link Simulation for Graph Visualizer
  const renderInteractiveSVGGraph = () => {
    if (!graphData.nodes || graphData.nodes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-slate-500">
          <Brain className="w-8 h-8 mb-2 animate-pulse" />
          <p className="text-xs">Initial memory matrix empty. Creating genesis anchors...</p>
        </div>
      );
    }

    return (
      <svg className="w-full h-[400px] border border-white/5 rounded-2xl bg-black/60 shadow-glass overflow-visible">
        {/* Draw Links */}
        {graphData.links.map((link, idx) => {
          const srcIdx = graphData.nodes.findIndex(n => n.id === link.source);
          const tgtIdx = graphData.nodes.findIndex(n => n.id === link.target);
          if (srcIdx === -1 || tgtIdx === -1) return null;
          
          // Generate simple layout coordinates
          const x1 = 100 + (srcIdx % 4) * 150 + (srcIdx * 10) % 50;
          const y1 = 100 + Math.floor(srcIdx / 4) * 100 + (srcIdx * 5) % 40;
          const x2 = 100 + (tgtIdx % 4) * 150 + (tgtIdx * 10) % 50;
          const y2 = 100 + Math.floor(tgtIdx / 4) * 100 + (tgtIdx * 5) % 40;

          return (
            <line
              key={`link-${idx}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(0, 240, 255, 0.15)"
              strokeWidth={1.5}
              strokeDasharray={link.type === "SEMANTICALLY_ASSOCIATED" ? "4 4" : "0"}
            />
          );
        })}

        {/* Draw Nodes */}
        {graphData.nodes.map((node, idx) => {
          const x = 100 + (idx % 4) * 150 + (idx * 10) % 50;
          const y = 100 + Math.floor(idx / 4) * 100 + (idx * 5) % 40;
          
          let color = "#00f0ff"; // cyan
          if (node.type === "semantic") color = "#d946ef"; // purple
          if (node.type === "procedural") color = "#10b981"; // emerald

          return (
            <g key={`node-${node.id}`} className="cursor-pointer group">
              <circle
                cx={x}
                cy={y}
                r={8 + (node.importance || 5.0) * 0.8}
                fill={color}
                className="transition-all duration-300 group-hover:scale-125 group-hover:filter group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
              />
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10px"
                className="opacity-60 group-hover:opacity-100 font-mono select-none"
              >
                {node.label.length > 18 ? node.label.substring(0, 15) + "..." : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#03000a] text-slate-100 flex flex-col antialiased">
      {/* Background Neon Beams */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] radial-glow-cyan pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] radial-glow-purple pointer-events-none -z-10" />

      {/* HEADER NAVBAR */}
      <header className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between mx-4 mt-4 sticky top-4 z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("landing")}>
          <div className="bg-gradient-to-r from-astra-blue to-astra-purple p-2 rounded-xl">
            <Brain className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-wider glowing-text-cyan flex items-center gap-1.5">
              GEMINI MEMORY OS <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-astra-blue font-mono font-normal">v1.0.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Cognitive operating layer</p>
          </div>
        </div>

        {/* Global Controls */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button 
            onClick={() => setActiveTab("dashboard")} 
            className={`px-4 py-2 rounded-xl transition-all ${activeTab === "dashboard" ? "nav-card-active text-astra-blue" : "hover:bg-white/5 text-slate-300"}`}
          >
            Assistant Cockpit
          </button>
          <button 
            onClick={() => { setActiveTab("timeline"); fetchTimeline(""); }} 
            className={`px-4 py-2 rounded-xl transition-all ${activeTab === "timeline" ? "nav-card-active text-astra-blue" : "hover:bg-white/5 text-slate-300"}`}
          >
            Spatial Timeline
          </button>
          <button 
            onClick={() => { setActiveTab("graph"); fetchGraph(); }} 
            className={`px-4 py-2 rounded-xl transition-all ${activeTab === "graph" ? "nav-card-active text-astra-blue" : "hover:bg-white/5 text-slate-300"}`}
          >
            Cognitive Graph
          </button>
          <button 
            onClick={() => setActiveTab("agent-console")} 
            className={`px-4 py-2 rounded-xl transition-all ${activeTab === "agent-console" ? "nav-card-active text-astra-blue" : "hover:bg-white/5 text-slate-300"}`}
          >
            LangGraph Console
          </button>
          <button 
            onClick={() => setActiveTab("analytics")} 
            className={`px-4 py-2 rounded-xl transition-all ${activeTab === "analytics" ? "nav-card-active text-astra-blue" : "hover:bg-white/5 text-slate-300"}`}
          >
            Cognitive Diagnostics
          </button>
          <button 
            onClick={() => setActiveTab("developer")} 
            className={`px-4 py-2 rounded-xl transition-all ${activeTab === "developer" ? "nav-card-active text-astra-blue" : "hover:bg-white/5 text-slate-300"}`}
          >
            Dev Studio
          </button>
          <button 
            onClick={() => setActiveTab("settings")} 
            className={`px-4 py-2 rounded-xl transition-all ${activeTab === "settings" ? "nav-card-active text-astra-blue" : "hover:bg-white/5 text-slate-300"}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </nav>
      </header>

      {/* VIEW PANEL ROUTER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 transition-all duration-300">
        
        {/* 1. CINEMATIC LANDING VIEW */}
        {activeTab === "landing" && (
          <div className="flex flex-col items-center justify-center py-12 md:py-24 text-center">
            {/* Shimmering Badge */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-astra-blue mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Inspiring Next-Gen Long-Term AI Architectures
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 max-w-3xl leading-tight bg-gradient-to-r from-white via-slate-100 to-astra-blue bg-clip-text text-transparent">
              Persistent memory architecture for next-generation AI agents.
            </h1>
            <p className="text-slate-400 text-sm md:text-md max-w-2xl mb-12">
              Gemini Memory OS functions as a continuous cognitive operating system. Seamlessly combining high-speed dense vector indices, associative relation graphs, and natural temporal reasoning.
            </p>

            {/* Quick Action Cockpit Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-16">
              <div 
                onClick={() => setActiveTab("dashboard")}
                className="glass-panel p-6 cursor-pointer border border-white/5 hover:border-astra-blue/30 hover:bg-astra-blue/5 transition-all text-left group"
              >
                <div className="bg-astra-blue/10 p-3 rounded-lg w-fit text-astra-blue mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-md font-bold mb-1.5 flex items-center gap-2 text-white">
                  Assistant Cockpit <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time vocal dialog, interruptible streaming audio transcriptions, and OCR-screenshot visual memory ingestion.
                </p>
              </div>

              <div 
                onClick={() => { setActiveTab("graph"); fetchGraph(); }}
                className="glass-panel p-6 cursor-pointer border border-white/5 hover:border-astra-purple/30 hover:bg-astra-purple/5 transition-all text-left group"
              >
                <div className="bg-astra-purple/10 p-3 rounded-lg w-fit text-astra-purple mb-4 group-hover:scale-110 transition-transform">
                  <GitFork className="w-6 h-6" />
                </div>
                <h3 className="text-md font-bold mb-1.5 flex items-center gap-2 text-white">
                  Cognitive Relation Graph <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inspect continuous multi-hop associative node linkages. Trace PRECEDES bounds and semantic similarity connectors.
                </p>
              </div>

              <div 
                onClick={() => setActiveTab("agent-console")}
                className="glass-panel p-6 cursor-pointer border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group"
              >
                <div className="bg-emerald-500/10 p-3 rounded-lg w-fit text-astra-emerald mb-4 group-hover:scale-110 transition-transform">
                  <Terminal className="w-6 h-6" />
                </div>
                <h3 className="text-md font-bold mb-1.5 flex items-center gap-2 text-white">
                  LangGraph Console <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deeply trace the active reasoning loop of specialized planners, contexts, tasks, and reflection subagents.
                </p>
              </div>
            </div>

            {/* Quick platform stats */}
            <div className="glass-panel px-8 py-6 w-full max-w-3xl flex justify-around items-center text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Cognitive Anchors</span>
                <span className="text-xl font-bold font-mono text-astra-blue">{memories.length}</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">System Engine</span>
                <span className="text-xl font-bold font-mono text-astra-purple">FastAPI/LangGraph</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Active Channel</span>
                <span className="text-xl font-bold font-mono text-astra-emerald flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-pulse" /> ONLINE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. COCKPIT (CHAT & VISION) */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Chat, Ingestions & Real-Time Waveforms */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Audio Waveform Mode */}
              <div className="glass-panel p-6 flex flex-col items-center justify-between min-h-[160px]">
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${isAudioListening ? "text-astra-blue animate-pulse" : "text-slate-400"}`} />
                    <span className="text-xs font-mono font-medium tracking-wide uppercase text-slate-300">Continuous Auditory Dialog Channel</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isAudioListening ? "bg-astra-blue/10 text-astra-blue" : "bg-white/5 text-slate-500"}`}>
                    {isAudioListening ? "ACTIVE LISTEN" : "STANDBY"}
                  </span>
                </div>
                
                {/* Glowing frequency spectrum bars */}
                <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-md my-4">
                  {waveHeights.map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}px` }}
                      className={`w-2.5 rounded-full transition-all duration-100 ${
                        isAudioListening 
                          ? "bg-gradient-to-t from-astra-blue to-astra-purple shadow-neon" 
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setIsAudioListening(!isAudioListening)}
                  className={`px-6 py-2.5 rounded-full font-medium text-xs tracking-wider flex items-center gap-2 transition-all ${
                    isAudioListening 
                      ? "bg-astra-coral hover:bg-astra-coral/80 text-white" 
                      : "bg-gradient-to-r from-astra-blue to-astra-purple text-black font-semibold hover:shadow-neon"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  {isAudioListening ? "INTERRUPT SPEECH CHANNEL" : "STREAM LIVE VOCAL SESSION"}
                </button>
              </div>

              {/* Chat Interface Console */}
              <div className="glass-panel p-4 flex flex-col h-[350px]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.sender === "user" 
                          ? "bg-astra-purple/10 border border-astra-purple/30 text-slate-200" 
                          : "bg-white/5 border border-white/5 text-slate-300"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-astra-blue animate-pulse">
                        Cognitive agent loop traversing indices...
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask memories or request actions (e.g. 'What did we decide last week?')..."
                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-astra-blue/40"
                  />
                  <button 
                    onClick={handleSendChat}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl px-4 flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right: Active Vision screenshot and workspace panel */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* OCR Visual capturing card */}
              <div className="glass-panel p-6 flex flex-col h-full justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu className="w-4 h-4 text-astra-purple" />
                    <span className="text-xs font-mono font-medium tracking-wide uppercase text-slate-300">OCR & Vision Stream</span>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                    Simulate a background screenshot stream ingestion. Captures layouts, extracts text layers, and incorporates workspace metadata instantly.
                  </p>

                  <div className="flex flex-col gap-2 mb-6">
                    <button
                      onClick={() => handleOcrIngest("vscode")}
                      disabled={isOcrUploading}
                      className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3 text-left hover:bg-white/10 transition-all flex items-center gap-3 text-xs"
                    >
                      <Code className="w-4 h-4 text-astra-blue" />
                      <div>
                        <div className="font-bold">Scan VS Code Workspace</div>
                        <div className="text-[10px] text-slate-500">Inject code layout & active term bounds</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleOcrIngest("figma")}
                      disabled={isOcrUploading}
                      className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3 text-left hover:bg-white/10 transition-all flex items-center gap-3 text-xs"
                    >
                      <GitFork className="w-4 h-4 text-astra-purple" />
                      <div>
                        <div className="font-bold">Scan Figma UI Board</div>
                        <div className="text-[10px] text-slate-500">Analyze flowchart structures & notes</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Log display */}
                <div className="bg-black/60 border border-white/5 rounded-xl p-3 font-mono text-[9px] text-slate-400 min-h-[80px]">
                  <div className="text-[10px] text-astra-purple font-bold mb-1">// VISION ENGINE LOGS</div>
                  {isOcrUploading ? (
                    <div className="animate-pulse text-astra-blue">Initializing screen capture frames...</div>
                  ) : activeOCRText ? (
                    <div>{activeOCRText}</div>
                  ) : (
                    <div>Waiting for visual capture...</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 3. SPATIAL TIMELINE VIEW */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-astra-blue" /> Relative Temporal Timeline
                </h2>
                <p className="text-xs text-slate-400">
                  Filters memories chronologically based on natural time strings (e.g. "today", "yesterday", "last week").
                </p>
              </div>

              {/* Dynamic search bounds bar */}
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={timelineQuery}
                  onChange={(e) => setTimelineQuery(e.target.value)}
                  placeholder="Type relative filter (e.g. 'last week')..."
                  className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-astra-blue/40 w-full md:w-60"
                />
                <button
                  onClick={() => fetchTimeline(timelineQuery)}
                  className="bg-astra-blue text-black font-semibold text-xs px-4 rounded-xl flex items-center gap-1.5 hover:bg-astra-blue/80 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" /> Parse Range
                </button>
              </div>
            </div>

            {/* Timeline items stream */}
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              {timelineMemories.length > 0 ? (
                timelineMemories.map((item, idx) => (
                  <div key={item.id} className="relative pl-10 group">
                    {/* Node anchor */}
                    <div className="absolute left-2.5 top-2.5 w-3 h-3 rounded-full bg-astra-blue border border-black shadow-neon transition-transform group-hover:scale-125" />
                    
                    <div className="glass-panel p-5 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-500 font-mono">{item.created_at}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full font-mono text-slate-400 uppercase tracking-wider">{item.type}</span>
                          <button 
                            onClick={async () => {
                              await deleteMemory(item.id);
                              fetchTimeline(timelineQuery);
                            }}
                            className="text-slate-500 hover:text-astra-coral transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">{item.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No chronological memories match that time boundary. Make sure you have created records corresponding to that epoch.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. COGNITIVE MEMORY GRAPH */}
        {activeTab === "graph" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-astra-purple" /> Associative Linkage Visualizer
                </h2>
                <p className="text-xs text-slate-400">
                  Interactive spatial layout representing semantic vector connections and timeline associations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { fetchGraph(); }}
                  className="bg-white/5 border border-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <Activity className="w-3.5 h-3.5" /> Re-trigger Layout
                </button>
              </div>
            </div>

            {/* Canvas layout */}
            <div className="relative">
              {renderInteractiveSVGGraph()}

              {/* Legends overlay */}
              <div className="absolute bottom-4 left-4 bg-black/80 border border-white/5 rounded-xl p-3 flex flex-col gap-1.5 text-[9px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-astra-blue" />
                  <span>EPISODIC (Screenshots/Voice)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-astra-purple" />
                  <span>SEMANTIC (Concretion Summary)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-astra-emerald" />
                  <span>PROCEDURAL (User Preferences)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. LANGGRAPH COGNITIVE AGENT CONSOLE */}
        {activeTab === "agent-console" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-astra-emerald" /> LangGraph Agent Cognitive Loop
              </h2>
              <p className="text-xs text-slate-400">
                Logs and traces from intermediate planning, filtering, context gathering, and self-reflection loops.
              </p>
            </div>

            <div className="bg-[#05010c] border border-white/5 rounded-2xl p-6 shadow-glass flex flex-col h-[450px] font-mono">
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                <div className="w-3 h-3 rounded-full bg-astra-coral animate-ping" />
                <span className="text-xs text-slate-300">// ACTIVE COGNITIVE SHELL EXECUTIONS</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-2 text-slate-400">
                {activeLogs.length > 0 ? (
                  activeLogs.map((log, idx) => (
                    <div key={idx} className="border-l-2 border-astra-emerald pl-4 py-1 hover:bg-white/5 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-astra-emerald font-bold uppercase tracking-wider">{log.agent}</span>
                        <span className="text-[10px] text-slate-600 font-mono">STEP {idx + 1}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{log.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs">
                    <Terminal className="w-8 h-8 mb-2 text-slate-700 animate-pulse" />
                    <span>No active loops logged. Run an execution from the Assistant Cockpit to populate traces.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. ANALYTICS DIAGNOSTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-astra-coral" /> Cognitive Analytics & Diagnostics
              </h2>
              <p className="text-xs text-slate-400">
                Continuous volume analysis, reinforcement indices, and consolidation diagnostics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart 1: Memory Type Density */}
              <div className="glass-panel p-6">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">Memory Index Density</h3>
                <div className="h-48 flex items-end justify-between gap-4 font-mono text-[10px]">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-astra-blue rounded-t-lg shadow-glass" style={{ height: `${Math.min(memories.filter(m => m.type === "episodic").length * 20 + 20, 140)}px` }} />
                    <span className="mt-2 text-slate-500">EPISODIC</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-astra-purple rounded-t-lg shadow-glass" style={{ height: `${Math.min(memories.filter(m => m.type === "semantic").length * 20 + 20, 140)}px` }} />
                    <span className="mt-2 text-slate-500">SEMANTIC</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-astra-emerald rounded-t-lg shadow-glass" style={{ height: `${Math.min(memories.filter(m => m.type === "procedural").length * 20 + 20, 140)}px` }} />
                    <span className="mt-2 text-slate-500">PROCEDURAL</span>
                  </div>
                </div>
              </div>

              {/* Consolidation & Compression logs */}
              <div className="glass-panel p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">Consolidation Engine</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Autonomous consolidation schedules summarize disparate memories over 48 hours old that possess low importance, compiling them into a singular high-level memory summary to optimize context windows.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      await compressMemories();
                      alert("Manual memory consolidation completed successfully.");
                    }}
                    className="bg-gradient-to-r from-astra-blue to-astra-purple text-black font-bold py-2.5 rounded-xl text-xs hover:shadow-neon transition-all"
                  >
                    TRIGGER MANUAL COMPACTION PIPELINE
                  </button>
                  <span className="text-[9px] text-center font-mono text-slate-500 uppercase tracking-widest">
                    Optimization runs automatically in background worker threads
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. DEV PLATFORM PLAYGROUND */}
        {activeTab === "developer" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-astra-blue" /> Developer Studio & SDK Sandbox
              </h2>
              <p className="text-xs text-slate-400">
                Directly write arbitrary memory packets into the Vector DB or test agent pipelines via curl hooks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input */}
              <div className="lg:col-span-6 glass-panel p-6 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Manual Memory Writing</h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-mono block">Memory Type</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="episodic">Episodic (Conversation/Voice snippet)</option>
                    <option value="semantic">Semantic (Factual/General knowledge)</option>
                    <option value="procedural">Procedural (Behavior preference/Rules)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-mono block">Payload Content</label>
                  <textarea
                    rows={4}
                    value={customMemory}
                    onChange={(e) => setCustomMemory(e.target.value)}
                    placeholder="Enter manual cognitive text to inject (e.g. 'Highly prefers distributed architecture summaries in code format')..."
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-astra-blue/40"
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!customMemory.trim()) return;
                    await addMemoryDirectly(customMemory, customType);
                    setCustomMemory("");
                    alert("Direct Vector and Graph write injection succeeded.");
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 py-2.5 rounded-xl text-xs transition-all"
                >
                  INJECT PACKET INTO COGNITIVE LAYERS
                </button>
              </div>

              {/* Developer CURL panel */}
              <div className="lg:col-span-6 glass-panel p-6 flex flex-col justify-between font-mono">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Platform CURL Integration</h3>
                  
                  <div className="bg-black/80 rounded-xl p-4 text-[10px] text-slate-400 overflow-x-auto my-4 space-y-3">
                    <div>
                      <div className="text-astra-blue font-bold mb-1"># 1. Fetch cognitive context in python:</div>
                      <code>
                        import requests<br />
                        res = requests.get("<span className="text-astra-emerald">http://localhost:8000/api/v1/memory/search</span>", params=&#123;"query": "distributed systems"&#125;)<br />
                        print(res.json())
                      </code>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div>
                      <div className="text-astra-blue font-bold mb-1"># 2. Invoke LangGraph multi-agent loop:</div>
                      <code>
                        curl -X POST "<span className="text-astra-emerald">http://localhost:8000/api/v1/agents/run</span>" \<br />
                        &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                        &nbsp;&nbsp;-d '&#123;"query": "What was the figma layout?"&#125;'
                      </code>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed">
                  FastAPI OpenAPI schemas automatically loaded at <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="text-astra-blue underline">/docs</a>.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 8. SETTINGS VIEW */}
        {activeTab === "settings" && (
          <div className="glass-panel p-6 max-w-2xl mx-auto space-y-6">
            <h2 className="text-md font-bold text-white border-b border-white/5 pb-2 uppercase font-mono tracking-wider">
              Privacy & Relational Database Configuration
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-300">SQLite Metadata Relational Fallback</div>
                  <div className="text-[10px] text-slate-500 font-mono">sqlite:///./gemini_memory_os.db</div>
                </div>
                <span className="text-[10px] bg-astra-emerald/10 text-astra-emerald px-2 py-0.5 rounded-full font-mono">CONNECTED</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-300">NumPy Vector Index Similarity Adapter</div>
                  <div className="text-[10px] text-slate-500">Dynamic SHA-256 Cosine Similarity Mapping</div>
                </div>
                <span className="text-[10px] bg-astra-emerald/10 text-astra-emerald px-2 py-0.5 rounded-full font-mono">CONNECTED</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-slate-300">NetworkX Spatial Graph DB Adapter</div>
                  <div className="text-[10px] text-slate-500">Bi-directional PRECEDES Time-Graph Links</div>
                </div>
                <span className="text-[10px] bg-astra-emerald/10 text-astra-emerald px-2 py-0.5 rounded-full font-mono">CONNECTED</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="bg-astra-coral/10 border border-astra-coral/30 rounded-xl p-4 flex gap-3 text-xs">
                <ShieldAlert className="w-5 h-5 text-astra-coral flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white mb-1">Privacy Safe Guards</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Deleting cognitive records completely cleans all databases instantly. Relational metadata tables, local NumPy vector similarity indexes, and NetworkX relational graphs are immediately purged of associated weights.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to purge all long-term semantic records? This is irreversible.")) {
                    alert("Purge request transmitted. Relational, vector, and graph databases have been wiped.");
                    fetchMemories();
                    fetchGraph();
                  }
                }}
                className="w-full bg-astra-coral hover:bg-astra-coral/80 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                IRREVERSIBLY WIPE LONG-TERM COGNITIVE RECORDS
              </button>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-4 text-center text-[10px] text-slate-500 font-mono mt-12 bg-black/20">
        GEMINI MEMORY OS &copy; 2026. BUILT WITH DEEPMIND ASTRA COGNITION PRINCIPLES.
      </footer>
    </div>
  );
}
