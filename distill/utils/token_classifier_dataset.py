import torch
from loguru import logger
from torch.utils.data import Dataset
from transformers import PreTrainedTokenizer


class TokenClassifierDataset(Dataset):
    def __init__(
            self,
            texts: list[str],
            max_len: int = 512,
            tokenizer: PreTrainedTokenizer = None,
            model_name: str = "bert-base-multilingual-cased",
    ) -> None:
        """
        Initializes an object that processes text data for tokenization using a specific pre-trained model. This is particularly
        useful for preparing text inputs for models such as BERT, where tokenization adheres to the constraints of a specified
        maximum length and model-specific tokens.

        :param texts: A list of strings representing the text data to be tokenized.
        :type texts: list[str]
        :param max_len: An optional integer parameter that sets the maximum allowed length for tokenized sequences.
            Defaults to 512.
        :type max_len: int
        :param tokenizer: An optional pre-trained tokenizer object to be used for tokenization. Defaults to None.
        :type tokenizer: PreTrainedTokenizer
        :param model_name: A string representing the name of the pre-trained model that determines token-related
            configurations. Defaults to "bert-base-multilingual-cased".
        :type model_name: str

        :raises NotImplementedError: If the model_name argument is not "bert-base-multilingual-cased".
        """
        logger.info(
            f"Initializing TokenClassifierDataset with {len(texts)} texts, max_len={max_len}, model_name={model_name}")
        self.len = len(texts)
        self.texts = texts
        self.tokenizer = tokenizer
        self.max_len = max_len
        self.model_name = model_name

        if model_name == "bert-base-multilingual-cased":
            logger.debug(f"Configuring special tokens for model: {model_name}")
            self.cls_token = "[CLS]"
            self.sep_token = "[SEP]"
            self.unk_token = "[UNK]"
            self.pad_token = "[PAD]"
            self.mask_token = "[MASK]"
        else:
            logger.error(f"Unsupported model name provided: {model_name}")
            raise NotImplementedError()
        logger.success("TokenClassifierDataset initialization complete.")

    def __len__(self) -> int:
        """
        Provides the length of the dataset object.

        :return: The total number of elements in the dataset.
        :rtype: int
        """
        logger.trace(f"Dataset length requested: {self.len}")
        return self.len

    def __getitem__(self, index: int) -> dict:
        """
        Retrieves a dictionary containing tokenized text, attention mask, and their respective
        tensor representations for a given index. The tokenized text is formed by prepending
        a `CLS` token, appending a `SEP` token, and ensuring the output matches the
        specified maximum length by either truncating or padding with a `PAD` token. An
        attention mask differentiates between actual tokens and padding tokens.

        :param index: The index of the text to retrieve and process.
        :type index: int
        :return: A dictionary containing `ids` (token IDs tensor) and `mask`
            (attention mask tensor).
        :rtype: dict
        """
        logger.debug(f"Processing item at index: {index}")
        text = self.texts[index]
        tokenized_text = self.tokenizer.tokenize(text)

        tokenized_text = (
                [self.cls_token] + tokenized_text + [self.sep_token]
        )

        if len(tokenized_text) > self.max_len:
            logger.trace(f"Truncating sequence for index {index} (len {len(tokenized_text)} -> {self.max_len})")
            tokenized_text = tokenized_text[:self.max_len]
        else:
            pad_len = self.max_len - len(tokenized_text)
            logger.trace(f"Padding sequence for index {index} with {pad_len} tokens")
            tokenized_text = tokenized_text + [
                self.pad_token for _ in range(self.max_len - len(tokenized_text))
            ]

        attn_mask = [1 if tok != self.pad_token else 0 for tok in tokenized_text]

        ids = self.tokenizer.convert_tokens_to_ids(tokenized_text)

        ids_tensor = torch.tensor(ids, dtype=torch.long)
        mask_tensor = torch.tensor(attn_mask, dtype=torch.long)

        logger.debug(
            f"Returning tensors for index {index}. IDs shape: {ids_tensor.shape}, Mask shape: {mask_tensor.shape}")

        return {
            "ids": ids_tensor,
            "mask": mask_tensor,
        }
