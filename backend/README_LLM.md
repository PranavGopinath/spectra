# LLM Response Generation

The backend includes an open-source LLM for generating natural, contextual chat responses.

## Recommended Model: Llama 3.2 3B Instruct ⭐

**Current default**: `meta-llama/Llama-3.2-3B-Instruct`

### Why Llama 3.2 3B?
- ✅ **Best quality** for chat/instruct tasks (Meta's latest small model)
- ✅ **Laptop-friendly**: ~6GB RAM on CPU, ~4GB VRAM on GPU
- ✅ **Fast**: ~1-2 seconds per response on CPU
- ✅ **Free**: Open-source, no API costs
- ✅ **Great for conversation**: Specifically designed for chat applications

### Model Comparison

| Model | Size | RAM (CPU) | Quality | Speed | Best For |
|-------|------|-----------|---------|-------|----------|
| **Llama 3.2 3B** ⭐ | 3B | ~6GB | Excellent | Fast | **Chat/Conversation** |
| Qwen2.5 3B | 3B | ~6GB | Excellent | Fast | Multilingual |
| Phi-3-mini | 3.8B | ~7GB | Good | Fast | General purpose |
| Gemma 2 2B | 2B | ~4GB | Good | Very Fast | Low RAM systems |

## Installation

Required packages (already in `requirements.txt`):
```bash
pip install transformers torch accelerate huggingface_hub
```

## Setup

### 1. Get Hugging Face Token (for Llama models)

Llama models require a free Hugging Face account:

1. Sign up at https://huggingface.co
2. Get your token from https://huggingface.co/settings/tokens
3. Accept the model license: https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct

### 2. Set Environment Variable

```bash
export HUGGINGFACE_TOKEN="your_token_here"
```

Or add to `.env`:
```
HUGGINGFACE_TOKEN=your_token_here
```

### 3. First Run

On first run, the model downloads automatically (~6GB). This only happens once.

## Usage

The LLM loads automatically at server startup. If it fails (e.g., insufficient RAM), the system falls back to simple template responses.

### Change Model

Edit `response_generator.py`:

```python
# Best for chat (default)
ResponseGenerator("meta-llama/Llama-3.2-3B-Instruct")

# Alternative options
ResponseGenerator("Qwen/Qwen2.5-3B-Instruct")      # Great quality
ResponseGenerator("microsoft/Phi-3-mini-4k-instruct") # Good, slightly larger
ResponseGenerator("google/gemma-2-2b-it")           # Smaller/faster
```

## Performance Tips

### CPU Optimization
- Uses float32 by default (more compatible)
- First response may be slower (model loading)
- Subsequent responses are faster (~1-2s)

### GPU Optimization
- Automatically uses GPU if available
- Uses float16 for faster inference
- Much faster (~0.5s per response)

### Memory Optimization
If you have limited RAM, consider:
- Using `google/gemma-2-2b-it` (2B, ~4GB RAM)
- Using quantization (see transformers docs)
- Running on GPU instead of CPU

## API Endpoint

```
POST /api/generate-response
{
  "user_input": "I love dark psychological thrillers",
  "taste_analysis": { ... },
  "conversation_history": [ ... ]
}
```

Returns natural, contextual responses based on user input and taste profile.

## Fallback Behavior

If LLM fails to load or generate:
- Falls back to simple template responses
- No errors shown to users
- System continues working normally

This ensures the app works even without LLM resources.
