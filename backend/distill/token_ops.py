import re

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
