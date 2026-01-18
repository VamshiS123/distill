import os
import random

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
