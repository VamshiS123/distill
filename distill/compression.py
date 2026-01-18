from typing import List, Dict, Tuple
import copy
import re
import numpy as np
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader
from loguru import logger
from .utils import (
    TokenClfDataset, 
    merge_token_to_word, 
    token_prob_to_word_prob, 
    chunk_context, 
    get_token_length
)

def compute_context_probs(
    context_list: list,
    model,
    tokenizer,
    device,
    max_seq_len,
    max_batch_size,
    special_tokens,
    model_name,
    token_to_word="mean",
    force_tokens: List[str] = [],
    token_map: dict = {},
    force_reserve_digit: bool = False,
):
    logger.debug("Computing context probabilities...")
    chunk_list = []
    for chunks in context_list:
        for c in chunks:
            chunk_list.append(c)

    dataset = TokenClfDataset(
        chunk_list, tokenizer=tokenizer, max_len=max_seq_len
    )
    dataloader = DataLoader(
        dataset, batch_size=max_batch_size, shuffle=False, drop_last=False
    )

    chunk_probs = []
    chunk_words = []
    with torch.no_grad():
        for batch in dataloader:
            ids = batch["ids"].to(device, dtype=torch.long)
            mask = batch["mask"].to(device, dtype=torch.long) == 1

            outputs = model(input_ids=ids, attention_mask=mask)
            loss, logits = outputs.loss, outputs.logits
            probs = F.softmax(logits, dim=-1)

            for j in range(ids.shape[0]):
                _probs = probs[j, :, 1]
                _ids = ids[j]
                _mask = mask[j]

                active_probs = torch.masked_select(_probs, _mask)
                active_ids = torch.masked_select(_ids, _mask)

                tokens = tokenizer.convert_ids_to_tokens(
                    active_ids.squeeze().tolist()
                )
                token_probs = [prob for prob in active_probs.cpu().numpy()]

                (
                    words,
                    valid_token_probs,
                    valid_token_probs_no_force,
                ) = merge_token_to_word(
                    tokens,
                    token_probs,
                    force_tokens=force_tokens,
                    token_map=token_map,
                    force_reserve_digit=force_reserve_digit,
                    special_tokens=special_tokens,
                    model_name=model_name,
                )
                word_probs_no_force = token_prob_to_word_prob(
                    valid_token_probs_no_force, convert_mode=token_to_word
                )

                chunk_words.append(words)
                chunk_probs.append(word_probs_no_force)
            logger.trace("Processed batch in compute_context_probs")

    prev_idx = 0
    context_probs = []
    context_words = []
    for chunk_list in context_list:
        n_chunk = len(chunk_list)
        context_probs.append([])
        context_words.append([])
        for i in range(n_chunk):
            context_probs[-1].extend(chunk_probs[prev_idx + i])
            context_words[-1].extend(chunk_words[prev_idx + i])
        prev_idx = prev_idx + n_chunk
    context_probs = [sum(probs) / len(probs) for probs in context_probs]
    return context_probs, context_words


