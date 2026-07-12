from fastapi import APIRouter
from pydantic import BaseModel
import litellm
import requests

router = APIRouter()

class ValidateRequest(BaseModel):
    provider: str
    api_key: str

@router.post("/validate")
def validate_provider(req: ValidateRequest):
    provider = req.provider
    key = req.api_key
    
    try:
        if provider == "Google":
            # 1-token ping
            litellm.completion(
                model="gemini/gemini-1.5-flash",
                messages=[{"role": "user", "content": "hi"}],
                api_key=key,
                max_tokens=1
            )
        elif provider == "Groq":
            # Native models list endpoint
            res = requests.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"})
            res.raise_for_status()
        elif provider == "OpenRouter":
            # Native auth key check
            res = requests.get("https://openrouter.ai/api/v1/auth/key", headers={"Authorization": f"Bearer {key}"})
            res.raise_for_status()
        elif provider == "Anthropic":
            # 1-token ping
            litellm.completion(
                model="claude-3-haiku-20240307",
                messages=[{"role": "user", "content": "hi"}],
                api_key=key,
                max_tokens=1
            )
        elif provider == "OpenAI":
            # Native models list
            res = requests.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {key}"})
            res.raise_for_status()
        else:
            return {"valid": False, "provider_name": provider, "error_message": "Unknown provider"}
            
        return {"valid": True, "provider_name": provider}
    except Exception as e:
        return {"valid": False, "provider_name": provider, "error_message": str(e)}
