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

    def __len__(self):
        logger.trace(f"Dataset length requested: {self.len}")
        return self.len