def compress_chunks(
    context_list: list,
    model,
    tokenizer,
    device,
    oai_tokenizer,
    max_seq_len,
    max_batch_size,
    special_tokens,
    model_name,
    reduce_rate: float = 0.5,
    token_to_word: str = "mean",
    force_tokens: List[str] = [],
    token_map: dict = {},
    force_reserve_digit: bool = False,
    drop_consecutive: bool = False,
):
    logger.debug(f"Executing compress_chunks with reduce_rate={reduce_rate}, drop_consecutive={drop_consecutive}")

    def split_string_to_words(input_string):
        pattern = r'\b\w+\b|[<>=/!@#$%^&*()?":{}|\\`~;_+-]'
        result = re.findall(pattern, input_string)
        return result

    if reduce_rate <= 0:
        logger.debug("Reduce rate <= 0, skipping compression loop.")
        words, word_labels = [], []
        for i in range(len(context_list)):
            chunk_list = context_list[i]
            chunk_words = []
            chunk_word_labels = []
            for j in range(len(chunk_list)):
                # replace to original token
                for ori_token, new_token in token_map.items():
                    chunk_list[j] = chunk_list[j].replace(new_token, ori_token)
                ws = split_string_to_words(chunk_list[j])
                chunk_words.extend(ws)
                chunk_word_labels.extend([1 for _ in range(len(ws))])
            context_list[i] = "".join(chunk_list)
            words.append(chunk_words)
            word_labels.append(chunk_word_labels)
        return context_list, words, word_labels

    chunk_list = []
    for chunks in context_list:
        for c in chunks:
            chunk_list.append(c)

    dataset = TokenClfDataset(
        chunk_list, tokenizer=tokenizer, max_len=max_seq_len
    )
    dataloader = DataLoader(
        dataset, batch_size=max_batch_size, shuffle=False, drop_last=False
    )

    compressed_chunk_list = []
    word_list = []
    word_label_list = []
    with torch.no_grad():
        for batch in dataloader:
            ids = batch["ids"].to(device, dtype=torch.long)
            mask = batch["mask"].to(device, dtype=torch.long) == 1

            outputs = model(input_ids=ids, attention_mask=mask)
            loss, logits = outputs.loss, outputs.logits
            probs = F.softmax(logits, dim=-1)

            for j in range(ids.shape[0]):
                chunk_probs = probs[j, :, 1]
                chunk_ids = ids[j]
                chunk_mask = mask[j]

                active_probs = torch.masked_select(chunk_probs, chunk_mask)
                active_ids = torch.masked_select(chunk_ids, chunk_mask)

                tokens = tokenizer.convert_ids_to_tokens(
                    active_ids.squeeze().tolist()
                )
                token_probs = [prob for prob in active_probs.cpu().numpy()]

                words, valid_token_probs, _ = merge_token_to_word(
                    tokens=tokens,
                    token_probs=token_probs,
                    force_tokens=force_tokens,
                    token_map=token_map,
                    force_reserve_digit=force_reserve_digit,
                    special_tokens=special_tokens,
                    model_name=model_name,
                )
                word_probs = token_prob_to_word_prob(
                    valid_token_probs, convert_mode=token_to_word
                )

                if drop_consecutive:
                    threshold = np.percentile(word_probs, int(100 * reduce_rate))
                    is_token_between = False
                    prev = None
                    for i, (word, word_prob) in enumerate(zip(words, word_probs)):
                        if word in force_tokens:
                            if is_token_between:
                                is_token_between = False
                            elif not is_token_between and word == prev:
                                word_probs[i] = 0.0
                            prev = word
                        else:
                            is_token_between |= word_prob > threshold

                new_token_probs = []
                for word, word_prob in zip(words, word_probs):
                    num_token = len(oai_tokenizer.encode(word))
                    new_token_probs.extend([word_prob for _ in range(num_token)])

                threshold = np.percentile(
                    new_token_probs, int(100 * reduce_rate + 1)
                )

                keep_words = []
                word_labels = []
                assert len(words) == len(word_probs)
                for word, word_prob in zip(words, word_probs):
                    if word_prob > threshold or (
                            threshold == 1.0 and word_prob == threshold
                    ):
                        if (
                                drop_consecutive
                                and word in force_tokens
                                and len(keep_words) > 0
                                and keep_words[-1] == word
                        ):
                            word_labels.append(0)
                        else:
                            keep_words.append(word)
                            word_labels.append(1)
                    else:
                        word_labels.append(0)
                keep_str = tokenizer.convert_tokens_to_string(keep_words)

                compressed_chunk_list.append(keep_str)
                word_list.append(words[:])
                word_label_list.append(word_labels[:])
            logger.trace("Processed batch in compress_chunks")

    compressed_context_list = []
    original_word_list = []
    original_word_label_list = []
    prev_idx = 0
    for chunk_list in context_list:
        n_chunk = len(chunk_list)
        compressed_context_list.append(
            "".join(compressed_chunk_list[prev_idx: prev_idx + n_chunk])
        )
        original_word_list.append([])
        original_word_label_list.append([])
        for i in range(n_chunk):
            original_word_list[-1].extend(word_list[prev_idx + i])
            original_word_label_list[-1].extend(word_label_list[prev_idx + i])
        prev_idx = prev_idx + n_chunk

    return compressed_context_list, original_word_list, original_word_label_list


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
    assert len(force_tokens) <= max_force_token
    token_map = {}
    for i, t in enumerate(force_tokens):
        if len(tokenizer.tokenize(t)) != 1:
            token_map[t] = added_tokens[i]
    chunk_end_tokens = copy.deepcopy(chunk_end_tokens)
    for c in chunk_end_tokens:
        if c in token_map:
            chunk_end_tokens.append(token_map[c])
    chunk_end_tokens = set(chunk_end_tokens)

    if type(context) == str:
        context = [context]
    context = copy.deepcopy(context)

    if len(context) == 1 and use_context_level_filter:
        use_context_level_filter = False
        logger.debug("Context level filter disabled because context length is 1.")

    n_original_token = 0
    context_chunked = []
    for i in range(len(context)):
        n_original_token += get_token_length(
            context[i], tokenizer=None, use_oai_tokenizer=True, oai_tokenizer=oai_tokenizer
        )
        for ori_token, new_token in token_map.items():
            context[i] = context[i].replace(ori_token, new_token)
        context_chunked.append(
            chunk_context(context[i], chunk_end_tokens=chunk_end_tokens, tokenizer=tokenizer, max_seq_len=max_seq_len)
        )

    logger.info(f"Original token count: {n_original_token}")

    if use_context_level_filter:
        logger.debug("Applying context level filter.")
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
            context_level_rate = min(target_context / len(context), 1.0)
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

        if target_token >= 0:
            rate = min(target_token / n_reserved_token, 1.0)

        if use_token_level_filter:
            logger.debug("Applying token level filter (with context filter).")
            compressed_context, word_list, word_label_list = compress_chunks(
                reserved_context,
                model=model,
                tokenizer=tokenizer,
                device=device,
                oai_tokenizer=oai_tokenizer,
                max_seq_len=max_seq_len,
                max_batch_size=max_batch_size,
                special_tokens=special_tokens,
                model_name=model_name,
                reduce_rate=max(0, 1 - rate),
                token_to_word=token_to_word,
                force_tokens=force_tokens,
                token_map=token_map,
                force_reserve_digit=force_reserve_digit,
                drop_consecutive=drop_consecutive,
            )
        else:
            logger.debug("Skipping token level filter (with context filter).")
            compressed_context, word_list, word_label_list = compress_chunks(
                reserved_context,
                model=model,
                tokenizer=tokenizer,
                device=device,
                oai_tokenizer=oai_tokenizer,
                max_seq_len=max_seq_len,
                max_batch_size=max_batch_size,
                special_tokens=special_tokens,
                model_name=model_name,
                reduce_rate=0,
                token_to_word=token_to_word,
                force_tokens=force_tokens,
                token_map=token_map,
                force_reserve_digit=force_reserve_digit,
                drop_consecutive=drop_consecutive,
            )

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
            j = 0
            for i in range(len(context)):
                if context_label[i]:
                    words.extend(word_list[j])
                    labels.extend(word_label_list[j])
                    j += 1
                else:
                    words.extend(context_words[i])
                    labels.extend([0] * len(context_words[i]))
            word_label_lines = word_sep.join(
                [f"{word}{label_sep}{label}" for word, label in zip(words, labels)]
            )
            res["fn_labeled_original_prompt"] = word_label_lines
        return res

    # Normal path without context level filter
    if target_token > 0:
        rate = min(target_token / n_original_token, 1.0)

    logger.debug(f"Effective compression rate: {rate}")

    if use_token_level_filter:
        logger.debug("Applying token level filter.")
        compressed_context, word_list, word_label_list = compress_chunks(
            context_chunked,
            model=model,
            tokenizer=tokenizer,
            device=device,
            oai_tokenizer=oai_tokenizer,
            max_seq_len=max_seq_len,
            max_batch_size=max_batch_size,
            special_tokens=special_tokens,
            model_name=model_name,
            reduce_rate=max(0, 1 - rate),
            token_to_word=token_to_word,
            force_tokens=force_tokens,
            token_map=token_map,
            force_reserve_digit=force_reserve_digit,
            drop_consecutive=drop_consecutive,
        )
    else:
        logger.debug("Skipping token level filter.")
        compressed_context, word_list, word_label_list = compress_chunks(
            context_chunked,
            model=model,
            tokenizer=tokenizer,
            device=device,
            oai_tokenizer=oai_tokenizer,
            max_seq_len=max_seq_len,
            max_batch_size=max_batch_size,
            special_tokens=special_tokens,
            model_name=model_name,
            reduce_rate=0,
            token_to_word=token_to_word,
            force_tokens=force_tokens,
            token_map=token_map,
            force_reserve_digit=force_reserve_digit,
            drop_consecutive=drop_consecutive,
        )

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
        for w_list, l_list in zip(word_list, word_label_list):
            words.extend(w_list)
            labels.extend(l_list)

        word_label_lines = word_sep.join(
            [f"{word}{label_sep}{label}" for word, label in zip(words, labels)]
        )
        res["fn_labeled_original_prompt"] = word_label_lines
    return res
