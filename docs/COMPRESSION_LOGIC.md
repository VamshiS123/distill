# Compression Logic Deep-Dive

Distill uses a unique approach to compression that combines statistical importance with structural constraints.

## 1. Importance Scoring
Unlike entropy-only models (which measure how "surprising" a token is), Distill uses a fine-tuned BERT model to predict "Informational Utility."

*   **Positive Class (1)**: Tokens that carry high semantic weight (Nouns, Verbs, Entities).
*   **Negative Class (0)**: Tokens that are auxiliary, repetitive, or semantically thin.

The model outputs a probability $P(i)$ for each token $T_i$.

## 2. The Retention Threshold
Users specify a `rate` (e.g., 0.5 for 50% compression). Distill converts this into a percentile threshold $	heta$.

$$ 	heta = 	ext{percentile}(\mathbf{P}, 100 	imes (1 - 	ext{rate})) $$

Any token where $P(i) < 	heta$ is a candidate for removal.

## 3. Force Tokens & Anchors
To prevent "Hallucination by Deletion," certain tokens are given an override probability of $1.0$.

*   **Structural Anchors**: Newlines (`
`) and punctuation (`?`, `.`) are often forced to preserve the prompt's layout.
*   **Numeric Preservation**: An optional `force_reserve_digit` flag ensures that all numbers (dates, prices, counts) are preserved, as LLMs are highly sensitive to numeric loss.
*   **User Keywords**: Specific domain terms (e.g., "Python", "API", "Contract") can be passed as `force_tokens` to ensure they are never pruned.

## 4. Aggregation Strategy
BERT uses WordPiece tokenization. Pruning individual sub-tokens (e.g., pruning "##ing" from "Running") would create gibberish. Distill uses a **Union-of-Masks** strategy:
1.  Map sub-tokens back to original words.
2.  Assign the word a score based on its constituent sub-tokens (default is `mean`).
3.  Prune or keep the *entire word* as a single unit.

## 5. Context-Level Filtering
For extremely long prompts (e.g., a whole book), token-level pruning is insufficient. The **Context Level Filter** calculates the average utility of entire paragraphs.
*   If a paragraph's average $P$ is significantly lower than the document average, the entire paragraph is dropped.
*   This "Coarse-to-Fine" approach ensures that irrelevant sections of the context are removed before fine-grained pruning begins.
