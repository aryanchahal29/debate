import os
import logging
from app.providers.litellm_gateway import generate_response

logger = logging.getLogger(__name__)

class VerificationEngine:
    def __init__(self):
        prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "verification.md")
        with open(prompt_path, "r") as f:
            self.prompt_template = f.read()

    def verify_claims(self, consensus_data: dict, model: str = "gemini/gemini-2.5-flash", api_key: str = None) -> dict:
        """
        Detects hallucinations, logical conflicts, and unsupported claims using the selected internal engine.
        """
        formatted_prompt = self.prompt_template.replace("{consensus}", str(consensus_data))
        messages = [
            {"role": "system", "content": formatted_prompt},
            {"role": "user", "content": "Verify the claims and return any detected issues."}
        ]
        
        try:
            issues = generate_response(model, messages, api_key=api_key)
            return {"passed": True if "no critical conflicts" in issues.lower() else False, "issues": issues}
        except Exception as e:
            logger.error(f"Failed to verify claims: {e}")
            return {"passed": False, "issues": str(e)}
