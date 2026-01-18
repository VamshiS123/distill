import re

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

def split_string_to_words(input_string):
    pattern = r'\b\w+\b|[<>=/!@#$%^&*()?":{}|\\`~;_+-]'
    result = re.findall(pattern, input_string)
    return result
