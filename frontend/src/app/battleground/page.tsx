"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, BrainCircuit, Activity, Database, Key, Settings, Search, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronDown, Plus } from "lucide-react"
import panelsConfig from "@/config/panels.json"

type ValidationStatus = "Connected" | "Not Configured" | "Invalid" | "Validating"

type CustomModelConfig = {
  id: string;
  name: string;
  provider: string;
  apiBase: string;
}

export default function BattlegroundBuilderPage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  
  const [question, setQuestion] = useState("")
  const [selectedPanel, setSelectedPanel] = useState(panelsConfig.panels[0].name)
  const [customSelectedModels, setCustomSelectedModels] = useState<string[]>([])
  const [maxRounds, setMaxRounds] = useState<number>(1)
  const [internalEngine, setInternalEngine] = useState("auto")
  const [searchQuery, setSearchQuery] = useState("")
  const [isHoveringBtn, setIsHoveringBtn] = useState(false)
  
  // Accordion UI State
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)
  
  // Custom user-defined models
  const [userAddedModels, setUserAddedModels] = useState<CustomModelConfig[]>([])
  const [showAddCustomGlobal, setShowAddCustomGlobal] = useState(false)
  const [contextualAddProvider, setContextualAddProvider] = useState<string | null>(null)
  const [newCustomModel, setNewCustomModel] = useState({ provider: "", id: "", name: "", apiBase: "", key: "" })
  
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [keyStatus, setKeyStatus] = useState<Record<string, ValidationStatus>>({})
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem("ai_council_keys")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setApiKeys(parsed)
        Object.keys(parsed).forEach(provider => {
          if (parsed[provider]) validateKey(provider, parsed[provider])
        })
      } catch(e) {}
    }
  }, [])

  const updateApiKey = (provider: string, key: string) => {
    const newKeys = { ...apiKeys, [provider]: key }
    setApiKeys(newKeys)
    localStorage.setItem("ai_council_keys", JSON.stringify(newKeys))
    
    if (key.trim() === "") {
      setKeyStatus(prev => ({ ...prev, [provider]: "Not Configured" }))
    } else {
      if (timeoutRef.current[provider]) clearTimeout(timeoutRef.current[provider])
      setKeyStatus(prev => ({ ...prev, [provider]: "Validating" }))
      timeoutRef.current[provider] = setTimeout(() => {
        validateKey(provider, key)
      }, 800)
    }
  }

  const validateKey = async (provider: string, key: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/providers/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: key })
      })
      const data = await res.json()
      setKeyStatus(prev => ({ ...prev, [provider]: data.valid ? "Connected" : "Invalid" }))
    } catch (e) {
      setKeyStatus(prev => ({ ...prev, [provider]: "Invalid" }))
    }
  }

  const handleAddCustomModel = () => {
    if (!newCustomModel.provider || !newCustomModel.id || !newCustomModel.apiBase || !newCustomModel.key) {
      alert("Please fill all fields to add a custom model.")
      return
    }
    
    const newModel: CustomModelConfig = {
      id: newCustomModel.id,
      name: newCustomModel.name || newCustomModel.id,
      provider: newCustomModel.provider,
      apiBase: newCustomModel.apiBase
    }
    
    setUserAddedModels(prev => [...prev, newModel])
    updateApiKey(newCustomModel.provider, newCustomModel.key)
    setCustomSelectedModels(prev => [...prev, newModel.id]) // auto select it
    
    setNewCustomModel({ provider: "", id: "", name: "", apiBase: "", key: "" })
    setShowAddCustomGlobal(false)
    setContextualAddProvider(null)
  }

  const allAvailableModels = useMemo(() => {
    return [...panelsConfig.availableModels, ...userAddedModels]
  }, [userAddedModels])

  const activeModels = useMemo(() => {
    if (selectedPanel === "Custom Panel (Choose models manually)") {
      return customSelectedModels
    }
    const panel = panelsConfig.panels.find(p => p.name === selectedPanel)
    return panel ? panel.models : []
  }, [selectedPanel, customSelectedModels])

  const groupedModels = useMemo(() => {
    const grouped: Record<string, typeof allAvailableModels> = {}
    
    const allProviders = [...panelsConfig.providers]
    userAddedModels.forEach(m => {
      if (!allProviders.find(p => p.id === m.provider)) {
        allProviders.push({ id: m.provider, label: m.provider, url: "#" })
      }
    })

    allProviders.forEach(p => grouped[p.id] = [])
    allAvailableModels.forEach(m => {
      if (m.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        if (!grouped[m.provider]) grouped[m.provider] = []
        grouped[m.provider].push(m)
      }
    })
    return { grouped, allProviders }
  }, [searchQuery, allAvailableModels, userAddedModels])

  // Auto-expand on search
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      const match = groupedModels.allProviders.find(p => {
        const models = groupedModels.grouped[p.id] || []
        return models.length > 0
      })
      if (match) setExpandedProvider(match.id)
    }
  }, [searchQuery, groupedModels])

  const activeProviders = useMemo(() => {
    const providers = new Set<string>()
    activeModels.forEach(modelId => {
      const modelDef = allAvailableModels.find(m => m.id === modelId)
      if (modelDef) providers.add(modelDef.provider)
    })
    return groupedModels.allProviders.filter(p => providers.has(p.id))
  }, [activeModels, allAvailableModels, groupedModels.allProviders])

  const toggleCustomModel = (modelId: string) => {
    setCustomSelectedModels(prev => 
      prev.includes(modelId) ? prev.filter(m => m !== modelId) : [...prev, modelId]
    )
  }

  const handleGenerate = async () => {
    if (activeModels.length < 2) {
      alert("Please select at least 2 models for the battleground.")
      return
    }
    if (!question.trim()) {
      alert("Please enter a question.")
      return
    }
    
    for (const modelId of activeModels) {
      const modelDef = allAvailableModels.find(m => m.id === modelId)
      if (modelDef) {
        const providerStatus = keyStatus[modelDef.provider]
        if (providerStatus !== "Connected") {
           alert(`Action Blocked: Please add a valid API key for ${modelDef.provider} to use the ${modelDef.name} model.`)
           return
        }
      }
    }

    const customApiBases: Record<string, string> = {}
    const customModelProviders: Record<string, string> = {}
    userAddedModels.forEach(m => {
      customApiBases[m.id] = m.apiBase
      customModelProviders[m.id] = m.provider
    })

    const payload = {
      question,
      models: activeModels,
      api_keys: apiKeys,
      max_rounds: maxRounds,
      internal_engine: internalEngine,
      custom_api_bases: customApiBases,
      custom_model_providers: customModelProviders
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/discussions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    
    if (res.ok) {
      const data = await res.json()
      router.push(`/discussion/${data.discussion_id}`)
    } else {
      alert("Failed to enter the battleground.")
    }
  }

  const renderAddCustomForm = (lockedProvider: string | null = null) => (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3 shadow-inner mt-2">
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-700">Connect Custom Model</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase">Provider Label</label>
          <input 
            type="text" placeholder="e.g. Ollama"
            disabled={lockedProvider !== null}
            className={`w-full bg-white border border-zinc-200 rounded p-2 text-xs focus:border-purple-500 focus:outline-none ${lockedProvider ? 'text-zinc-400 bg-zinc-100 cursor-not-allowed' : ''}`}
            value={newCustomModel.provider} onChange={(e) => setNewCustomModel({...newCustomModel, provider: e.target.value})}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase">Display Name</label>
          <input 
            type="text" placeholder="e.g. Llama-3-70B"
            className="w-full bg-white border border-zinc-200 rounded p-2 text-xs focus:border-purple-500 focus:outline-none"
            value={newCustomModel.name} onChange={(e) => setNewCustomModel({...newCustomModel, name: e.target.value})}
          />
        </div>
      </div>
      
      <div>
        <label className="text-[10px] font-bold text-zinc-500 uppercase">Model ID</label>
        <input 
          type="text" placeholder="e.g. openai/llama3"
          className="w-full bg-white border border-zinc-200 rounded p-2 text-xs focus:border-purple-500 focus:outline-none"
          value={newCustomModel.id} onChange={(e) => setNewCustomModel({...newCustomModel, id: e.target.value})}
        />
      </div>
      
      <div>
        <label className="text-[10px] font-bold text-zinc-500 uppercase">API Base URL</label>
        <input 
          type="text" placeholder="e.g. http://localhost:11434/v1"
          className="w-full bg-white border border-zinc-200 rounded p-2 text-xs focus:border-purple-500 focus:outline-none font-mono"
          value={newCustomModel.apiBase} onChange={(e) => setNewCustomModel({...newCustomModel, apiBase: e.target.value})}
        />
      </div>
      
      <div>
        <label className="text-[10px] font-bold text-zinc-500 uppercase">API Key</label>
        <input 
          type="password" placeholder="sk-..."
          className="w-full bg-white border border-zinc-200 rounded p-2 text-xs focus:border-purple-500 focus:outline-none font-mono"
          value={newCustomModel.key} onChange={(e) => setNewCustomModel({...newCustomModel, key: e.target.value})}
        />
      </div>
      
      <div className="flex space-x-2 pt-2">
        <button 
          onClick={() => {
            setShowAddCustomGlobal(false)
            setContextualAddProvider(null)
          }}
          className="flex-1 p-2 bg-zinc-200 hover:bg-zinc-300 rounded text-xs font-bold text-zinc-700 transition"
        >Cancel</button>
        <button 
          onClick={handleAddCustomModel}
          className="flex-1 p-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-bold text-white transition shadow-sm"
        >Add Model</button>
      </div>
    </div>
  )

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F5F2EA] text-zinc-900 selection:bg-purple-200 font-sans pb-32">
      
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-300/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-pink-300/30 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-6xl mx-auto px-6 pt-12 relative z-10 flex flex-col lg:flex-row gap-12">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">
              Configure the Battleground
            </h1>
            <p className="text-sm text-zinc-500 font-medium">
              Draft your prompt and assemble the AI minds for battle.
            </p>
          </header>

          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
              <div className="relative bg-white border border-zinc-200 rounded-2xl p-2 shadow-xl shadow-zinc-200/50">
                <textarea
                  className="w-full h-[400px] bg-transparent p-4 text-lg text-zinc-900 placeholder-zinc-400 focus:outline-none resize-none"
                  placeholder="Pose a complex query, a controversial topic, or an advanced coding problem..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>
            </div>
          </motion.section>

          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onMouseEnter={() => setIsHoveringBtn(true)}
            onMouseLeave={() => setIsHoveringBtn(false)}
            onClick={handleGenerate} 
            className="relative w-full overflow-hidden rounded-2xl group shadow-2xl shadow-purple-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500"></div>
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] ${isHoveringBtn ? 'animate-[shimmer_1.5s_infinite]' : ''}`} />
            <div className="relative flex items-center justify-center space-x-3 px-8 py-6 text-xl font-black text-white tracking-wide">
              <span>Enter the Battleground</span>
              <Sparkles className="w-5 h-5 opacity-90" />
            </div>
          </motion.button>
        </div>

        {/* RIGHT COLUMN */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[420px] space-y-6"
        >
          {/* Estimates Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex justify-between items-center shadow-xl shadow-zinc-200/50">
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Minds</p>
              <p className="text-3xl font-black text-zinc-900">{activeModels.length}</p>
            </div>
            <div className="w-[1px] h-12 bg-zinc-200"></div>
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Time</p>
              <p className="text-3xl font-black text-zinc-900">~{activeModels.length * maxRounds * 8}s</p>
            </div>
            <div className="w-[1px] h-12 bg-zinc-200"></div>
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Cost</p>
              <p className="text-3xl font-black text-green-600">~${(activeModels.length * maxRounds * 0.005).toFixed(3)}</p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-8 shadow-xl shadow-zinc-200/50">
            
            {/* Panel Selector */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-zinc-700">
                <BrainCircuit className="w-4 h-4" />
                <h2 className="text-xs font-black uppercase tracking-widest">Panel Composition</h2>
              </div>
              <div className="relative">
                <select 
                  className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl p-3 pl-4 pr-10 text-zinc-900 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition cursor-pointer shadow-sm"
                  value={selectedPanel}
                  onChange={(e) => setSelectedPanel(e.target.value)}
                >
                  {panelsConfig.panels.map(p => (
                    <option key={p.name} value={p.name} className="bg-white">{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-4 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </section>

            {/* Custom Panel Accordion UI */}
            <AnimatePresence>
              {selectedPanel === "Custom Panel (Choose models manually)" && (
                <motion.section 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="Search across all providers..." 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-900 font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition shadow-inner"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {groupedModels.allProviders.map(provider => {
                      const models = groupedModels.grouped[provider.id]
                      if (!models || models.length === 0) return null
                      
                      const isConnected = keyStatus[provider.id] === "Connected"
                      const selectedCount = models.filter(m => customSelectedModels.includes(m.id)).length
                      const isExpanded = expandedProvider === provider.id
                      
                      return (
                        <div key={provider.id} className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          {/* Accordion Header */}
                          <div 
                            className="flex justify-between items-center p-3 cursor-pointer hover:bg-zinc-50 transition"
                            onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black uppercase tracking-widest text-zinc-700">{provider.label}</span>
                              {!isConnected && <span className="text-[9px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Key Missing</span>}
                            </div>
                            <div className="flex items-center space-x-3">
                              {selectedCount > 0 && <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{selectedCount} selected</span>}
                              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </div>
                          
                          {/* Accordion Body */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-zinc-100 bg-zinc-50 p-2 space-y-1"
                              >
                                {models.map(model => (
                                  <label key={model.id} className="flex items-center space-x-3 p-2.5 rounded-lg border border-zinc-200 cursor-pointer hover:bg-white hover:border-purple-300 bg-white transition">
                                    <input
                                      type="checkbox"
                                      checked={customSelectedModels.includes(model.id)}
                                      onChange={() => toggleCustomModel(model.id)}
                                      className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-white w-4 h-4"
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-zinc-700">{model.name}</span>
                                    </div>
                                  </label>
                                ))}
                                
                                {/* Contextual Connect Model */}
                                {contextualAddProvider !== provider.id ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setNewCustomModel({...newCustomModel, provider: provider.id})
                                      setContextualAddProvider(provider.id)
                                    }}
                                    className="w-full mt-2 flex items-center justify-center space-x-2 p-2 bg-zinc-100 hover:bg-zinc-200 border border-transparent rounded text-xs font-bold text-zinc-500 transition"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add custom model</span>
                                  </button>
                                ) : renderAddCustomForm(provider.id)}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>

                  {/* Global Add Custom Model */}
                  {!showAddCustomGlobal ? (
                    <button 
                      onClick={() => setShowAddCustomGlobal(true)}
                      className="w-full flex items-center justify-center space-x-2 p-3 bg-white hover:bg-zinc-50 border border-dashed border-zinc-300 rounded-lg text-xs font-bold text-zinc-500 transition shadow-sm mt-4"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Provider not listed? Connect completely new provider.</span>
                    </button>
                  ) : renderAddCustomForm()}

                </motion.section>
              )}
            </AnimatePresence>

            {/* Rounds Selector */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-zinc-700">
                <Activity className="w-4 h-4" />
                <h2 className="text-xs font-black uppercase tracking-widest">Debate Depth</h2>
              </div>
              <div className="flex rounded-xl p-1 bg-zinc-50 border border-zinc-200 shadow-inner">
                {[1, 2, 3].map(round => (
                  <button
                    key={round}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${maxRounds === round ? 'bg-white text-purple-700 shadow border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'}`}
                    onClick={() => setMaxRounds(round)}
                  >
                    {round} {round === 1 ? 'Round' : 'Rounds'}
                  </button>
                ))}
              </div>
            </section>

            {/* API Keys - Dynamic based on active models */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-zinc-700">
                <Key className="w-4 h-4" />
                <h2 className="text-xs font-black uppercase tracking-widest">Provider Keys</h2>
              </div>
              <div className="space-y-3">
                {activeProviders.length === 0 ? (
                  <div className="text-xs text-zinc-400 italic py-2">Select models above to configure their API keys.</div>
                ) : (
                  activeProviders.map(provider => {
                    const status = keyStatus[provider.id] || "Not Configured"
                    return (
                      <div key={provider.id} className="relative group/key">
                        <div className="absolute -inset-1 bg-zinc-50 rounded-xl opacity-0 group-hover/key:opacity-100 transition"></div>
                        <div className="relative flex flex-col space-y-1.5 p-1">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">{provider.label}</label>
                            <a href={provider.url || "#"} target="_blank" rel="noreferrer" className="text-[10px] text-purple-600 hover:text-purple-700 uppercase tracking-widest font-black">Get Key ↗</a>
                          </div>
                          <div className="relative">
                            <input
                              type="password"
                              placeholder="sk-..."
                              className={`w-full bg-white shadow-sm border rounded-lg p-2.5 pr-24 text-zinc-900 font-mono text-sm focus:outline-none transition ${status === 'Invalid' ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : status === 'Connected' ? 'border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-500' : 'border-zinc-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'}`}
                              value={apiKeys[provider.id] || ""}
                              onChange={(e) => updateApiKey(provider.id, e.target.value)}
                            />
                            <div className="absolute right-2 top-2.5 flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest bg-zinc-50 border border-zinc-200">
                              {status === "Connected" && <><CheckCircle2 className="w-3 h-3 text-green-600"/><span className="text-green-700">Valid</span></>}
                              {status === "Invalid" && <><XCircle className="w-3 h-3 text-red-600"/><span className="text-red-700">Invalid</span></>}
                              {status === "Not Configured" && <><AlertCircle className="w-3 h-3 text-zinc-400"/><span className="text-zinc-500">Missing</span></>}
                              {status === "Validating" && <><Loader2 className="w-3 h-3 text-purple-500 animate-spin"/><span className="text-purple-600">Checking</span></>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            {/* Advanced Settings */}
            <section className="space-y-3 pt-6 border-t border-zinc-100">
              <div className="flex items-center space-x-2 text-zinc-500">
                <Settings className="w-4 h-4" />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Internal Engine</h2>
              </div>
              <div className="relative">
                <select 
                  className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg p-2.5 pl-3 pr-8 text-xs text-zinc-700 font-bold appearance-none focus:outline-none focus:ring-1 focus:ring-purple-500 transition cursor-pointer"
                  value={internalEngine}
                  onChange={(e) => setInternalEngine(e.target.value)}
                >
                  {panelsConfig.internalEngines.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </section>

          </div>
        </motion.div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  )
}
