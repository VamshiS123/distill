from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException
from loguru import logger
import os

from .distill import Distill
from .schemas import CompressPromptRequest

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

@app.post("/compress_prompt")
def compress_prompt_endpoint(request: CompressPromptRequest):
    """
    Endpoint to compress a prompt using the loaded Distill model.
    """
    if distill_model is None:
        raise HTTPException(status_code=503, detail="Distill model is not initialized.")

    try:
        params = request.model_dump()
        result = distill_model.compress_prompt(**params)
        return result
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
