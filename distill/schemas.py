from typing import List, Union
from pydantic import BaseModel, Field

class CompressPromptRequest(BaseModel):
    """
    Request model for compress_prompt endpoint.
    Mirrors arguments of Distill.compress_prompt.
    """
    context: Union[List[str], str] = Field(..., description="The prompt context to compress. Can be a string or list of strings.")
    rate: float = Field(0.5, description="Compression rate.")
    target_token: int = Field(-1, description="Target token count. If > 0, overrides rate.")
    use_context_level_filter: bool = False
    use_token_level_filter: bool = True
    target_context: int = -1
    context_level_rate: float = 1.0
    context_level_target_token: int = -1
    force_context_ids: List[int] = Field(default_factory=list)
    return_word_label: bool = False
    word_sep: str = "\t\t|\t\t"
    label_sep: str = " "
    token_to_word: str = "mean"
    force_tokens: List[str] = Field(default_factory=list)
    force_reserve_digit: bool = False
    drop_consecutive: bool = False
    chunk_end_tokens: List[str] = Field(default_factory=lambda: [".", "\n"])
