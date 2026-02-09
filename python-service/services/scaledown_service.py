"""
ScaleDown LLM Prompt Compression Service

Integrates ScaleDown for reducing token usage in LLM prompts while
preserving semantic quality. Used by agents to compress:
- Meeting descriptions and context
- Agent reasoning and intermediate results
- Large participant availability data

Benefits:
- 60-80% reduction in token usage
- Lower LLM API costs
- Faster response times
- Preserved semantic accuracy
"""

import os
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# ScaleDown configuration
SCALEDOWN_API_KEY = os.getenv("SCALEDOWN_API_KEY")
SCALEDOWN_ENABLE = os.getenv("SCALEDOWN_ENABLE", "true").lower() == "true"

# Lazy import to avoid errors if ScaleDown not installed
_scaledown_compressor = None


def _get_compressor():
    """Lazy initialization of ScaleDown compressor"""
    global _scaledown_compressor
    
    if _scaledown_compressor is None:
        try:
            from scaledown import ScaleDownCompressor
            
            if not SCALEDOWN_API_KEY:
                logger.warning("SCALEDOWN_API_KEY not configured. Compression disabled.")
                return None
            
            _scaledown_compressor = ScaleDownCompressor(
                api_key=SCALEDOWN_API_KEY,
                target_model='gpt-4o',  # Optimize for GPT-4
                rate='auto',  # Let ScaleDown determine optimal compression
                preserve_keywords=True  # Keep domain-specific terms
            )
            
            logger.info("✅ ScaleDown compressor initialized")
            
        except ImportError:
            logger.warning("ScaleDown not installed. Run: pip install scaledown")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize ScaleDown: {e}")
            return None
    
    return _scaledown_compressor


def is_enabled() -> bool:
    """Check if ScaleDown compression is enabled and configured"""
    return SCALEDOWN_ENABLE and SCALEDOWN_API_KEY is not None


def compress_prompt(
    context: str,
    prompt: str,
    max_tokens: Optional[int] = None
) -> Dict[str, Any]:
    """
    Compress a prompt using ScaleDown
    
    Args:
        context: Background information to compress (e.g., meeting details, availability)
        prompt: The user query or instruction (preserved)
        max_tokens: Optional strict token limit
    
    Returns:
        dict with:
            - content: Compressed text
            - compressed: Whether compression was applied
            - original_tokens: Token count before compression
            - compressed_tokens: Token count after compression
            - compression_ratio: Ratio achieved (e.g., 0.65 = 65% compression)
            - latency_ms: Processing time
    """
    if not is_enabled():
        logger.debug("ScaleDown disabled. Returning original content.")
        return {
            "content": f"{context}\n\n{prompt}",
            "compressed": False,
            "original_tokens": len(context.split()) + len(prompt.split()),
            "compressed_tokens": len(context.split()) + len(prompt.split()),
            "compression_ratio": 0.0,
            "latency_ms": 0
        }
    
    compressor = _get_compressor()
    if not compressor:
        logger.warning("Compressor not available. Returning original content.")
        return {
            "content": f"{context}\n\n{prompt}",
            "compressed": False,
            "original_tokens": len(context.split()) + len(prompt.split()),
            "compressed_tokens": len(context.split()) + len(prompt.split()),
            "compression_ratio": 0.0,
            "latency_ms": 0
        }
    
    try:
        # Compress using ScaleDown
        result = compressor.compress(
            context=context,
            prompt=prompt,
            max_tokens=max_tokens
        )
        
        logger.info(f"✅ ScaleDown compression: {result.tokens[0]} → {result.tokens[1]} tokens ({result.savings_percent:.1f}% saved)")
        
        return {
            "content": result.content,
            "compressed": True,
            "original_tokens": result.tokens[0],
            "compressed_tokens": result.tokens[1],
            "compression_ratio": result.compression_ratio,
            "savings_percent": result.savings_percent,
            "latency_ms": result.latency_ms
        }
        
    except Exception as e:
        logger.error(f"❌ ScaleDown compression failed: {e}")
        # Fallback to original content
        return {
            "content": f"{context}\n\n{prompt}",
            "compressed": False,
            "original_tokens": len(context.split()) + len(prompt.split()),
            "compressed_tokens": len(context.split()) + len(prompt.split()),
            "compression_ratio": 0.0,
            "latency_ms": 0,
            "error": str(e)
        }


def compress_text(text: str, max_tokens: Optional[int] = None) -> Dict[str, Any]:
    """
    Compress arbitrary text using ScaleDown
    
    Useful for compressing:
    - Agent reasoning chains
    - Meeting descriptions
    - Large availability summaries
    
    Args:
        text: Text to compress
        max_tokens: Optional strict token limit
    
    Returns:
        Same format as compress_prompt()
    """
    # For single text, treat as context with empty prompt
    return compress_prompt(context=text, prompt="", max_tokens=max_tokens)


def get_compression_stats() -> Dict[str, Any]:
    """Get ScaleDown compression statistics"""
    compressor = _get_compressor()
    
    return {
        "enabled": is_enabled(),
        "configured": SCALEDOWN_API_KEY is not None,
        "compressor_available": compressor is not None,
        "target_model": "gpt-4o",
        "compression_mode": "auto"
    }
