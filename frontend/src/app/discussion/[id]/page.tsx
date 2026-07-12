"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { BrainCircuit, MessageSquare, Layers, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Activity, Terminal, ChevronDown, ChevronUp, History, Send } from "lucide-react"

type ProgressState = "Loading" | "Thinking..." | "Building Consensus..." | "Discussing..." | "Continuing Discussion..." | "Challenging Answer..." | "Verifying..." | "Preparing Final Answer..." | "Completed"

export default function DiscussionPage() {
  const params = useParams()
  const discussionId = params.id
  
  const [status, setStatus] = useState<ProgressState>("Loading")
  const [messages, setMessages] = useState<string[]>([])
  const [report, setReport] = useState<any>(null)
  
  // UI States
  const [showRawJson, setShowRawJson] = useState(false)
  const [followUpMode, setFollowUpMode] = useState<'none'|'continue'|'challenge'>('none')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/api/v1/realtime/ws/${discussionId}`)
    
    ws.onmessage = (event) => {
      const msg = event.data
      setMessages(prev => [...prev, msg])
      setStatus(msg as ProgressState)
      
      if (msg === "Completed") {
        fetchReport()
      }
    }
    
    return () => ws.close()
  }, [discussionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchReport = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/discussions/${discussionId}/report`)
      if (res.ok) {
        const data = await res.json()
        setReport(data.report_json)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleFollowUp = async () => {
    if (followUpMode === 'none') return
    const stored = localStorage.getItem("ai_council_keys")
    const apiKeys = stored ? JSON.parse(stored) : {}
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/discussions/${discussionId}/${followUpMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_keys: apiKeys })
      })
      if (res.ok) {
        setReport(null)
        setMessages([])
        setStatus(followUpMode === 'continue' ? 'Continuing Discussion...' : 'Challenging Answer...')
        setFollowUpMode('none')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusIcon = (s: string) => {
    if (s.includes("Thinking")) return <BrainCircuit className="w-8 h-8 text-purple-500" />
    if (s.includes("Consensus")) return <Layers className="w-8 h-8 text-pink-500" />
    if (s.includes("Discuss") || s.includes("Challenging")) return <MessageSquare className="w-8 h-8 text-indigo-500" />
    if (s.includes("Verifying")) return <ShieldCheck className="w-8 h-8 text-green-500" />
    if (s.includes("Final Answer")) return <FileText className="w-8 h-8 text-yellow-600" />
    return <Activity className="w-8 h-8 text-zinc-400" />
  }

  if (report) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] text-zinc-900 p-6 md:p-12 font-sans selection:bg-purple-200">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <header className="flex justify-between items-end border-b border-zinc-200 pb-6">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-black text-green-600 uppercase tracking-widest mb-2 bg-green-50 px-3 py-1 rounded-full border border-green-200 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Battleground Verdict Reached</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-zinc-900">
                Final Report
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-zinc-500 text-sm font-bold bg-white px-3 py-1 rounded-lg border border-zinc-200 shadow-sm">
              <History className="w-4 h-4" />
              <span>Version: Latest</span>
            </div>
          </header>

          {/* Hero Verdict Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white border border-zinc-200 rounded-3xl p-8 md:p-12 shadow-2xl shadow-zinc-200/50 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="flex flex-col items-end">
                <span className="text-xs text-zinc-400 uppercase font-black tracking-widest mb-1">Confidence</span>
                <span className={`text-5xl font-black ${report.confidence > 80 ? 'text-green-500' : report.confidence > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {report.confidence}%
                </span>
              </div>
            </div>
            
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Unified Answer</h2>
            <div className="prose prose-lg max-w-none text-zinc-700 leading-relaxed font-medium">
              {report.final_answer.split('\n').map((line:string, i:number) => (
                <p key={i} className="mb-4">{line}</p>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-xl shadow-zinc-200/50"
            >
              <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-6 flex items-center"><Layers className="w-4 h-4 mr-2"/> Consensus Formed</h2>
              <ul className="space-y-4 text-zinc-600 font-medium">
                {report.consensus?.map((c: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
                {(!report.consensus || report.consensus.length === 0) && <p className="text-zinc-400 italic">No strong consensus reached.</p>}
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-xl shadow-zinc-200/50"
            >
              <h2 className="text-sm font-black text-red-500 uppercase tracking-widest mb-6 flex items-center"><AlertTriangle className="w-4 h-4 mr-2"/> Remaining Disagreements</h2>
              <ul className="space-y-4 text-zinc-600 font-medium">
                {report.disagreements?.map((d: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1 font-bold">•</span>
                    <span>{d}</span>
                  </li>
                ))}
                {(!report.disagreements || report.disagreements.length === 0) && <p className="text-zinc-400 italic">No remaining disagreements!</p>}
              </ul>
            </motion.div>
          </div>

          {/* Missing Info & Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {report.missing_information && report.missing_information.length > 0 && (
               <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                 <h3 className="text-xs font-black text-yellow-600 uppercase tracking-widest mb-3">Missing Information</h3>
                 <ul className="list-disc pl-4 text-sm text-yellow-800 font-medium space-y-1">
                   {report.missing_information.map((info:string, i:number) => <li key={i}>{info}</li>)}
                 </ul>
               </div>
             )}
             {report.warnings && report.warnings.length > 0 && (
               <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
                 <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">Verification Warnings</h3>
                 <ul className="list-disc pl-4 text-sm text-red-800 font-medium space-y-1">
                   {report.warnings.map((w:string, i:number) => <li key={i}>{w}</li>)}
                 </ul>
               </div>
             )}
          </div>

          {/* Follow up Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none z-50">
            <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-2xl p-2 flex space-x-2 pointer-events-auto shadow-2xl shadow-zinc-300/50">
              {followUpMode === 'none' ? (
                <>
                  <button onClick={() => setFollowUpMode('continue')} className="flex-1 py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-700 transition text-sm flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 mr-2" /> Discuss Further
                  </button>
                  <button onClick={() => setFollowUpMode('challenge')} className="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-bold transition text-sm flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Challenge Answer
                  </button>
                </>
              ) : (
                <div className="flex-1 flex flex-col p-2 space-y-3">
                  <p className="text-xs font-black text-zinc-500 uppercase text-center tracking-wide">
                    {followUpMode === 'continue' ? 'Models will debate remaining disagreements' : 'Models will be challenged on their conclusion'}
                  </p>
                  <div className="flex space-x-2">
                    <button onClick={() => setFollowUpMode('none')} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-bold text-zinc-600">Cancel</button>
                    <button onClick={handleFollowUp} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-lg text-sm font-black shadow-lg flex items-center justify-center transition">
                      <Send className="w-4 h-4 mr-2" /> Execute Follow-up
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raw AI Discussion Dropdown */}
          <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white mb-32 shadow-xl shadow-zinc-200/50">
            <button 
              onClick={() => setShowRawJson(!showRawJson)} 
              className="w-full flex items-center justify-between p-6 bg-zinc-50 hover:bg-zinc-100 transition"
            >
              <div className="flex items-center space-x-3">
                <Terminal className="w-5 h-5 text-zinc-400" />
                <span className="font-black text-zinc-600 uppercase tracking-widest text-xs">View Raw Battleground Log</span>
              </div>
              {showRawJson ? <ChevronUp className="text-zinc-400" /> : <ChevronDown className="text-zinc-400" />}
            </button>
            <AnimatePresence>
              {showRawJson && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 bg-zinc-900 border-t border-zinc-200 overflow-x-auto max-h-[600px] custom-scrollbar">
                    <pre className="text-xs text-green-400 font-mono leading-relaxed">
                      {JSON.stringify(report, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Orbs */}
      <div className="absolute w-[800px] h-[800px] bg-purple-300/30 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute w-[600px] h-[600px] bg-pink-300/30 rounded-full blur-[100px] animate-[pulse_3s_ease-in-out_infinite]" />

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center">
        
        {/* Dynamic Glowing Orb / State Icon */}
        <motion.div 
          key={status}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative flex items-center justify-center w-32 h-32 mb-12"
        >
          <div className="absolute inset-0 bg-white rounded-full blur-2xl animate-spin-slow shadow-2xl shadow-purple-200"></div>
          <div className="absolute inset-4 bg-white rounded-full border border-zinc-100 shadow-inner z-0"></div>
          <div className="relative z-10 animate-bounce-slow">
            {getStatusIcon(status)}
          </div>
        </motion.div>

        {/* Current State Text */}
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2 text-center">
          {status}
        </h2>
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest text-center mb-12">
          Please wait while the battleground deliberation continues
        </p>
        
        {/* Real-time Semantic Log Window */}
        <div className="w-full bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-2xl p-6 shadow-2xl shadow-zinc-200/50">
          <div className="flex items-center space-x-2 mb-4 border-b border-zinc-100 pb-4">
            <Activity className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Execution Log</h3>
          </div>
          
          <div className="h-48 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {messages.length === 0 ? (
              <p className="text-zinc-400 text-sm italic font-medium">Establishing neural link with providers...</p>
            ) : (
              messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="flex items-center space-x-3 text-sm"
                >
                  <span className="text-purple-500 font-bold">❯</span>
                  <span className={i === messages.length - 1 ? 'text-zinc-900 font-bold' : 'text-zinc-500 font-medium'}>{msg}</span>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

      </div>

      {/* Global styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .animate-bounce-slow { animation: bounce 3s ease-in-out infinite; }
      `}} />
    </div>
  )
}
