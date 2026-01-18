import os
import json
import random
import tiktoken
import time
from datasets import load_dataset
from loguru import logger
from distill import Distill
from openai import OpenAI
from dotenv import load_dotenv

# Configuration
LIMIT_TOKENS = 100000
SAMPLE_SIZE = 50
RETENTION_RATE = 0.5  # Distill 'rate' keeps this % of tokens
MODEL_NAME = "gpt-4o-mini"
SEED = 42

# GPT-4o-mini Pricing ($0.15 per 1M input tokens)
PRICE_PER_1M_INPUT = 0.15

random.seed(SEED)

def get_token_count(text):
    enc = tiktoken.encoding_for_model(MODEL_NAME)
    return len(enc.encode(text, disallowed_special=()))

def format_prompt(example, context_override=None):
    context = context_override if context_override is not None else example['context']
    prompt = f"Context:\n{context}\n\nQuestion: {example['question']}\n"
    prompt += f"A) {example['choice_A']}\n"
    prompt += f"B) {example['choice_B']}\n"
    prompt += f"C) {example['choice_C']}\n"
    prompt += f"D) {example['choice_D']}\n"
    prompt += "\nAnswer:"
    return prompt

def get_llm_answer(client, prompt, retries=3):
    start_time = time.perf_counter()
    for i in range(retries):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant. Answer the multiple choice question with only the letter of the correct option (A, B, C, or D)."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0,
                max_tokens=1
            )
            duration = time.perf_counter() - start_time
            return response.choices[0].message.content.strip().upper(), duration
        except Exception as e:
            logger.error(f"LLM Error (Attempt {i+1}): {e}")
            time.sleep(2 ** i)
    return None, 0

def main():
    load_dotenv()
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY is not set. Please set it in .env or environment.")
        return

    logger.info("Loading LongBench v2 dataset...")
    ds = load_dataset("THUDM/LongBench-v2", split="train")
    
    logger.info("Filtering and sampling dataset...")
    examples_with_counts = []
    for ex in ds:
        count = get_token_count(ex['context'])
        if count <= LIMIT_TOKENS:
            examples_with_counts.append(ex)
    
    if len(examples_with_counts) > SAMPLE_SIZE:
        sampled_ds = random.sample(examples_with_counts, SAMPLE_SIZE)
    else:
        sampled_ds = examples_with_counts
    
    logger.info(f"Sampled {len(sampled_ds)} examples under {LIMIT_TOKENS} tokens.")

    # Initialize Compressor and Client
    distill = Distill(model_name="./models", device_map="mps")
    openai_client = OpenAI()

    # Metrics Storage
    results = {
        "baseline": {"correct": 0, "total": 0, "tokens": 0, "inf_time": 0},
        "distill":  {"correct": 0, "total": 0, "tokens": 0, "comp_time": 0, "inf_time": 0}
    }

    output_file = "benchmark_results.jsonl"
    report_file = "benchmark_report.txt"

    # Clear previous results file
    open(output_file, 'w').close()

    for i, ex in enumerate(sampled_ds):
        logger.info(f"Processing example {i+1}/{len(sampled_ds)} (ID: {ex['_id']})")
        
        row_data = {"id": ex['_id'], "answer": ex['answer']}

        # --- 1. Baseline ---
        baseline_prompt = format_prompt(ex)
        baseline_tokens = get_token_count(baseline_prompt)
        logger.debug(f"Baseline Tokens: {baseline_tokens}")
        
        baseline_ans, baseline_inf_time = get_llm_answer(openai_client, baseline_prompt)
        logger.debug(f"Baseline Answer: {baseline_ans}, Time: {baseline_inf_time:.2f}s")
        
        if baseline_ans:
            if baseline_ans == ex['answer']:
                results['baseline']['correct'] += 1
            results['baseline']['total'] += 1
            results['baseline']['tokens'] += baseline_tokens
            results['baseline']['inf_time'] += baseline_inf_time
            row_data['baseline'] = baseline_ans

        # --- 2. Distill ---
        try:
            # Compression (Retention Rate)
            t0 = time.perf_counter()
            distill_res = distill.compress_prompt([ex['context']], rate=RETENTION_RATE)
            dist_comp_time = time.perf_counter() - t0
            logger.debug(f"Distill Compression Time: {dist_comp_time:.2f}s (Rate: {RETENTION_RATE})")
            
            # Inference with compressed context
            dist_context = distill_res['compressed_prompt']
            dist_prompt = format_prompt(ex, context_override=dist_context)
            dist_tokens = get_token_count(dist_prompt)
            logger.debug(f"Distill Tokens: {dist_tokens}")

            dist_ans, dist_inf_time = get_llm_answer(openai_client, dist_prompt)
            logger.debug(f"Distill Answer: {dist_ans}, Time: {dist_inf_time:.2f}s")
            
            if dist_ans:
                if dist_ans == ex['answer']:
                    results['distill']['correct'] += 1
                results['distill']['total'] += 1
                results['distill']['tokens'] += dist_tokens
                results['distill']['comp_time'] += dist_comp_time
                results['distill']['inf_time'] += dist_inf_time
                row_data['distill'] = dist_ans
        except Exception as e:
            logger.error(f"Distill Error on {ex['_id']}: {e}")

        # Save result for this row
        with open(output_file, "a") as f:
            f.write(json.dumps(row_data) + "\n")

        # Periodic status logging
        if (i + 1) % 5 == 0:
            logger.info(f"Progress: {i+1}/{len(sampled_ds)} iterations completed")

    # --- Generate Final Report ---
    logger.info("Generating Final Report...")
    
    with open(report_file, "w") as f:
        header = f"LongBench v2 Benchmark: Distill vs Baseline (Model: {MODEL_NAME})\n"
        header += "=" * 65 + "\n"
        f.write(header)
        logger.info(header.strip())

        for key, stats in results.items():
            if stats['total'] == 0:
                continue
            
            # Aggregate stats
            accuracy = (stats['correct'] / stats['total']) * 100
            avg_tokens = stats['tokens'] / stats['total']
            avg_inf_time = stats['inf_time'] / stats['total']
            avg_comp_time = stats.get('comp_time', 0) / stats['total']
            total_latency = avg_comp_time + avg_inf_time
            avg_cost = (avg_tokens / 1_000_000) * PRICE_PER_1M_INPUT
            
            # Retention percentage relative to uncompressed
            baseline_avg_tokens = results['baseline']['tokens'] / max(1, results['baseline']['total'])
            retention_pct = (avg_tokens / baseline_avg_tokens) * 100
            
            report = f"\n[{key.upper()}]\n"
            report += f"  Accuracy:          {accuracy:.2f}%\n"
            report += f"  Avg Tokens:        {avg_tokens:.0f} ({retention_pct:.1f}% of baseline)\n"
            report += f"  Avg Cost:          ${avg_cost:.6f}\n"
            report += f"  Avg Comp Time:     {avg_comp_time:.2f}s\n"
            report += f"  Avg Inf Time:      {avg_inf_time:.2f}s\n"
            report += f"  Avg Total Latency: {total_latency:.2f}s\n"
            
            f.write(report)
            logger.info(report.strip())

if __name__ == "__main__":
    main()