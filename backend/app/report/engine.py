import os
import json
import logging
from app.providers.litellm_gateway import generate_response

logger = logging.getLogger(__name__)

class ReportEngine:
    def __init__(self):
        prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "report.md")
        with open(prompt_path, "r") as f:
            self.prompt_template = f.read()

    def generate_final_report(self, discussion_data: dict, api_key: str = None):
        """
        Synthesizes the final verified answer using gemini-2.5-flash.
        Returns Structured JSON.
        """
        formatted_prompt = self.prompt_template.replace("{discussion_data}", json.dumps(discussion_data, indent=2))
        messages = [
            {"role": "system", "content": formatted_prompt},
            {"role": "user", "content": "Generate the final report now in structured JSON format."}
        ]
        
        try:
            raw_response = generate_response("gemini/gemini-2.5-flash", messages, api_key=api_key)
            cleaned = raw_response.strip().strip('`').removeprefix("json\n")
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to generate report: {e}")
            return {
                "final_answer": "Error generating final answer.",
                "consensus": [],
                "disagreements": [],
                "confidence": 0,
                "sources": [],
                "key_contributions": [],
                "warnings": ["Report engine failed"]
            }
