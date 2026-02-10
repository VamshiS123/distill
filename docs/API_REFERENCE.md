# API Reference

Distill provides a high-performance REST API built with FastAPI.

## `POST /compress_prompt`

The primary endpoint for compressing text prompts.

### Request Body
```json
{
  "context": ["String or List of strings to compress"],
  "rate": 0.5,
  "target_token": -1,
  "use_context_level_filter": false,
  "use_token_level_filter": true,
  "force_tokens": ["
", "?"],
  "force_reserve_digit": false,
  "drop_consecutive": false
}
```

### Response Schema
```json
{
  "compressed_prompt": "The resulting compressed text...",
  "compressed_prompt_list": ["List", "of", "chunks"],
  "origin_tokens": 1024,
  "compressed_tokens": 512,
  "ratio": "2.0x",
  "rate": "50.0%",
  "saving": "Estimates in USD for GPT-4"
}
```

## `POST /recover`

Maps an LLM response back to the original context. Useful for citation accuracy.

### Request Body
```json
{
  "original_prompt": "The full original text...",
  "compressed_prompt": "The text as sent to the LLM...",
  "response": "The LLM's answer..."
}
```

## `GET /health`
Returns the status of the BERT model and the current device (CPU/CUDA/MPS).
