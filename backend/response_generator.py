"""Production-ready LLM response generator for Spectra recommendation system.

Demonstrates:
- LLM deployment and inference optimization
- GPU/CPU automatic detection and optimization
- Error handling and graceful degradation
- Production-ready logging and monitoring
- Integration with vector-based recommendation system
"""

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from typing import Dict, List, Optional
import logging
import time
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """Production-ready LLM response generator with error handling and optimization."""
    
    def __init__(self, model_name: str = None):
        """
        Initialize LLM with production-ready error handling and optimization.
        
        Args:
            model_name: Hugging Face model identifier. Defaults to Llama 3.2 3B.
        """
        self.model_name = model_name or "meta-llama/Llama-3.2-3B-Instruct"
        self.model = None
        self.tokenizer = None
        self.device = None
        self.is_loaded = False
        self.load_time = None
        
        try:
            self._load_model()
        except Exception as e:
            logger.error(f"Failed to load LLM: {e}")
            self.is_loaded = False
    
    def _load_model(self):
        """Load model with proper error handling and device optimization."""
        start_time = time.time()
        logger.info(f"Loading LLM model: {self.model_name}...")
        
        # Device detection
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        if self.device == "cuda":
            logger.info(f"GPU detected: {torch.cuda.get_device_name(0)}")
            logger.info(f"GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        else:
            logger.info("Using CPU (GPU not available)")
        
        # Hugging Face authentication
        hf_token = os.getenv("HUGGINGFACE_TOKEN")
        if hf_token:
            from huggingface_hub import login
            login(token=hf_token)
            logger.info("✓ Hugging Face token authenticated")
        
        # Load tokenizer
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            
            # Configure tokenizer for Llama 3.2
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                self.tokenizer.pad_token_id = self.tokenizer.eos_token_id
            
            logger.info("✓ Tokenizer loaded")
        except Exception as e:
            if "meta-llama" in self.model_name.lower() and ("gated" in str(e).lower() or "access" in str(e).lower()):
                logger.warning("Llama access not granted, falling back to Qwen2.5-3B-Instruct")
                self.model_name = "Qwen/Qwen2.5-3B-Instruct"
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_name,
                    trust_remote_code=True
                )
                if self.tokenizer.pad_token is None:
                    self.tokenizer.pad_token = self.tokenizer.eos_token
            else:
                raise
        
        # Load model with device-specific optimization
        try:
            if self.device == "cpu":
                # Use float16 on CPU to reduce memory usage (~3-4GB instead of ~6GB with float32)
                # Note: bitsandbytes quantization is GPU-only, so we use float16 for CPU
                logger.info("Loading model with float16 precision to reduce memory usage...")
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_name,
                    torch_dtype=torch.float16,
                    low_cpu_mem_usage=True,
                    trust_remote_code=True
                )
                self.model = self.model.to(self.device)
            else:
                # GPU optimization: use float16 and device_map
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_name,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    trust_remote_code=True
                )
            
            self.model.eval()
            self.is_loaded = True
            self.load_time = time.time() - start_time
            
            logger.info(f"✓ LLM model loaded successfully: {self.model_name}")
            logger.info(f"✓ Load time: {self.load_time:.2f}s")
            logger.info(f"✓ Device: {self.device}")
            
        except Exception as e:
            if "meta-llama" in self.model_name.lower() and ("gated" in str(e).lower() or "access" in str(e).lower()):
                logger.warning("Falling back to Qwen2.5-3B-Instruct")
                self.model_name = "Qwen/Qwen2.5-3B-Instruct"
                if self.device == "cpu":
                    # Use float16 for fallback model too (reduces memory)
                    self.model = AutoModelForCausalLM.from_pretrained(
                        self.model_name,
                        torch_dtype=torch.float16,
                        low_cpu_mem_usage=True,
                        trust_remote_code=True
                    )
                    self.model = self.model.to(self.device)
                else:
                    self.model = AutoModelForCausalLM.from_pretrained(
                        self.model_name,
                        torch_dtype=torch.float16,
                        device_map="auto",
                        trust_remote_code=True
                    )
                self.model.eval()
                self.is_loaded = True
                self.load_time = time.time() - start_time
                logger.info(f"✓ Fallback model loaded: {self.model_name}")
            else:
                raise
    
    def generate_intro(
        self,
        user_input: str,
        recommendations: Optional[Dict] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate a brief 1-2 sentence intro for recommendations.
        
        Args:
            user_input: User's query/preference description
            recommendations: Optional recommendations dict for context
            conversation_history: Optional conversation history
            
        Returns:
            Generated intro text (1-2 sentences)
        """
        if not self.is_loaded:
            logger.warning("LLM not loaded, using fallback intro")
            return self._fallback_intro(user_input)
        
        try:
            start_time = time.time()
            
            # Optimized prompt for brief intro generation
            system_prompt = """You are Spectra, a friendly taste discovery assistant. 
Generate a brief, natural 1-2 sentence introduction for recommendations.
Be conversational and reference the user's input naturally.
Keep it concise and engaging."""

            # Build messages
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history (last 2 messages for context)
            if conversation_history:
                messages.extend(conversation_history[-2:])
            
            # User message - focused on intro generation
            user_message = f"User said: \"{user_input}\"\n\nGenerate a brief 1-2 sentence intro introducing recommendations based on this."
            messages.append({"role": "user", "content": user_message})
            
            # Format prompt using chat template
            if hasattr(self.tokenizer, "apply_chat_template"):
                prompt = self.tokenizer.apply_chat_template(
                    messages,
                    tokenize=False,
                    add_generation_prompt=True
                )
            else:
                prompt = f"{system_prompt}\n\nUser: {user_input}\n\nAssistant:"
            
            # Tokenize
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=512  # Limit input length
            ).to(self.device)
            
            # Generate with optimized parameters for brief responses
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=80,  # Short intro (1-2 sentences)
                    temperature=0.8,    # Slightly higher for naturalness
                    top_p=0.95,         # Nucleus sampling
                    top_k=50,           # Top-k sampling
                    repetition_penalty=1.1,  # Prevent repetition
                    do_sample=True,
                    pad_token_id=self.tokenizer.pad_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                )
            
            # Decode response
            response = self.tokenizer.decode(
                outputs[0][inputs['input_ids'].shape[1]:],
                skip_special_tokens=True
            ).strip()
            
            # Clean up response
            response = self._clean_response(response)
            
            # Validate response quality
            if not self._validate_response(response):
                logger.warning("Generated response failed validation, using fallback")
                return self._fallback_intro(user_input)
            
            generation_time = time.time() - start_time
            logger.info(f"✓ Generated intro in {generation_time:.2f}s")
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating intro: {e}", exc_info=True)
            return self._fallback_intro(user_input)
    
    def generate_response(
        self,
        user_input: str,
        taste_analysis: Dict,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """
        Generate a contextual response based on user input and taste analysis.
        (Kept for backward compatibility)
        
        Args:
            user_input: The user's message
            taste_analysis: The taste analysis result with breakdown
            conversation_history: Previous messages in the conversation
            
        Returns:
            Generated response string
        """
        # Use generate_intro for consistency
        return self.generate_intro(
            user_input=user_input,
            recommendations=None,
            conversation_history=conversation_history
        )
    
    def _clean_response(self, response: str) -> str:
        """Clean up generated response."""
        # Remove common artifacts
        response = response.strip()
        
        # Remove repeated prompts
        if "Assistant:" in response:
            response = response.split("Assistant:")[-1].strip()
        
        # Remove quotes if entire response is quoted
        if response.startswith('"') and response.endswith('"'):
            response = response[1:-1]
        
        # Limit length (safety check)
        if len(response) > 300:
            # Take first sentence or two
            sentences = response.split('.')
            response = '. '.join(sentences[:2]) + '.'
        
        return response.strip()
    
    def _validate_response(self, response: str) -> bool:
        """Validate response quality."""
        if not response or len(response.strip()) < 10:
            return False
        if len(response) > 500:
            return False
        # Check for obvious errors
        if response.lower().startswith("i'm sorry") or "error" in response.lower():
            return False
        return True
    
    def _fallback_intro(self, user_input: str) -> str:
        """Fallback intro when LLM is unavailable."""
        # Simple template-based fallback
        keywords = self._extract_keywords(user_input)
        if keywords:
            return f"Based on your interest in {keywords[0]}, here are some recommendations:"
        return "Here are some recommendations based on your preferences:"
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract key words/phrases from user input."""
        # Simple keyword extraction (can be enhanced)
        words = text.lower().split()
        # Filter common words
        stop_words = {'i', 'love', 'like', 'enjoy', 'want', 'the', 'a', 'an', 'and', 'or', 'but'}
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        return keywords[:3]
    
    def get_status(self) -> Dict:
        """Get status information for monitoring."""
        return {
            "loaded": self.is_loaded,
            "model": self.model_name,
            "device": self.device,
            "load_time": self.load_time,
            "gpu_available": torch.cuda.is_available(),
        }
    
    def __del__(self):
        """Clean up resources."""
        if hasattr(self, 'model') and self.model is not None:
            del self.model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
