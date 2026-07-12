"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, BrainCircuit, Activity, Database, ArrowRight } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [isHoveringBtn, setIsHoveringBtn] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F2EA] text-zinc-900 selection:bg-purple-200 font-sans flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Abstract Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-300/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-pink-300/30 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center text-center space-y-12">
        
        <header className="space-y-8 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white border border-zinc-200 text-xs font-bold text-purple-600 uppercase tracking-widest shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Agentic Reasoning Engine</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1] text-zinc-900"
          >
            The AI <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              YouVo Battleground.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-zinc-600 font-medium max-w-2xl leading-relaxed"
          >
            Ask Better. Know Better.
          </motion.p>
        </header>

        {/* Workflow Preview Hint */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm font-bold text-zinc-500 w-full max-w-3xl bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50"
        >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100">
                <BrainCircuit className="w-6 h-6"/>
              </div>
              <span className="uppercase tracking-widest text-[10px]">Independent Thinking</span>
            </div>
            
            <div className="hidden md:block w-16 h-[2px] bg-zinc-200 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-300"></div>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 border border-pink-100">
                <Activity className="w-6 h-6"/>
              </div>
              <span className="uppercase tracking-widest text-[10px]">Debate & Consensus</span>
            </div>
            
            <div className="hidden md:block w-16 h-[2px] bg-zinc-200 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-300"></div>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Database className="w-6 h-6"/>
              </div>
              <span className="uppercase tracking-widest text-[10px]">Fact Verification</span>
            </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button 
            onMouseEnter={() => setIsHoveringBtn(true)}
            onMouseLeave={() => setIsHoveringBtn(false)}
            onClick={() => router.push('/battleground')} 
            className="relative overflow-hidden rounded-full group shadow-2xl shadow-purple-500/30 transition-transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500"></div>
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] ${isHoveringBtn ? 'animate-[shimmer_1.5s_infinite]' : ''}`} />
            <div className="relative flex items-center justify-center space-x-3 px-10 py-5 text-lg md:text-xl font-black text-white tracking-wide">
              <span>Start a Debate</span>
              <ArrowRight className="w-6 h-6 opacity-90 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </motion.div>

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}
