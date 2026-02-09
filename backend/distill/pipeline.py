from typing import List, Tuple, Dict, Any
import copy
import numpy as np
from loguru import logger

from .text_ops import get_token_length, chunk_context
from .core_compression import compute_context_probs, compress_chunks

def prepare_tokens_and_chunks(
    context: List[str],
    force_tokens: List[str],
    max_force_token: int,
    tokenizer,
    added_tokens: List[str],
    chunk_end_tokens: List[str],
    max_seq_len: int,
    oai_tokenizer,
) -> Tuple[List[List[str]], Dict[str, str], int, List[str]]:
    
    # Validate force tokens
    assert len(force_tokens) <= max_force_token
    
    # Create token map
    token_map = {}
    for i, t in enumerate(force_tokens):
        if len(tokenizer.tokenize(t)) != 1:
            token_map[t] = added_tokens[i]
            
    # Prepare chunk end tokens
    chunk_end_tokens_set = copy.deepcopy(chunk_end_tokens)
    for c in chunk_end_tokens_set:
        if c in token_map:
            chunk_end_tokens_set.append(token_map[c])
    chunk_end_tokens_set = set(chunk_end_tokens_set)

    # Normalize context to list
    if isinstance(context, str):
        context = [context]
    context = copy.deepcopy(context)

    # Calculate original token count and chunk context
    n_original_token = 0
    context_chunked = []
    for i in range(len(context)):
        n_original_token += get_token_length(
            context[i], tokenizer=None, use_oai_tokenizer=True, oai_tokenizer=oai_tokenizer
        )
        for ori_token, new_token in token_map.items():
            context[i] = context[i].replace(ori_token, new_token)
        context_chunked.append(
            chunk_context(context[i], chunk_end_tokens=chunk_end_tokens_set, tokenizer=tokenizer, max_seq_len=max_seq_len)
        )

    logger.info(f"Original token count: {n_original_token}")
    return context_chunked, token_map, n_original_token, context

def filter_context(
    context_chunked: List[List[str]],
    model,
    tokenizer,
    device,
    max_seq_len,
    max_batch_size,
    special_tokens,
    model_name,
    token_to_word: str,
    force_tokens: List[str],
    token_map: Dict[str, str],
    force_reserve_digit: bool,
    context_level_rate: float,
    force_context_ids: List[int],
    n_original_token: int,
    target_context: int,
    context_level_target_token: int,
    rate: float,
    target_token: int,
    use_token_level_filter: bool,
    oai_tokenizer
) -> Tuple[List[List[str]], List[bool], List[Any], float]:

    # Adjust rates based on targets
    if (
            target_context <= 0
            and context_level_rate >= 1.0
            and context_level_target_token <= 0
    ):
        if target_token < 0 and rate < 1.0:
            context_level_rate = (
                (rate + 1.0) / 2 if use_token_level_filter else rate
            )
        if target_token >= 0:
            context_level_target_token = (
                target_token * 2 if use_token_level_filter else target_token
            )

    if target_context >= 0:
        context_level_rate = min(target_context / len(context_chunked), 1.0)
    if context_level_target_token >= 0:
        context_level_rate = min(
            context_level_target_token / n_original_token, 1.0
        )

    logger.debug(f"Calculating context probabilities. context_level_rate={context_level_rate}")
    context_probs, context_words = compute_context_probs(
        context_chunked,
        model=model,
        tokenizer=tokenizer,
        device=device,
        max_seq_len=max_seq_len,
        max_batch_size=max_batch_size,
        special_tokens=special_tokens,
        model_name=model_name,
        token_to_word=token_to_word,
        force_tokens=force_tokens,
        token_map=token_map,
        force_reserve_digit=force_reserve_digit,
    )

    threshold = np.percentile(
        context_probs, int(100 * (1 - context_level_rate))
    )
    logger.debug(f"Context probability threshold: {threshold}")

    reserved_context = []
    context_label = [False] * len(context_probs)
    for i, p in enumerate(context_probs):
        if p >= threshold or (
                force_context_ids is not None and i in force_context_ids
        ):
            reserved_context.append(context_chunked[i])
            context_label[i] = True

    n_reserved_token = 0
    for chunks in reserved_context:
        for c in chunks:
            n_reserved_token += get_token_length(c, tokenizer=None, use_oai_tokenizer=True, oai_tokenizer=oai_tokenizer)

    logger.info(f"Tokens after context filtering: {n_reserved_token}")
    
    # Update rate based on reserved tokens
    if target_token >= 0:
        rate = min(target_token / n_reserved_token, 1.0)
        
    return reserved_context, context_label, context_words, rate

