from torch.utils.data import Dataset
import torch
from loguru import logger

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
