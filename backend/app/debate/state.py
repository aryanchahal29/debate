from typing import TypedDict, List, Dict, Any, Optional

class DiscussionState(TypedDict):
    discussion_id: str
    workflow_type: str
    parent_report_id: Optional[str]
    report_version: int
    question: str
    selected_models: List[str]
    api_keys: Dict[str, str]
    
    # Cycles will store a list of dicts, where each dict maps model_name to response string
    cycles: List[Dict[str, str]]
    
    discussion_depth: str
    max_cycles: int
    
    # Consensus evaluation
    consensus_score: Optional[int]
    hallucination_score: Optional[int]
    reasoning_score: Optional[int]
    missing_information: List[str]
    
    # Flow control
    continue_discussion: bool
    
    # Metrics
    provider_failures: Dict[str, int]
    execution_time: float
    tokens_used: int
    cost: float
    
    status: str