def filter_tokens(
    context_chunked: List[List[str]],
    model,
    tokenizer,
    device,
    oai_tokenizer,
    max_seq_len,
    max_batch_size,
    special_tokens,
    model_name,
    rate: float,
    target_token: int,
    n_original_token: int,
    use_token_level_filter: bool,
    token_to_word: str,
    force_tokens: List[str],
    token_map: Dict[str, str],
    force_reserve_digit: bool,
    drop_consecutive: bool
) -> Tuple[List[str], List[Any], List[Any]]:

    # Adjust rate if target_token is set (and we didn't do context filtering, or passed updated rate)
    # But wait, if we call this from pipeline, 'rate' should already be adjusted if needed?
    # In original code: 
    # If NO context filter: 
    #   if target_token > 0: rate = min(target_token / n_original_token, 1.0)
    # If context filter:
    #   rate is updated inside filter_context block.
    
    # We will pass the correct 'rate' to this function.
    
    logger.debug(f"Effective compression rate: {rate}")

    if use_token_level_filter:
        logger.debug("Applying token level filter.")
        reduce_rate = max(0, 1 - rate)
    else:
        logger.debug("Skipping token level filter.")
        reduce_rate = 0

    return compress_chunks(
        context_chunked,
        model=model,
        tokenizer=tokenizer,
        device=device,
        oai_tokenizer=oai_tokenizer,
        max_seq_len=max_seq_len,
        max_batch_size=max_batch_size,
        special_tokens=special_tokens,
        model_name=model_name,
        reduce_rate=reduce_rate,
        token_to_word=token_to_word,
        force_tokens=force_tokens,
        token_map=token_map,
        force_reserve_digit=force_reserve_digit,
        drop_consecutive=drop_consecutive,
    )

def format_result(
    compressed_context: List[str],
    n_original_token: int,
    tokenizer,
    oai_tokenizer,
    return_word_label: bool,
    word_sep: str,
    label_sep: str,
    word_list: List[Any],
    word_label_list: List[Any],
    context_label: List[bool] = None,
    context_words: List[Any] = None,
    context_original_list: List[str] = None
) -> Dict[str, Any]:
    
    n_compressed_token = 0
    for c in compressed_context:
        n_compressed_token += get_token_length(c, tokenizer=None, use_oai_tokenizer=True, oai_tokenizer=oai_tokenizer)

    logger.info(f"Compressed token count: {n_compressed_token}")

    ratio = (
        1 if n_compressed_token == 0 else n_original_token / n_compressed_token
    )
    res = {
        "compressed_prompt": "\n\n".join(compressed_context),
        "compressed_prompt_list": compressed_context,
        "origin_tokens": n_original_token,
        "compressed_tokens": n_compressed_token,
        "ratio": f"{ratio:.1f}x",
        "rate": f"{1 / ratio * 100:.1f}%",
        "saving": f", Saving ${(n_original_token - n_compressed_token) * 0.06 / 1000:.1f} in GPT-4.",
    }
    
    if return_word_label:
        words = []
        labels = []
        
        if context_label is not None:
            # We had context filtering
            j = 0
            for i in range(len(context_original_list)):
                if context_label[i]:
                    words.extend(word_list[j])
                    labels.extend(word_label_list[j])
                    j += 1
                else:
                    words.extend(context_words[i])
                    labels.extend([0] * len(context_words[i]))
        else:
            # No context filtering
            for w_list, l_list in zip(word_list, word_label_list):
                words.extend(w_list)
                labels.extend(l_list)

        word_label_lines = word_sep.join(
            [f"{word}{label_sep}{label}" for word, label in zip(words, labels)]
        )
        res["fn_labeled_original_prompt"] = word_label_lines
        
    return res

def compress_prompt_pipeline(
    context,
    model,
    tokenizer,
    device,
    oai_tokenizer,
    max_seq_len,
    max_batch_size,
    max_force_token,
    special_tokens,
    added_tokens,
    model_name,
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
    logger.info(
        f"Compressing prompt. Context chunks: {len(context) if isinstance(context, list) else 1}, Rate: {rate}, Target Token: {target_token}"
    )
    
    # 1. Prepare inputs
    context_chunked, token_map, n_original_token, context_original_list = prepare_tokens_and_chunks(
        context, force_tokens, max_force_token, tokenizer, added_tokens, chunk_end_tokens, max_seq_len, oai_tokenizer
    )

    if len(context_original_list) == 1 and use_context_level_filter:
        use_context_level_filter = False
        logger.debug("Context level filter disabled because context length is 1.")

    context_label = None
    context_words = None
    
    # 2. Context Filtering
    if use_context_level_filter:
        logger.debug("Applying context level filter.")
        reserved_context, context_label, context_words, rate = filter_context(
            context_chunked, model, tokenizer, device, max_seq_len, max_batch_size, special_tokens, model_name,
            token_to_word, force_tokens, token_map, force_reserve_digit,
            context_level_rate, force_context_ids, n_original_token, target_context, context_level_target_token,
            rate, target_token, use_token_level_filter, oai_tokenizer
        )
        
        # Determine inputs for token filtering
        chunks_to_compress = reserved_context
        
    else:
        # No context filtering
        if target_token > 0:
            rate = min(target_token / n_original_token, 1.0)
        chunks_to_compress = context_chunked

    # 3. Token Filtering
    compressed_context, word_list, word_label_list = filter_tokens(
        chunks_to_compress, model, tokenizer, device, oai_tokenizer, max_seq_len, max_batch_size, special_tokens, model_name,
        rate, target_token, n_original_token, use_token_level_filter,
        token_to_word, force_tokens, token_map, force_reserve_digit, drop_consecutive
    )

    # 4. Format Result
    return format_result(
        compressed_context, n_original_token, tokenizer, oai_tokenizer,
        return_word_label, word_sep, label_sep,
        word_list, word_label_list,
        context_label, context_words, context_original_list
    )
