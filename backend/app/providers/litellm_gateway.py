import litellm
import logging

logger = logging.getLogger(__name__)

def generate_response(model: str, messages: list, api_key: str = None, retries: int = 1, fallback_model: str = None, **kwargs) -> str:
    """
    Generates a response from a specified model using liteLLM with retry and fallback logic.
    """
    for attempt in range(retries + 1):
        try:
            response = litellm.completion(
                model=model,
                messages=messages,
                api_key=api_key,
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"Provider failed for model {model}, attempt {attempt+1}: {str(e)}")
            if attempt == retries:
                break
    
    if fallback_model:
        logger.info(f"Using fallback model {fallback_model} instead of {model}")
        try:
            response = litellm.completion(
                model=fallback_model,
                messages=messages,
                api_key=api_key,
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Fallback model {fallback_model} also failed: {str(e)}")
            
    raise RuntimeError(f"Failed to generate response for {model}")
