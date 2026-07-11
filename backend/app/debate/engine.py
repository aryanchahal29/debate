from app.memory.manager import MemoryEngine
from app.providers.litellm_gateway import generate_response

class DebateEngine:
    def __init__(self, memory_engine: MemoryEngine):
        self.memory_engine = memory_engine

    def start_independent_thinking(self, discussion_id, question, models, api_keys):
        """
        Stage 1: Independent Thinking
        Every selected model receives the question independently.
        """
        responses = {}
        for model in models:
            # System prompt ensures independent reasoning
            messages = [
                {"role": "system", "content": "You are an expert AI model in the AI Council. Provide your initial independent answer."},
                {"role": "user", "content": question}
            ]
            response = generate_response(model, messages, api_key=api_keys.get(model))
            responses[model] = response
            # TODO: Save response to DB via memory_engine
        return responses

    def start_collaborative_discussion(self, discussion_id, question, models, api_keys, cycle):
        """
        Stage 2: Collaborative Discussion
        Models review the shared memory and previous responses.
        """
        shared_memory = self.memory_engine.get_shared_memory(discussion_id)
        # TODO: Implement the collaborative loop based on the shared memory and private memory
        pass
