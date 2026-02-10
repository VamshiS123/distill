# System Architecture

Distill is built as a modular system designed for high-throughput prompt compression. The architecture is split between a high-performance Python backend and a modern React frontend for visualization.

## High-Level Flow

1.  **Ingestion**: The system receives a raw text prompt or a list of context strings.
2.  **Preprocessing**: Text is chunked based on maximum sequence lengths and special "anchor" tokens (e.g., newlines).
3.  **Inference**: A BERT-based Token Classification model evaluates the "Information Density" of every token.
4.  **Compression Pipeline**:
    *   **Context Filtering**: Entire irrelevant chunks are discarded.
    *   **Token Pruning**: Individual tokens within chunks are removed based on percentile thresholds.
5.  **Reconstruction**: The remaining tokens are re-joined into a coherent (though "lossy") prompt.
6.  **Delivery**: The compressed prompt is sent to a target LLM (like GPT-4), or returned via API.

## Component Map

### Backend (`/backend`)
*   **Core Engine**: The `distill` package contains the logic for inference and pruning.
*   **API Layer**: FastAPI provides endpoints for remote compression services.
*   **Models**: Local storage for the fine-tuned BERT weights and configuration.

### Frontend (`/frontend`)
*   **Dashboard**: A React application that visualizes compression ratios, latency improvements, and cost savings.
*   **Demo**: An interactive interface to test the compression algorithm in real-time.

## Data Flow Diagram

```text
[ User Input ] --> [ API / CLI ] 
                       |
                       v
               [ Chunking Logic ] <--- [ Tiktoken ]
                       |
                       v
               [ BERT Inference ] <--- [ Local Weights ]
                       |
                       v
             [ Two-Tier Filtering ]
             /                  
    [ Context Filter ]    [ Token Filter ]
             \                  /
                       v
               [ Prompt Assembly ]
                       |
                       v
               [ Target LLM / Output ]
```
