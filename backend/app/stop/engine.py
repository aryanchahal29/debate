class StopEngine:
    def decide(self, agreement: int, reasoning_quality: int, hallucination: int, missing_info_count: int, current_cycle: int, max_cycles: int) -> str:
        """
        Decides whether the debate should Stop, Continue, or Needs User Input.
        """
        if current_cycle >= max_cycles:
            return "Stop"
            
        if agreement > 90 and reasoning_quality > 85 and hallucination < 15 and missing_info_count == 0:
            return "Stop"
            
        if hallucination > 80 or missing_info_count >= 3:
            return "Need User Input"
            
        return "Continue"
