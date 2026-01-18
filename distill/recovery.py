import bisect
from collections import defaultdict
from loguru import logger

def recover_response(
    original_prompt: str,
    compressed_prompt: str,
    response: str,
    tokenizer,
) -> str:
    logger.info("Recovering response...")

    def match_from_compressed(response_word, original_input_ids, M):
        response_input_ids = tokenizer(
            response_word, add_special_tokens=False
        )["input_ids"]
        response_set, response_c = set(response_input_ids), defaultdict(list)
        for idx in range(M):
            if original_input_ids[idx] in response_set:
                response_c[original_input_ids[idx]].append(idx)
        res, res_min, res_c = None, float("inf"), 1
        n = len(response_input_ids)
        if len(response_input_ids) == 0:
            return response_word
            
        if response_input_ids[0] not in response_c:
             # handle case where first token not found
             return response_word

        for l in response_c[response_input_ids[0]]:
            x, y, c = 0, l, 1
            for x in range(1, n):
                if response_input_ids[x] not in response_c:
                    break
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
        return tokenizer.decode(original_input_ids[res[0]: res[1]])

    response_words = response.split(" ")

    original_input_ids = tokenizer(original_prompt, add_special_tokens=False)[
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

        match_words = match_from_compressed(
            " ".join(response_words[l: r + 1]),
            original_input_ids, 
            M
        )
        recovered_response_words.append(match_words)
        l = r + 1
    logger.info("Recovery complete.")
    return " ".join(recovered_response_words)
