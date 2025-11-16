"""LLM-based response generator for chat interface using open-source models."""

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """Generates contextual responses using a local open-source LLM."""
    
    def __init__(self, model_name: str = None):
        """
        Initialize the response generator with a small open-source LLM.
        
        If model_name is None, tries models in order:
        1. meta-llama/Llama-3.2-3B-Instruct (requires approval, best quality)
        2. Qwen/Qwen2.5-3B-Instruct (no approval needed, great quality) ⭐ FALLBACK
        3. microsoft/Phi-3-mini-4k-instruct (no approval needed, good quality)
        
        Recommended models (best to worst for chat quality):
        - meta-llama/Llama-3.2-3B-Instruct (3B, ~6GB RAM) ⭐ BEST - Requires approval
        - Qwen/Qwen2.5-3B-Instruct (3B, ~6GB RAM) ⭐ NO APPROVAL - Great quality, multilingual
        - microsoft/Phi-3-mini-4k-instruct (3.8B, ~7GB RAM) - No approval needed
        - google/gemma-2-2b-it (2B, ~4GB RAM) - Smaller/faster, good for low RAM
        
        For laptops, Llama 3.2 3B offers the best quality/size balance.
        """
        # Auto-select model: try Llama first, fallback to Qwen if access not granted
        if model_name is None:
            # Check if we have Llama access by trying to load it
            model_name = "meta-llama/Llama-3.2-3B-Instruct"
            # Will fallback to Qwen if Llama fails
        logger.info(f"Loading LLM model: {model_name}...")
        
        # Use CPU or GPU if available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # Load tokenizer and model
        # Use token from environment if needed (for gated models like Llama)
        from huggingface_hub import login
        import os
        
        # Check if HF token is set (needed for some models)
        hf_token = os.getenv("HUGGINGFACE_TOKEN")
        if hf_token:
            login(token=hf_token)
        
        # Try to load the model, fallback to Qwen if Llama access not granted
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        except Exception as e:
            if "meta-llama" in model_name.lower() and ("gated" in str(e).lower() or "access" in str(e).lower()):
                logger.warning(f"Llama access not granted yet, falling back to Qwen2.5-3B-Instruct")
                model_name = "Qwen/Qwen2.5-3B-Instruct"
                self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            else:
                raise
        
        # Load model optimized for device
        try:
            if self.device == "cpu":
                # Use float32 on CPU (more compatible, stable)
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=True,
                    trust_remote_code=True
                )
            else:
                # Use float16 on GPU for speed
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    trust_remote_code=True
                )
            
            if self.device == "cpu":
                self.model = self.model.to(self.device)
            
            self.model.eval()  # Set to evaluation mode
            logger.info(f"✓ LLM model loaded successfully: {model_name}")
        except Exception as e:
            if "meta-llama" in model_name.lower() and ("gated" in str(e).lower() or "access" in str(e).lower()):
                logger.warning(f"Llama access not granted yet, falling back to Qwen2.5-3B-Instruct")
                model_name = "Qwen/Qwen2.5-3B-Instruct"
                self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
                if self.device == "cpu":
                    self.model = AutoModelForCausalLM.from_pretrained(
                        model_name,
                        torch_dtype=torch.float32,
                        low_cpu_mem_usage=True,
                        trust_remote_code=True
                    )
                else:
                    self.model = AutoModelForCausalLM.from_pretrained(
                        model_name,
                        torch_dtype=torch.float16,
                        device_map="auto",
                        trust_remote_code=True
                    )
                if self.device == "cpu":
                    self.model = self.model.to(self.device)
                self.model.eval()
                logger.info(f"✓ Fallback LLM model loaded: {model_name}")
            else:
                raise
    
    def generate_response(
        self,
        user_input: str,
        taste_analysis: Dict,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """
        Generate a contextual response based on user input and taste analysis.
        
        Args:
            user_input: The user's message
            taste_analysis: The taste analysis result with breakdown
            conversation_history: Previous messages in the conversation
        
        Returns:
            Generated response string
        """
        # Build system prompt
        system_prompt = """You are Spectra, a friendly and knowledgeable taste discovery assistant. 
You help users discover movies, music, and books based on their aesthetic preferences.

You analyze user preferences across 8 dimensions:
1. Emotional Tone (dark/melancholic ↔ light/joyful)
2. Energy & Intensity (calm/gentle ↔ intense/powerful)
3. Complexity (simple/minimalist ↔ complex/layered)
4. Abstractness (concrete/literal ↔ abstract/symbolic)
5. Aesthetic Style (raw/gritty ↔ polished/refined)
6. Intellectualism (intuitive/visceral ↔ cerebral/analytical)
7. Conventionality (traditional/familiar ↔ experimental/avant-garde)
8. Worldview (cynical/dark ↔ hopeful/optimistic)

Be conversational, friendly, and insightful. Reference specific dimensions when relevant.
Keep responses concise (2-3 sentences max) and natural."""

        # Format taste analysis for context
        top_dimensions = sorted(
            taste_analysis['breakdown'],
            key=lambda x: abs(x['score']),
            reverse=True
        )[:3]
        
        taste_context = "User's taste profile:\n"
        for dim in top_dimensions:
            taste_context += f"- {dim['dimension']}: {dim['tendency']} (score: {dim['score']:.2f})\n"
        
        # Build conversation context
        messages = [
            {"role": "system", "content": system_prompt},
        ]
        
        # Add conversation history if available
        if conversation_history:
            messages.extend(conversation_history[-4:])  # Last 4 messages for context
        
        # Add current user input and taste context
        user_message = f"{user_input}\n\n{taste_context}\n\nGenerate a friendly, contextual response (2-3 sentences) that acknowledges their input and introduces their taste profile."
        messages.append({"role": "user", "content": user_message})
        
        # Format for the model
        if hasattr(self.tokenizer, "apply_chat_template"):
            # Use chat template if available
            prompt = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
        else:
            # Fallback formatting
            prompt = f"{system_prompt}\n\nUser: {user_input}\n\n{taste_context}\n\nAssistant:"
        
        # Tokenize
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=150,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        # Decode response
        response = self.tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        
        # Clean up response
        response = response.strip()
        
        # Remove any repeated prompts or artifacts
        if "Assistant:" in response:
            response = response.split("Assistant:")[-1].strip()
        
        return response
    
    def __del__(self):
        """Clean up model on deletion."""
        if hasattr(self, 'model'):
            del self.model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

