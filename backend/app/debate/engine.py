from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from app.debate.state import DiscussionState
from app.memory.manager import MemoryEngine
from app.providers.litellm_gateway import generate_response
from app.consensus.engine import ConsensusEngine
from app.stop.engine import StopEngine
from app.verification.engine import VerificationEngine
from app.report.engine import ReportEngine
import os
import json
import logging

logger = logging.getLogger(__name__)

def broadcast_ws(discussion_id, message):
    # In a full implementation, this uses Redis PubSub to trigger the FastAPI WebSocket
    logger.info(f"WS Broadcast [{discussion_id}]: {message}")

class DebateEngine:
    def __init__(self, memory_engine: MemoryEngine):
        self.memory_engine = memory_engine
        self.consensus_engine = ConsensusEngine()
        self.stop_engine = StopEngine()
        self.verification_engine = VerificationEngine()
        self.report_engine = ReportEngine()

    def load_prompt(self, name):
        prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", f"{name}.md")
        with open(prompt_path, "r") as f:
            return f.read()

    def independent_thinking(self, state: DiscussionState):
        broadcast_ws(state["discussion_id"], "Thinking...")
        
        prompt_tmpl = self.load_prompt("independent")
        prompt = prompt_tmpl.replace("{question}", state["question"])
        
        cycle_responses = {}
        for model in state["selected_models"]:
            messages = [{"role": "system", "content": prompt}]
            api_key = state["api_keys"].get(model)
            response = generate_response(model, messages, api_key=api_key)
            cycle_responses[model] = response
            
        state["cycles"].append(cycle_responses)
        return state

    def generate_consensus(self, state: DiscussionState):
        broadcast_ws(state["discussion_id"], "Building Consensus...")
        latest_responses = state["cycles"][-1]
        
        gemini_key = state["api_keys"].get("gemini-2.5-flash")
        
        consensus_data = self.consensus_engine.extract_consensus(latest_responses, api_key=gemini_key)
        
        state["consensus_score"] = consensus_data.get("confidence", 0)
        state["reasoning_score"] = consensus_data.get("reasoning_score", 0)
        state["hallucination_score"] = consensus_data.get("hallucination_risk", 0)
        state["missing_information"] = consensus_data.get("missing_information", [])
        
        return state

    def verify_claims(self, state: DiscussionState):
        broadcast_ws(state["discussion_id"], "Verifying...")
        
        consensus_data = {
            "confidence": state.get("consensus_score", 0)
        }
        
        gemini_key = state["api_keys"].get("gemini-2.5-flash")
        res = self.verification_engine.verify_claims(consensus_data, api_key=gemini_key)
        
        if not res["passed"]:
            state["hallucination_score"] = max(state.get("hallucination_score", 0), 85)
            
        return state

    def stop_decision(self, state: DiscussionState):
        decision = self.stop_engine.decide(
            agreement=state.get("consensus_score", 0),
            reasoning_quality=state.get("reasoning_score", 0),
            hallucination=state.get("hallucination_score", 0),
            missing_info_count=len(state.get("missing_information", [])),
            current_cycle=len(state["cycles"]),
            max_cycles=state["max_cycles"]
        )
        
        if decision == "Stop":
            return "report"
        elif decision == "Need User Input":
            state["status"] = "Needs User Input"
            return "end"
        else:
            return "discuss"

    def collaborative_discussion(self, state: DiscussionState):
        broadcast_ws(state["discussion_id"], "Discussing...")
        prompt_tmpl = self.load_prompt("discussion")
        
        consensus_block = f"Missing Info: {state.get('missing_information', [])}"
        prompt = prompt_tmpl.replace("{question}", state["question"]).replace("{consensus}", consensus_block)
        
        cycle_responses = {}
        for model in state["selected_models"]:
            previous = json.dumps(state["cycles"][-1], indent=2)
            messages = [{"role": "system", "content": prompt.replace("{previous_responses}", previous)}]
            api_key = state["api_keys"].get(model)
            response = generate_response(model, messages, api_key=api_key)
            cycle_responses[model] = response
            
        state["cycles"].append(cycle_responses)
        return state

    def generate_report(self, state: DiscussionState):
        broadcast_ws(state["discussion_id"], "Preparing Final Answer...")
        
        discussion_data = {
            "question": state["question"],
            "cycles": state["cycles"]
        }
        
        gemini_key = state["api_keys"].get("gemini-2.5-flash")
        report_json = self.report_engine.generate_final_report(discussion_data, api_key=gemini_key)
        
        state["status"] = "Completed"
        return state

    def build_graph(self):
        workflow = StateGraph(DiscussionState)
        
        workflow.add_node("independent", self.independent_thinking)
        workflow.add_node("consensus_1", self.generate_consensus)
        workflow.add_node("discuss", self.collaborative_discussion)
        workflow.add_node("consensus_2", self.generate_consensus)
        workflow.add_node("verify", self.verify_claims)
        workflow.add_node("report", self.generate_report)
        
        workflow.set_entry_point("independent")
        workflow.add_edge("independent", "consensus_1")
        workflow.add_edge("consensus_1", "discuss")
        workflow.add_edge("discuss", "consensus_2")
        workflow.add_edge("consensus_2", "verify")
        
        workflow.add_conditional_edges(
            "verify",
            self.stop_decision,
            {
                "report": "report",
                "discuss": "discuss",
                "end": END
            }
        )
        
        workflow.add_edge("report", END)
        return workflow.compile()
