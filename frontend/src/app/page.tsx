"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const AVAILABLE_MODELS = [
  "gpt-4o",
  "claude-3-opus-20240229",
  "gemini-1.5-pro",
  "deepseek-chat",
]

export default function HomePage() {
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [depth, setDepth] = useState("Balanced")

  const toggleModel = (model: string) => {
    setSelectedModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    )
  }

  const handleGenerate = async () => {
    if (selectedModels.length < 2) {
      alert("Please select at least 2 models.")
      return
    }
    if (!question.trim()) {
      alert("Please enter a question.")
      return
    }

    // Call the backend to create a discussion
    const res = await fetch("http://localhost:8000/api/v1/discussions/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        selected_models: selectedModels,
        discussion_depth: depth,
      }),
    })
    
    if (res.ok) {
      const data = await res.json()
      router.push(`/discussion/${data.id}`)
    } else {
      alert("Failed to create discussion")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Council
          </h1>
          <p className="text-gray-400 text-lg">
            One Question. Multiple AI Minds. One Trusted Answer.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Your Question</h2>
          <textarea
            className="w-full h-40 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask your question here... Markdown supported."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Select Models (Min 2)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AVAILABLE_MODELS.map(model => (
              <label key={model} className="flex items-center space-x-2 bg-zinc-900 p-3 rounded-lg border border-zinc-800 cursor-pointer hover:bg-zinc-800 transition">
                <input
                  type="checkbox"
                  className="rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-blue-500"
                  checked={selectedModels.includes(model)}
                  onChange={() => toggleModel(model)}
                />
                <span className="text-sm font-medium">{model}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Discussion Depth</h2>
          <div className="flex space-x-4">
            {["Fast", "Balanced", "Deep"].map(d => (
              <button
                key={d}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${depth === d ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'}`}
                onClick={() => setDepth(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <div className="pt-8 text-center">
          <Button onClick={handleGenerate} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all w-full max-w-md">
            Convene the Council
          </Button>
        </div>
      </div>
    </div>
  )
}
