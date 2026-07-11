"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function DiscussionPage() {
  const params = useParams()
  const discussionId = params.id
  
  const [status, setStatus] = useState("Loading...")
  const [messages, setMessages] = useState<string[]>([])
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    // Setup WebSocket for realtime updates
    const ws = new WebSocket(`ws://localhost:8000/api/v1/realtime/ws/${discussionId}`)
    
    ws.onmessage = (event) => {
      const msg = event.data
      setMessages(prev => [...prev, msg])
      setStatus(msg)
      
      if (msg === "Completed") {
        fetchReport()
      }
    }
    
    return () => {
      ws.close()
    }
  }, [discussionId])

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

  if (report) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Final Verdict
          </h1>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Answer</h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {report.final_answer}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-green-400">Consensus</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                {report.consensus?.map((c: string, i: number) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-red-400">Disagreements</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                {report.disagreements?.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-between items-center shadow-xl">
            <div>
              <h3 className="text-lg font-medium text-gray-400">Confidence Score</h3>
              <p className="text-4xl font-bold text-blue-400">{report.confidence}%</p>
            </div>
            <div className="space-x-4">
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition">Discuss Further</button>
              <button className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition">Challenge Answer</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Discussion Council
        </h1>
        
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
            <p className="text-xl font-medium text-gray-200">{status}</p>
          </div>
          
          <div className="space-y-2 mt-4 bg-black p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {messages.length === 0 ? (
              <p className="text-gray-500">Waiting for models to begin independent thinking...</p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="text-gray-300">{msg}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
