from typing import List
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader
from loguru import logger

from .dataset import TokenClfDataset
from .token_ops import merge_token_to_word, token_prob_to_word_prob

def run_inference_on_chunks(
    chunk_list: List[str],
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
    dataset = TokenClfDataset(
        chunk_list, tokenizer=tokenizer, max_len=max_seq_len
    )
    dataloader = DataLoader(
        dataset, batch_size=max_batch_size, shuffle=False, drop_last=False
    )

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
                
                # We return both regular word_probs (for filtering) and no_force ones (for context scoring)
                # But actually, compute_context_probs uses no_force. compress_chunks uses force.
                # So we should yield both or handle it.
                # merge_token_to_word returns (words, valid_token_probs, valid_token_probs_no_force)
                
                word_probs = token_prob_to_word_prob(
                    valid_token_probs, convert_mode=token_to_word
                )
                word_probs_no_force = token_prob_to_word_prob(
                    valid_token_probs_no_force, convert_mode=token_to_word
                )

                yield words, word_probs, word_probs_no_force
