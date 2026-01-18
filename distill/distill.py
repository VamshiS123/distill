import tiktoken
from loguru import logger
from typing import List

from .loading import load_model_and_tokenizer, init_distill_config
from .compression import compress_prompt_pipeline
from .recovery import recover_response
from .text_ops import get_token_length

class Distill:
    def __init__(
            self,
            model_name: str = "./models",
            device_map: str = "mps",
            model_config: dict = {},
            distill_config: dict = {},
    ):
        logger.info(f"Initializing Distill with model_name={model_name}, device_map={device_map}")
        self.model_name = model_name
        self.oai_tokenizer = tiktoken.encoding_for_model("gpt-4o-mini")

        self.model, self.tokenizer, self.device, self.max_position_embeddings = load_model_and_tokenizer(
            model_name, device_map, model_config
        )
        
        # Init distill config and get attributes
        max_batch_size = distill_config.get("max_batch_size", 50)
        max_force_token = distill_config.get("max_force_token", 100)
        
        self.max_batch_size = max_batch_size
        self.max_force_token = max_force_token
        
        self.max_seq_len, self.special_tokens, self.added_tokens = init_distill_config(
            self.model, self.tokenizer, max_batch_size, max_force_token
        )

    def __call__(self, *args, **kwargs):
        return self.compress_prompt(*args, **kwargs)

    def compress_prompt(
            self,
            context: List[str],
            rate: float = 0.5,
            target_token: int = -1,
            use_context_level_filter: bool = False,
            use_token_level_filter: bool = True,
            target_context: int = -1,
            context_level_rate: float = 1.0,
            context_level_target_token: int = -1,
            force_context_ids: List[int] = [],
            return_word_label: bool = False,
            word_sep: str = "\t\t|\t\t",
            label_sep: str = " ",
            token_to_word: str = "mean",
            force_tokens: List[str] = [],
            force_reserve_digit: bool = False,
            drop_consecutive: bool = False,
            chunk_end_tokens: List[str] = [".", "\n"],
    ):
        return compress_prompt_pipeline(
            context=context,
            model=self.model,
            tokenizer=self.tokenizer,
            device=self.device,
            oai_tokenizer=self.oai_tokenizer,
            max_seq_len=self.max_seq_len,
            max_batch_size=self.max_batch_size,
            max_force_token=self.max_force_token,
            special_tokens=self.special_tokens,
            added_tokens=self.added_tokens,
            model_name=self.model_name,
            rate=rate,
            target_token=target_token,
            use_context_level_filter=use_context_level_filter,
            use_token_level_filter=use_token_level_filter,
            target_context=target_context,
            context_level_rate=context_level_rate,
            context_level_target_token=context_level_target_token,
            force_context_ids=force_context_ids,
            return_word_label=return_word_label,
            word_sep=word_sep,
            label_sep=label_sep,
            token_to_word=token_to_word,
            force_tokens=force_tokens,
            force_reserve_digit=force_reserve_digit,
            drop_consecutive=drop_consecutive,
            chunk_end_tokens=chunk_end_tokens,
        )

    def get_token_length(
            self,
            text: str,
            add_special_tokens: bool = True,
            use_oai_tokenizer: bool = False,
    ):
        return get_token_length(
            text, 
            self.tokenizer, 
            oai_tokenizer=self.oai_tokenizer, 
            add_special_tokens=add_special_tokens, 
            use_oai_tokenizer=use_oai_tokenizer
        )

    def recover(
            self,
            original_prompt: str,
            compressed_prompt: str,
            response: str,
    ):
        return recover_response(
            original_prompt,
            compressed_prompt,
            response,
            self.tokenizer
        )