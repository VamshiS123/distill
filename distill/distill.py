import bisect
import copy
import re
from collections import defaultdict
from typing import List

import numpy as np
import tiktoken
import torch
import torch.nn.functional as F
from loguru import logger
from torch.utils.data import DataLoader
from transformers import (
    AutoConfig,
    AutoModelForCausalLM,
    AutoModelForTokenClassification,
    AutoTokenizer,
)

from .utils import (
    TokenClfDataset,
    get_pure_token,
    is_begin_of_new_word,
    replace_added_token,
    seed_everything,
)


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
        self.oai_tokenizer = tiktoken.encoding_for_model("gpt-5")

        self.load_model(model_name, device_map, model_config)
        self._init_distill(**distill_config)

    def _init_distill(
            self,
            max_batch_size: int = 50,
            max_force_token: int = 100,
    ):
        logger.debug(f"Initializing Distill internal config: max_batch_size={max_batch_size}, max_force_token={max_force_token}")
        seed_everything(42)
        self.max_batch_size = max_batch_size
        self.max_seq_len = 512
        self.max_force_token = max_force_token
        self.special_tokens = set(
            [
                v
                for k, v in self.tokenizer.special_tokens_map.items()
                if k != "additional_special_tokens"
            ]
        )

        self.added_tokens = [f"[NEW{i}]" for i in range(max_force_token)]
        self.tokenizer.add_special_tokens(
            {"additional_special_tokens": self.added_tokens}
        )
        self.model.resize_token_embeddings(len(self.tokenizer))
        logger.debug("Distill initialization complete.")

    def load_model(
            self,
            model_name: str,
            device_map: str = "cuda",
            model_config: dict = {},
    ):
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

        self.device = (
            device_map
            if any(key in device_map for key in ["cuda", "cpu", "mps"])
            else "cuda"
        )
        logger.info(f"Using device: {self.device}")

        if "cuda" in device_map or "cpu" in device_map:
            model = MODEL_CLASS.from_pretrained(
                model_name,
                dtype=model_config.pop(
                    "dtype", "auto" if device_map == "cuda" else torch.float32
                ),
                device_map=device_map,
                config=config,
                ignore_mismatched_sizes=True,
                **model_config,
            )
        else:
            model = MODEL_CLASS.from_pretrained(
                model_name,
                device_map=device_map,
                dtype=model_config.pop("dtype", "auto"),
                pad_token_id=tokenizer.pad_token_id,
                **model_config,
            )
        self.tokenizer = tokenizer
        self.model = model
        self.max_position_embeddings = config.max_position_embeddings
        logger.info("Model loaded successfully.")

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
        logger.info(f"Compressing prompt. Context chunks: {len(context) if isinstance(context, list) else 1}, Rate: {rate}, Target Token: {target_token}")
        assert len(force_tokens) <= self.max_force_token
        token_map = {}
        for i, t in enumerate(force_tokens):
            if len(self.tokenizer.tokenize(t)) != 1:
                token_map[t] = self.added_tokens[i]
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
            n_original_token += self.get_token_length(
                context[i], use_oai_tokenizer=True
            )
            for ori_token, new_token in token_map.items():
                context[i] = context[i].replace(ori_token, new_token)
            context_chunked.append(
                self.__chunk_context(context[i], chunk_end_tokens=chunk_end_tokens)
            )
        
        logger.info(f"Original token count: {n_original_token}")

        if use_context_level_filter:
            logger.debug("Applying context level filter.")
            # want use_context_level_filter but do not specify any parameters in context level?
            # we will set context_level_rate = (rate + 1.0) / 2 if specify rate or target_token * 2 if specify target_token
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
            context_probs, context_words = self.__get_context_prob(
                context_chunked,
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
                    n_reserved_token += self.get_token_length(c, use_oai_tokenizer=True)
            
            logger.info(f"Tokens after context filtering: {n_reserved_token}")

            if target_token >= 0:
                rate = min(target_token / n_reserved_token, 1.0)

            if use_token_level_filter:
                logger.debug("Applying token level filter (with context filter).")
                compressed_context, word_list, word_label_list = self.__compress(
                    reserved_context,
                    reduce_rate=max(0, 1 - rate),
                    token_to_word=token_to_word,
                    force_tokens=force_tokens,
                    token_map=token_map,
                    force_reserve_digit=force_reserve_digit,
                    drop_consecutive=drop_consecutive,
                )
            else:
                logger.debug("Skipping token level filter (with context filter).")
                compressed_context, word_list, word_label_list = self.__compress(
                    reserved_context,
                    reduce_rate=0,
                    token_to_word=token_to_word,
                    force_tokens=force_tokens,
                    token_map=token_map,
                    force_reserve_digit=force_reserve_digit,
                    drop_consecutive=drop_consecutive,
                )

            n_compressed_token = 0
            for c in compressed_context:
                n_compressed_token += self.get_token_length(c, use_oai_tokenizer=True)
            
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
            compressed_context, word_list, word_label_list = self.__compress(
                context_chunked,
                reduce_rate=max(0, 1 - rate),
                token_to_word=token_to_word,
                force_tokens=force_tokens,
                token_map=token_map,
                force_reserve_digit=force_reserve_digit,
                drop_consecutive=drop_consecutive,
            )
        else:
            logger.debug("Skipping token level filter.")
            compressed_context, word_list, word_label_list = self.__compress(
                context_chunked,
                reduce_rate=0,
                token_to_word=token_to_word,
                force_tokens=force_tokens,
                token_map=token_map,
                force_reserve_digit=force_reserve_digit,
                drop_consecutive=drop_consecutive,
            )

        n_compressed_token = 0
        for c in compressed_context:
            n_compressed_token += self.get_token_length(c, use_oai_tokenizer=True)
        
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

    def get_token_length(
            self,
            text: str,
            add_special_tokens: bool = True,
            use_oai_tokenizer: bool = False,
    ):
        if use_oai_tokenizer:
            return len(self.oai_tokenizer.encode(text))
        else:
            return len(
                self.tokenizer(text, add_special_tokens=add_special_tokens).input_ids
            )

    def recover(
            self,
            original_prompt: str,
            compressed_prompt: str,
            response: str,
    ):
        logger.info("Recovering response...")
        def match_from_compressed(response_word):
            response_input_ids = self.tokenizer(
                response_word, add_special_tokens=False
            )["input_ids"]
            response_set, response_c = set(response_input_ids), defaultdict(list)
            for idx in range(M):
                if original_input_ids[idx] in response_set:
                    response_c[original_input_ids[idx]].append(idx)
            res, res_min, res_c = None, float("inf"), 1
            n = len(response_input_ids)
            for l in response_c[response_input_ids[0]]:
                x, y, c = 0, l, 1
                for x in range(1, n):
                    idx = bisect.bisect_right(response_c[response_input_ids[x]], y)
                    if (
                            idx >= len(response_c[response_input_ids[x]])
                            or response_c[response_input_ids[x]][idx] - y > 10
                    ):
                        continue
                    c += 1
                    y = response_c[response_input_ids[x]][idx]
                if c > res_c:
                    res_c = c
                    res_min = y - l + 1
                    res = (l, y + 1)
                elif c == res_c and y - l + 1 < res_min:
                    res_min = y - l + 1
                    res = (l, y + 1)

            if res is None:
                return response_word
            return self.tokenizer.decode(original_input_ids[res[0]: res[1]])

        response_words = response.split(" ")

        original_input_ids = self.tokenizer(original_prompt, add_special_tokens=False)[
            "input_ids"
        ]
        N, M = len(response_words), len(original_input_ids)
        logger.debug(f"Recovering: Response words={N}, Original input ids={M}")
        recovered_response_words = []
        l = 0
        while l < N:
            if response_words[l] not in compressed_prompt:
                recovered_response_words.append(response_words[l])
                l += 1
                continue
            r = l
            while (
                    r + 1 < N and " ".join(response_words[l: r + 2]) in compressed_prompt
            ):
                r += 1

            match_words = match_from_compressed(" ".join(response_words[l: r + 1]))
            recovered_response_words.append(match_words)
            l = r + 1
        logger.info("Recovery complete.")
        return " ".join(recovered_response_words)

    def __get_context_prob(
            self,
            context_list: list,
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
            chunk_list, tokenizer=self.tokenizer, max_len=self.max_seq_len
        )
        dataloader = DataLoader(
            dataset, batch_size=self.max_batch_size, shuffle=False, drop_last=False
        )

        chunk_probs = []
        chunk_words = []
        with torch.no_grad():
            for batch in dataloader:
                ids = batch["ids"].to(self.device, dtype=torch.long)
                mask = batch["mask"].to(self.device, dtype=torch.long) == 1

                outputs = self.model(input_ids=ids, attention_mask=mask)
                loss, logits = outputs.loss, outputs.logits
                probs = F.softmax(logits, dim=-1)

                for j in range(ids.shape[0]):
                    _probs = probs[j, :, 1]
                    _ids = ids[j]
                    _mask = mask[j]

                    active_probs = torch.masked_select(_probs, _mask)
                    active_ids = torch.masked_select(_ids, _mask)

                    tokens = self.tokenizer.convert_ids_to_tokens(
                        active_ids.squeeze().tolist()
                    )
                    token_probs = [prob for prob in active_probs.cpu().numpy()]

                    (
                        words,
                        valid_token_probs,
                        valid_token_probs_no_force,
                    ) = self.__merge_token_to_word(
                        tokens,
                        token_probs,
                        force_tokens=force_tokens,
                        token_map=token_map,
                        force_reserve_digit=force_reserve_digit,
                    )
                    word_probs_no_force = self.__token_prob_to_word_prob(
                        valid_token_probs_no_force, convert_mode=token_to_word
                    )

                    chunk_words.append(words)
                    chunk_probs.append(word_probs_no_force)
                logger.trace("Processed batch in __get_context_prob")

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

    def __chunk_context(self, origin_text, chunk_end_tokens):
        # logger.trace("Chunking context...")
        # leave 2 token for CLS and SEP
        max_len = self.max_seq_len - 2
        origin_list = []
        origin_tokens = self.tokenizer.tokenize(origin_text)
        n = len(origin_tokens)
        st = 0
        while st < n:
            if st + max_len > n - 1:
                chunk = self.tokenizer.convert_tokens_to_string(origin_tokens[st:n])
                origin_list.append(chunk)
                break
            else:
                ed = st + max_len
                for j in range(0, ed - st):
                    if origin_tokens[ed - j] in chunk_end_tokens:
                        ed = ed - j
                        break
                chunk = self.tokenizer.convert_tokens_to_string(
                    origin_tokens[st: ed + 1]
                )
                origin_list.append(chunk)
                st = ed + 1
        return origin_list

    def __merge_token_to_word(
            self,
            tokens,
            token_probs,
            force_tokens,
            token_map,
            force_reserve_digit,
    ):
        words = []
        word_probs = []
        word_probs_no_force = []

        for token, prob in zip(tokens, token_probs):
            if token in self.special_tokens:
                continue
            # add a new word
            elif is_begin_of_new_word(token, self.model_name, force_tokens, token_map):
                pure_token = get_pure_token(token, self.model_name)
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
                pure_token = get_pure_token(token, self.model_name)
                words[-1] += pure_token
                word_probs[-1].append(
                    1.0
                    if force_reserve_digit and bool(re.search(r"\d", token))
                    else prob
                )
                word_probs_no_force[-1].append(prob_no_force)

        return words, word_probs, word_probs_no_force

    def __token_prob_to_word_prob(self, token_probs, convert_mode="mean"):
        if convert_mode == "mean":
            word_probs = [sum(p) / len(p) for p in token_probs]
        elif convert_mode == "first":
            word_probs = [p[0] for p in token_probs]
        else:
            raise NotImplementedError()

        return word_probs

    def __compress(
            self,
            context_list: list,
            reduce_rate: float = 0.5,
            token_to_word: str = "mean",
            force_tokens: List[str] = [],
            token_map: dict = {},
            force_reserve_digit: bool = False,
            drop_consecutive: bool = False,
    ):
        logger.debug(f"Executing __compress with reduce_rate={reduce_rate}, drop_consecutive={drop_consecutive}")
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
            chunk_list, tokenizer=self.tokenizer, max_len=self.max_seq_len
        )
        dataloader = DataLoader(
            dataset, batch_size=self.max_batch_size, shuffle=False, drop_last=False
        )

        compressed_chunk_list = []
        word_list = []
        word_label_list = []
        with torch.no_grad():
            for batch in dataloader:
                ids = batch["ids"].to(self.device, dtype=torch.long)
                mask = batch["mask"].to(self.device, dtype=torch.long) == 1

                outputs = self.model(input_ids=ids, attention_mask=mask)
                loss, logits = outputs.loss, outputs.logits
                probs = F.softmax(logits, dim=-1)

                for j in range(ids.shape[0]):
                    chunk_probs = probs[j, :, 1]
                    chunk_ids = ids[j]
                    chunk_mask = mask[j]

                    active_probs = torch.masked_select(chunk_probs, chunk_mask)
                    active_ids = torch.masked_select(chunk_ids, chunk_mask)

                    tokens = self.tokenizer.convert_ids_to_tokens(
                        active_ids.squeeze().tolist()
                    )
                    token_probs = [prob for prob in active_probs.cpu().numpy()]

                    words, valid_token_probs, _ = self.__merge_token_to_word(
                        tokens=tokens,
                        token_probs=token_probs,
                        force_tokens=force_tokens,
                        token_map=token_map,
                        force_reserve_digit=force_reserve_digit,
                    )
                    word_probs = self.__token_prob_to_word_prob(
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
                        num_token = len(self.oai_tokenizer.encode(word))
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
                    keep_str = self.tokenizer.convert_tokens_to_string(keep_words)

                    compressed_chunk_list.append(keep_str)
                    word_list.append(words[:])
                    word_label_list.append(word_labels[:])
                logger.trace("Processed batch in __compress")

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