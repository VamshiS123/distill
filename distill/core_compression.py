from typing import List
import numpy as np
from loguru import logger
from .inference import run_inference_on_chunks
from .text_ops import split_string_to_words

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

    inference_gen = run_inference_on_chunks(
        chunk_list,
        model,
        tokenizer,
        device,
        max_seq_len,
        max_batch_size,
        special_tokens,
        model_name,
        token_to_word,
        force_tokens,
        token_map,
        force_reserve_digit,
    )

    chunk_probs = []
    chunk_words = []
    
    for words, word_probs, word_probs_no_force in inference_gen:
        chunk_words.append(words)
        chunk_probs.append(word_probs_no_force)
    
    logger.trace("Processed all batches in compute_context_probs")

    prev_idx = 0
    context_probs = []
    context_words = []
    for chunk_list_group in context_list:
        n_chunk = len(chunk_list_group)
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

    inference_gen = run_inference_on_chunks(
        chunk_list,
        model,
        tokenizer,
        device,
        max_seq_len,
        max_batch_size,
        special_tokens,
        model_name,
        token_to_word,
        force_tokens,
        token_map,
        force_reserve_digit,
    )

    compressed_chunk_list = []
    word_list = []
    word_label_list = []

    for words, word_probs, _ in inference_gen:
        # Note: compress_chunks uses 'word_probs' (which includes forced tokens as 1.0)
        
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
    
    logger.trace("Processed all batches in compress_chunks")

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
