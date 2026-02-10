# Backend Components

The `backend/distill/` directory contains the core logic of the library. Each module is designed to handle a specific stage of the compression lifecycle.

## 1. `distill.py` (Entry Point)
The main interface for the library. It exposes the `Distill` class, which manages:
*   Model and tokenizer initialization.
*   Device management (MPS for Mac, CUDA for NVIDIA, or CPU).
*   The primary `compress_prompt` method.

## 2. `pipeline.py` (Orchestrator)
This module implements the `compress_prompt_pipeline`. It coordinates the flow of data between chunking, inference, and filtering. It handles the logic of whether to apply context-level filtering, token-level filtering, or both.

## 3. `inference.py` (Model Execution)
Handles the forward pass of the BERT model.
*   Uses `TokenClfDataset` and `DataLoader` for efficient batch processing.
*   Returns raw logits which are converted to probabilities for each token.
*   Calculates two sets of probabilities: one for raw scoring and one that respects "forced" tokens.

## 4. `core_compression.py` (Filtering Logic)
Contains the mathematical logic for pruning.
*   **Threshold Calculation**: Uses `np.percentile` to determine the cutoff for token removal based on the desired compression rate.
*   **Pruning**: Iterates through tokens and removes those falling below the threshold, while respecting "force tokens."

## 5. `token_ops.py` (Token Manipulation)
A utility module for bridging the gap between tokens and words.
*   **Word Merging**: Combines BERT sub-tokens into words so that importance scores are aggregated (e.g., using `mean`). This prevents the model from accidentally pruning half of a word.
*   **Force Token Handling**: Logic for "anchoring" specific tokens (like `?`, `
`, or specific keywords) so they are never deleted.

## 6. `text_ops.py` (Text Processing)
Handles structural operations on strings.
*   **Chunking**: Splits long inputs into segments that fit within the BERT model's maximum sequence length (typically 512 tokens).
*   **Token Counting**: Interface for `tiktoken` to accurately measure LLM-specific token counts.

## 7. `recovery.py` (Response Mapping)
A sophisticated utility for "un-compressing" the logic. When an LLM responds to a compressed prompt, it might refer to entities that were modified. `recovery.py` helps map these references back to the original, full-text context.

## 8. `loading.py` (Initialization)
Encapsulates the complexity of loading Transformer models. It handles:
*   Auto-detection of model architecture (Token Classification vs Causal LM).
*   Resizing embeddings when "Force Tokens" are added as new special tokens.
*   Configuration of device-specific optimizations.
