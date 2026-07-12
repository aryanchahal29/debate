import json
import logging
from app.providers.litellm_gateway import generate_response
import os

logger = logging.getLogger(__name__)

class ConsensusEngine:
    def __init__(self):
        prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "consensus.md")
        with open(prompt_path, "r") as f:
            self.prompt_template = f.read()

    def extract_consensus(self, responses: dict, model: str = "gemini/gemini-2.5-flash", api_key: str = None) -> dict:
        """
        Analyzes responses using the requested internal engine to extract Agreements, Disagreements, etc.
        """
        formatted_prompt = self.prompt_template.replace("{responses}", json.dumps(responses, indent=2))
        
        messages = [
            {"role": "system", "content": formatted_prompt},
            {"role": "user", "content": "Extract the consensus now. Return ONLY raw JSON without markdown formatting blocks like ```json."}
        ]
        
        try:
            # We use the internal synthesis model
            raw_response = generate_response(model, messages, api_key=api_key) 
            
            cleaned = raw_response.strip().strip('`').removeprefix("json\n")
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to extract consensus: {e}")
            return {
                "agreements": [],
                "disagreements": [],
                "missing_information": [],
                "confidence": 0,
                "reasoning_score": 0,
                "hallucination_risk": 0,
                "open_questions": [],
                "opinion_changes": []
            }
