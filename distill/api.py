from contextlib import asynccontextmanager
from typing import List, Union, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from .distill import Distill
from loguru import logger
import os

# Global instance to hold the loaded model
distill_model: Optional[Distill] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager to load the Distill model on startup 
    and clean up on shutdown.
    """
    global distill_model
    # Allow configuration via environment variables, defaulting to local paths and mps
    model_path = os.getenv("DISTILL_MODEL_PATH", "./models")
    device = os.getenv("DISTILL_DEVICE", "mps")
    
    logger.info(f"Loading Distill model from {model_path} on {device}...")
    try:
        distill_model = Distill(model_name=model_path, device_map=device)
        logger.info("Distill model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load Distill model: {e}")
        # We might want to raise here to prevent app from starting if model fails
        raise e
    
    yield
    
    logger.info("Shutting down Distill app...")
    distill_model = None

app = FastAPI(lifespan=lifespan, title="Distill API")

class CompressPromptRequest(BaseModel):
    """
    Request model for compress_prompt endpoint.
    Mirrors arguments of Distill.compress_prompt.
    """
    context: Union[List[str], str] = Field(..., description="The prompt context to compress. Can be a string or list of strings.")
    rate: float = Field(0.5, description="Compression rate.")
    target_token: int = Field(-1, description="Target token count. If > 0, overrides rate.")
    use_context_level_filter: bool = False
    use_token_level_filter: bool = True
    target_context: int = -1
    context_level_rate: float = 1.0
    context_level_target_token: int = -1
    force_context_ids: List[int] = Field(default_factory=list)
    return_word_label: bool = False
    word_sep: str = "\t\t|\t\t"
    label_sep: str = " "
    token_to_word: str = "mean"
    force_tokens: List[str] = Field(default_factory=list)
    force_reserve_digit: bool = False
    drop_consecutive: bool = False
    chunk_end_tokens: List[str] = Field(default_factory=lambda: [".", "\n"])

@app.post("/compress_prompt")
async def compress_prompt_endpoint(request: CompressPromptRequest):
    """
    Endpoint to compress a prompt using the loaded Distill model.
    """
    if distill_model is None:
        raise HTTPException(status_code=503, detail="Distill model is not initialized.")

    try:
        # Convert request model to dictionary
        params = request.model_dump()
        
        # Call the compress_prompt method
        # Note: compress_prompt is synchronous. 
        # Since it might be CPU intensive (inference), ideally it should run in a threadpool 
        # if it blocks for too long, but for simplicity we call it directly here.
        # FastAPI runs non-async defs in a threadpool, but we defined this as async def 
        # because we are calling model_dump (fast) and maybe other async things. 
        # However, distill.compress_prompt is blocking.
        # To avoid blocking the event loop, we should technically use run_in_executor or define this as 'def'.
        # But let's check distill.py. It uses torch, which releases GIL often, but it's still heavy.
        # Let's switch to 'def' (non-async) for the path operation to let FastAPI run it in a threadpool.
        pass 
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return distill_model.compress_prompt(**params)

# Redefining to remove async and let FastAPI handle threading for the blocking call
@app.post("/compress_prompt")
def compress_prompt_endpoint_sync(request: CompressPromptRequest):
    if distill_model is None:
        raise HTTPException(status_code=503, detail="Distill model is not initialized.")

    try:
        params = request.model_dump()
        result = distill_model.compress_prompt(**params)
        return result
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))