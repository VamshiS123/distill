from typing import Tuple, Dict, Any, List, Set
import torch
from transformers import (
    AutoConfig,
    AutoModelForCausalLM,
    AutoModelForTokenClassification,
    AutoTokenizer,
)
from loguru import logger
from .utils import seed_everything

def load_model_and_tokenizer(
    model_name: str,
    device_map: str = "cuda",
    model_config: Dict[str, Any] = {},
) -> Tuple[Any, Any, str, Any]:
    logger.info(f"Loading model: {model_name} on {device_map}")
    trust_remote_code = model_config.get("trust_remote_code", True)
    if "trust_remote_code" not in model_config:
        model_config["trust_remote_code"] = trust_remote_code

    logger.debug("Loading AutoConfig...")
    config = AutoConfig.from_pretrained(model_name, **model_config)
    logger.debug("Loading AutoTokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_name, **model_config)
    if model_config.get("pad_to_left", True):
        tokenizer.padding_side = "left"
        tokenizer.pad_token_id = (
            config.pad_token_id if config.pad_token_id else tokenizer.eos_token_id
        )

    MODEL_CLASS = (
        AutoModelForTokenClassification
        if any("ForTokenClassification" in ar for ar in config.architectures)
        else AutoModelForCausalLM
    )
    logger.debug(f"Selected model class: {MODEL_CLASS.__name__}")

    device = (
        device_map
        if any(key in device_map for key in ["cuda", "cpu", "mps"])
        else "cuda"
    )
    logger.info(f"Using device: {device}")

    # Prepare loading arguments
    loading_args = model_config.copy()
    dtype = loading_args.pop("dtype", "auto" if device == "cuda" else torch.float32)
    
    # Clean up args that shouldn't be passed to from_pretrained if they were popped or handled
    # But here we just popped dtype.
    
    if "cuda" in device or "cpu" in device:
        model = MODEL_CLASS.from_pretrained(
            model_name,
            dtype=dtype,
            device_map=device,
            config=config,
            ignore_mismatched_sizes=True,
            **loading_args,
        )
    else:
        # mps or other devices
        model = MODEL_CLASS.from_pretrained(
            model_name,
            device_map=device,
            dtype=dtype,
            pad_token_id=tokenizer.pad_token_id,
            **loading_args,
        )
    
    logger.info("Model loaded successfully.")
    return model, tokenizer, device, config.max_position_embeddings


def init_distill_config(
    model,
    tokenizer,
    max_batch_size: int = 50,
    max_force_token: int = 100,
) -> Tuple[int, int, Set[str], List[str]]:
    logger.debug(
        f"Initializing Distill internal config: max_batch_size={max_batch_size}, max_force_token={max_force_token}")
    seed_everything(42)
    max_seq_len = 512
    special_tokens = set(
        [
            v
            for k, v in tokenizer.special_tokens_map.items()
            if k != "additional_special_tokens"
        ]
    )

    added_tokens = [f"[NEW{i}]" for i in range(max_force_token)]
    tokenizer.add_special_tokens(
        {"additional_special_tokens": added_tokens}
    )
    model.resize_token_embeddings(len(tokenizer))
    logger.debug("Distill initialization complete.")
    
    return max_seq_len, special_tokens, added_tokens
