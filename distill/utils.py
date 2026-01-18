import os
import random
import re
from collections import defaultdict
from typing import List

import numpy as np
import torch
from loguru import logger
from torch.utils.data import Dataset


class TokenClfDataset(Dataset):
    def __init__(
            self,
            texts,
            max_len=512,
            tokenizer=None,
            model_name="bert-base-multilingual-cased",
    ):
        logger.trace(f"Initializing TokenClfDataset with {len(texts)} texts, max_len={max_len}, model_name={model_name}")
        self.len = len(texts)
        self.texts = texts
        self.tokenizer = tokenizer
        self.max_len = max_len
        self.model_name = model_name
        self.cls_token = "[CLS]"
        self.sep_token = "[SEP]"
        self.unk_token = "[UNK]"
        self.pad_token = "[PAD]"
        self.mask_token = "[MASK]"

    def __getitem__(self, index):
        # High volume trace log
        # logger.trace(f"TokenClfDataset: getting item at index {index}")
        text = self.texts[index]
        tokenized_text = self.tokenizer.tokenize(text)

        tokenized_text = (
                [self.cls_token] + tokenized_text + [self.sep_token]
        )  # add special tokens

        if len(tokenized_text) > self.max_len:
            tokenized_text = tokenized_text[: self.max_len]
        else:
            tokenized_text = tokenized_text + [
                self.pad_token for _ in range(self.max_len - len(tokenized_text))
            ]

        attn_mask = [1 if tok != self.pad_token else 0 for tok in tokenized_text]

        ids = self.tokenizer.convert_tokens_to_ids(tokenized_text)

        return {
            "ids": torch.tensor(ids, dtype=torch.long),
            "mask": torch.tensor(attn_mask, dtype=torch.long),
        }

    def __len__(self):
        return self.len


def seed_everything(seed: int):
    logger.debug(f"Seeding everything with seed={seed}")
    random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def is_begin_of_new_word(token, model_name, force_tokens, token_map):
    if token.lstrip("##") in force_tokens or token.lstrip("##") in set(
            token_map.values()
    ):
        return True
    return not token.startswith("##")


def replace_added_token(token, token_map):
    for ori_token, new_token in token_map.items():
        token = token.replace(new_token, ori_token)
    return token


def get_pure_token(token, model_name):
    return token.lstrip("##")


def get_token_length(
        text: str,
        tokenizer,
        oai_tokenizer=None,
        add_special_tokens: bool = True,
        use_oai_tokenizer: bool = False,
):
    if use_oai_tokenizer and oai_tokenizer is not None:
        return len(oai_tokenizer.encode(text))
    else:
        return len(
            tokenizer(text, add_special_tokens=add_special_tokens).input_ids
        )


def chunk_context(origin_text, chunk_end_tokens, tokenizer, max_seq_len):
    # logger.trace("Chunking context...")
    # leave 2 token for CLS and SEP
    max_len = max_seq_len - 2
    origin_list = []
    origin_tokens = tokenizer.tokenize(origin_text)
    n = len(origin_tokens)
    st = 0
    while st < n:
        if st + max_len > n - 1:
            chunk = tokenizer.convert_tokens_to_string(origin_tokens[st:n])
            origin_list.append(chunk)
            break
        else:
            ed = st + max_len
            for j in range(0, ed - st):
                if origin_tokens[ed - j] in chunk_end_tokens:
                    ed = ed - j
                    break
            chunk = tokenizer.convert_tokens_to_string(
                origin_tokens[st: ed + 1]
            )
            origin_list.append(chunk)
            st = ed + 1
    return origin_list


def merge_token_to_word(
        tokens,
        token_probs,
        force_tokens,
        token_map,
        force_reserve_digit,
        special_tokens,
        model_name,
):
    words = []
    word_probs = []
    word_probs_no_force = []

    for token, prob in zip(tokens, token_probs):
        if token in special_tokens:
            continue
        # add a new word
        elif is_begin_of_new_word(token, model_name, force_tokens, token_map):
            pure_token = get_pure_token(token, model_name)
            prob_no_force = prob
            if pure_token in force_tokens or pure_token in set(token_map.values()):
                prob = 1.0
            token = replace_added_token(token, token_map)
            words.append(token)
            word_probs.append(
                [
                    1.0
                    if force_reserve_digit and bool(re.search(r"\d", token))
                    else prob
                ]
            )
            word_probs_no_force.append([prob_no_force])
        # concatenate with previous token
        else:
            pure_token = get_pure_token(token, model_name)
            words[-1] += pure_token
            word_probs[-1].append(
                1.0
                if force_reserve_digit and bool(re.search(r"\d", token))
                else prob
            )
            word_probs_no_force[-1].append(prob_no_force)

    return words, word_probs, word_probs_no_force


def token_prob_to_word_prob(token_probs, convert_mode="mean"):
    if convert_mode == "mean":
        word_probs = [sum(p) / len(p) for p in token_probs]
    elif convert_mode == "first":
        word_probs = [p[0] for p in token_probs]
    else:
        raise NotImplementedError()

    return word_probs