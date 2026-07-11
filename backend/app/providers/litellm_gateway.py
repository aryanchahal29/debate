import litellm

def generate_response(model: str, messages: list, api_key: str = None, **kwargs) -> str:
    """
    Generates a response from a specified model using liteLLM.
    The model string should follow liteLLM conventions (e.g., 'gpt-4o', 'claude-3-opus-20240229').
    """
    response = litellm.completion(
        model=model,
        messages=messages,
        api_key=api_key,
        **kwargs
    )
    return response.choices[0].message.content
