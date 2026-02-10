# Distill: Radical Context Efficiency

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Platform: Apple Silicon](https://img.shields.io/badge/platform-Apple%20Silicon-orange.svg)]()

**Distill** is a high-performance LLM input compression library designed to overcome the "Context Wall." By leveraging a specialized Transformer-based classification model, Distill prunes the least significant tokens from your prompts, enabling massive context scaling, reduced latency, and significantly lower inference costs—all with minimal impact on accuracy.

---

## The Vision

As LLM context windows expand to millions of tokens, the "Quadratic Cost" of attention becomes a hardware bottleneck. Distill brings **Intelligent Lossy Compression** to text. Much like JPEG revolutionized image storage by removing imperceptible data, Distill removes "semantic noise" from LLM prompts, ensuring that only the most information-dense tokens are sent to the target model.

---

## Technical Architecture

Distill doesn't rely on simple regex or basic entropy models. It employs a **BERT-based Token Classification** architecture to evaluate the importance of every word in context.

### The Pipeline
1.  **Importance Scoring**: A `bert-base-multilingual-cased` model, fine-tuned for token classification, performs a single forward pass over the input. It assigns an "importance probability" to every token.
2.  **Word-Level Aggregation**: Sub-token probabilities are merged into word-level scores (using `mean` or `first` strategies). This prevents "partial-word pruning" that can lead to LLM hallucinations.
3.  **Two-Tier Filtering**:
    *   **Context-Level Filter**: Entire chunks of text (e.g., irrelevant paragraphs) are scored and removed if they fall below a dynamic threshold.
    *   **Token-Level Filter**: Within the remaining chunks, individual tokens are pruned to hit a specific `reduce_rate` or `target_token` budget.
4.  **Constraint Preservation**: Critical structural elements (newlines, question marks, numbers) and user-defined "force tokens" are locked with a $P=1.0$, ensuring the prompt's intent and formatting remain intact.
5.  **Reconstruction**: The remaining tokens are re-assembled using `tiktoken` (o100k_base) to ensure exact compatibility with models like GPT-4o and Claude 3.5.

---

## Benchmarks (LongBench V2)

Evaluated on 230 high-entropy samples from the **LongBench V2** suite (32K–128K tokens) using `gpt-4o-mini` as the target LLM.

| Metric | Baseline (Raw) | **Distill (Ours)** | Improvement |
| :--- | :--- | :--- | :--- |
| **Accuracy (EM)** | 30.67% | **29.34%** | -1.3% (Negligible) |
| **Avg. Tokens** | 46,043 | **14,733** | **-68.0%** |
| **Input Cost ($)** | $0.0069 | **$0.0022** | **-68.0%** |
| **Total Latency** | 12.06s | **7.60s** | **-37.0%** |

*Hardware: Apple Silicon M3 (MPS) | FP16 Inference*

---

## Documentation

For a more detailed breakdown of the system architecture, backend components, and compression algorithms, please refer to the [documentation index](docs/README.md).

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Backend Components](docs/BACKEND_COMPONENTS.md)
- [Compression Logic](docs/COMPRESSION_LOGIC.md)
- [API Reference](docs/API_REFERENCE.md)

---

## Project Structure

```text
├── backend/
│   ├── distill/
│   │   ├── core_compression.py  # Pruning & thresholding logic
│   │   ├── pipeline.py          # Two-tier filtering orchestration
│   │   ├── inference.py         # BERT forward pass & probability generation
│   │   ├── token_ops.py         # Token-to-word merging & force-token logic
│   │   └── api.py               # FastAPI server implementation
│   ├── models/                  # Fine-tuned BERT weights & configs
│   └── main.py                  # Demo & CLI entry point
└── frontend/                    # React/Tailwind dashboard for visualization
```

---

## Getting Started

### Prerequisites
- Python 3.12+
- PyTorch (MPS/CUDA supported)
- `uv` for lightning-fast dependency management

### Setup
1. **Clone and Install**:
   ```bash
   git clone https://github.com/your-username/distill.git
   cd distill/backend
   uv sync
   ```

2. **Configure Environment**:
   ```bash
   export TTC_API_KEY="your_key" # Optional for TTC comparison
   ```

### Basic Usage

```python
from distill import Distill

# Initialize with local BERT model
compressor = Distill(model_name="./models", device_map="mps")

prompt = ["Your massive context goes here..."]

# Compress to 30% of original size while keeping newlines and '?'
result = compressor.compress_prompt(
    prompt, 
    rate=0.3, 
    force_tokens=['\n', '?']
)

print(f"Compressed: {result['compressed_prompt']}")
print(f"Tokens Saved: {result['origin_tokens'] - result['compressed_tokens']}")
```

---

## Recovery Mode
Distill includes a `recovery.py` module that allows you to map LLM responses from a compressed prompt back to the original context, ensuring that citations and references remain accurate despite the lossy compression.

---

## License
MIT License. See [LICENSE](LICENSE) for details.
