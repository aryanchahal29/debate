"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function DiscussionPage() {
  const params = useParams()
  const discussionId = params.id
  
  const [status, setStatus] = useState("Loading...")
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    // Setup WebSocket for realtime updates
    const ws = new WebSocket(`ws://localhost:8000/api/v1/realtime/ws/${discussionId}`)
    
    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
      setStatus("The Council is deliberating...")
    }
    
    return () => {
      ws.close()
    }
  }, [discussionId])

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
