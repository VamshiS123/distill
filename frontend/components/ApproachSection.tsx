
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronDown, ChevronUp, Code2, Cpu, Zap, Share2 } from 'lucide-react';

export default function ApproachSection() {
  const [showCode, setShowCode] = useState(false);
  
  return (
    <section className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-sm border border-[#27272a] overflow-hidden">
      <div className="p-10 border-b border-[#27272a] bg-white/5">
        <h2 className="text-3xl font-bold text-white mb-4">The Information-Theoretic Approach</h2>
        <p className="text-lg text-[#a1a1aa] max-w-4xl leading-relaxed">
          While other approaches focus on <em>importance</em> weighting (identifying which tokens "seem" useful to the model), Distill focuses on <strong>information density</strong>. We calculate the conditional entropy of every token given its context window, identifying redundant signals that carry zero net-new information.
        </p>
      </div>
      
      <div className="p-10">
        {/* Architecture Flow */}
        <div className="mb-16">
          <h3 className="text-sm font-black text-[#a1a1aa] uppercase tracking-widest mb-8 text-center">Inference Architecture</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <ArchBlock icon={<Code2 />} title="Input" sub="Raw Sequence" />
            <ArchArrow />
            <ArchBlock icon={<Cpu />} title="Entropy Estimator" sub="7B Transformer" highlight />
            <ArchLoop />
            <ArchBlock icon={<Zap />} title="Token Scorer" sub="H(t | Context)" />
            <ArchArrow />
            <ArchBlock icon={<Share2 />} title="Output" sub="Dense Prompt" success />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <InnovationCard 
            title="Entropy-Based Selection" 
            desc="We compute the Shannon entropy of each token. Tokens that are highly predictable based on the preceding sequence are pruned first, as they contribute the least amount of surprise to the model's latent state."
          />
          <InnovationCard 
            title="Contextual Persistence" 
            desc="Unlike static pruning, Distill maintains 'Anchor Tokens', low-probability, high-entropy tokens that serve as semantic pivots, ensuring the compressed prompt remains logically coherent for the target LLM."
          />
          <InnovationCard 
            title="Iterative Refinement Loop" 
            desc="The Entropy Estimator and Token Scorer form a feedback loop that continuously refines the token selection. This iterative process keeps stripping redundant tokens until only Anchor Tokens, low-probability, high-entropy semantic pivots, remain, ensuring maximum compression while preserving logical coherence."
          />
        </div>

        <button 
          onClick={() => setShowCode(!showCode)}
          className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/15 transition shadow-lg border border-[#27272a]"
        >
          {showCode ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          {showCode ? 'Close Technical Implementation' : 'View Code Implementation'}
        </button>

        {showCode && (
          <div className="mt-6 bg-[#0D1117] rounded-2xl overflow-hidden border border-[#27272a] animate-fade-in shadow-2xl">
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '2rem', fontSize: '13px', lineHeight: '1.625' }}
              wrapLines={true}
            >
              {`
def compress_prompt_pipeline(
    context,
    model,
    tokenizer,
    device,
    oai_tokenizer,
    max_seq_len,
    max_batch_size,
    max_force_token,
    special_tokens,
    added_tokens,
    model_name,
    rate: float = 0.5,
    target_token: int = -1,
    use_context_level_filter: bool = False,
    use_token_level_filter: bool = True,
    target_context: int = -1,
    context_level_rate: float = 1.0,
    context_level_target_token: int = -1,
    force_context_ids: List[int] = [],
    return_word_label: bool = False,
    word_sep: str = "\t\t|\t\t",
    label_sep: str = " ",
    token_to_word: str = "mean",
    force_tokens: List[str] = [],
    force_reserve_digit: bool = False,
    drop_consecutive: bool = False,
    chunk_end_tokens: List[str] = [".", "\n"],
):
    logger.info(
        f"Compressing prompt. Context chunks: {len(context) if isinstance(context, list) else 1}, Rate: {rate}, Target Token: {target_token}"
    )
    assert len(force_tokens) <= max_force_token
    token_map = {}
    for i, t in enumerate(force_tokens):
        if len(tokenizer.tokenize(t)) != 1:
            token_map[t] = added_tokens[i]
    chunk_end_tokens = copy.deepcopy(chunk_end_tokens)
    for c in chunk_end_tokens:
        if c in token_map:
            chunk_end_tokens.append(token_map[c])
    chunk_end_tokens = set(chunk_end_tokens)

    if type(context) == str:
        context = [context]
    context = copy.deepcopy(context)

    if len(context) == 1 and use_context_level_filter:
        use_context_level_filter = False
        logger.debug("Context level filter disabled because context length is 1.")

    n_original_token = 0
    context_chunked = []
    for i in range(len(context)):
        n_original_token += get_token_length(
            context[i], tokenizer=None, use_oai_tokenizer=True, oai_tokenizer=oai_tokenizer
        )
        for ori_token, new_token in token_map.items():
            context[i] = context[i].replace(ori_token, new_token)
        context_chunked.append(
            chunk_context(context[i], chunk_end_tokens=chunk_end_tokens, tokenizer=tokenizer, max_seq_len=max_seq_len)
        )

    logger.info(f"Original token count: {n_original_token}")

    if use_context_level_filter:
        logger.debug("Applying context level filter.")
        if (
                target_context <= 0
                and context_level_rate >= 1.0
                and context_level_target_token <= 0
        ):
            if target_token < 0 and rate < 1.0:
                context_level_rate = (
                    (rate + 1.0) / 2 if use_token_level_filter else rate
                )
            if target_token >= 0:
                context_level_target_token = (
                    target_token * 2 if use_token_level_filter else target_token
                )

        if target_context >= 0:
            context_level_rate = min(target_context / len(context), 1.0)
        if context_level_target_token >= 0:
            context_level_rate = min(
                context_level_target_token / n_original_token, 1.0
            )

        logger.debug(f"Calculating context probabilities. context_level_rate={context_level_rate}")
        context_probs, context_words = compute_context_probs(
            context_chunked,
            model=model,
            tokenizer=tokenizer,
            device=device,
            max_seq_len=max_seq_len,
            max_batch_size=max_batch_size,
            special_tokens=special_tokens,
            model_name=model_name,
            token_to_word=token_to_word,
            force_tokens=force_tokens,
            token_map=token_map,
            force_reserve_digit=force_reserve_digit,
        )

        threshold = np.percentile(
            context_probs, int(100 * (1 - context_level_rate))
        )
        logger.debug(f"Context probability threshold: {threshold}")

        reserved_context = []
        context_label = [False] * len(context_probs)
        for i, p in enumerate(context_probs):
            if p >= threshold or (
                    force_context_ids is not None and i in force_context_ids
            ):
                reserved_context.append(context_chunked[i])
                context_label[i] = True

        n_reserved_token = 0
        for chunks in reserved_context:
            for c in chunks:
                n_reserved_token += get_token_length(c, tokenizer=None, use_oai_tokenizer=True, oai_tokenizer=oai_tokenizer)

        logger.info(f"Tokens after context filtering: {n_reserved_token}")

        if target_token >= 0:
            rate = min(target_token / n_reserved_token, 1.0)

        if use_token_level_filter:
            logger.debug("Applying token level filter (with context filter).")
            compressed_context, word_list, word_label_list = compress_chunks(
                reserved_context,
                model=model,
                tokenizer=tokenizer,
                device=device,
                oai_tokenizer=oai_tokenizer,
                max_seq_len=max_seq_len,
                max_batch_size=max_batch_size,
                special_tokens=special_tokens,
                model_name=model_name,
                reduce_rate=max(0, 1 - rate),
                token_to_word=token_to_word,
                force_tokens=force_tokens,
                token_map=token_map,
                force_reserve_digit=force_reserve_digit,
                drop_consecutive=drop_consecutive,
            )
        else:
            logger.debug("Skipping token level filter (with context filter).")
            compressed_context, word_list, word_label_list = compress_chunks(
                reserved_context,
                model=model,
                tokenizer=tokenizer,
                device=device,
                oai_tokenizer=oai_tokenizer,
                max_seq_len=max_seq_len,
                max_batch_size=max_batch_size,
                special_tokens=special_tokens,
                model_name=model_name,
                reduce_rate=0,
                token_to_word=token_to_word,
                force_tokens=force_tokens,
                token_map=token_map,
                force_reserve_digit=force_reserve_digit,
                drop_consecutive=drop_consecutive,
            )

        n_compressed_token = 0
        for c in compressed_context:
            n_compressed_token += get_token_length(c, tokenizer=None, use_oai_tokenizer=True, oai_tokenizer=oai_tokenizer)

        logger.info(f"Compressed token count: {n_compressed_token}")

        ratio = (
            1 if n_compressed_token == 0 else n_original_token / n_compressed_token
        )
        res = {
            "compressed_prompt": "\n\n".join(compressed_context),
            "compressed_prompt_list": compressed_context,
            "origin_tokens": n_original_token,
            "compressed_tokens": n_compressed_token,
            "ratio": f"{ratio:.1f}x",
            "rate": f"{1 / ratio * 100:.1f}%",
            "saving": f", Saving \${(n_original_token - n_compressed_token) * 0.06 / 1000:.1f} in GPT-4.",
        }
        if return_word_label:
            words = []
            labels = []
            j = 0
            for i in range(len(context)):
                if context_label[i]:
                    words.extend(word_list[j])
                    labels.extend(word_label_list[j])
                    j += 1
                else:
                    words.extend(context_words[i])
                    labels.extend([0] * len(context_words[i]))
            word_label_lines = word_sep.join(
                [f"{word}{label_sep}{label}" for word, label in zip(words, labels)]
            )
            res["fn_labeled_original_prompt"] = word_label_lines
        return res

    # Normal path without context level filter
    if target_token > 0:
        rate = min(target_token / n_original_token, 1.0)

    logger.debug(f"Effective compression rate: {rate}")

    if use_token_level_filter:
        logger.debug("Applying token level filter.")
        compressed_context, word_list, word_label_list = compress_chunks(
            context_chunked,
            model=model,
            tokenizer=tokenizer,
            device=device,
            oai_tokenizer=oai_tokenizer,
            max_seq_len=max_seq_len,
            max_batch_size=max_batch_size,
            special_tokens=special_tokens,
            model_name=model_name,
            reduce_rate=max(0, 1 - rate),
            token_to_word=token_to_word,
            force_tokens=force_tokens,
            token_map=token_map,
            force_reserve_digit=force_reserve_digit,
            drop_consecutive=drop_consecutive,
        )
    else:
        logger.debug("Skipping token level filter.")
        compressed_context, word_list, word_label_list = compress_chunks(
            context_chunked,
            model=model,
            tokenizer=tokenizer,
            device=device,
            oai_tokenizer=oai_tokenizer,
            max_seq_len=max_seq_len,
            max_batch_size=max_batch_size,
            special_tokens=special_tokens,
            model_name=model_name,
            reduce_rate=0,
            token_to_word=token_to_word,
            force_tokens=force_tokens,
            token_map=token_map,
            force_reserve_digit=force_reserve_digit,
            drop_consecutive=drop_consecutive,
        )

    n_compressed_token = 0
    for c in compressed_context:
        n_compressed_token += get_token_length(c, tokenizer=None, use_oai_tokenizer=True, oai_tokenizer=oai_tokenizer)

    logger.info(f"Compressed token count: {n_compressed_token}")

    ratio = (
        1 if n_compressed_token == 0 else n_original_token / n_compressed_token
    )
    res = {
        "compressed_prompt": "\n\n".join(compressed_context),
        "compressed_prompt_list": compressed_context,
        "origin_tokens": n_original_token,
        "compressed_tokens": n_compressed_token,
        "ratio": f"{ratio:.1f}x",
        "rate": f"{1 / ratio * 100:.1f}%",
        "saving": f", Saving \${(n_original_token - n_compressed_token) * 0.06 / 1000:.1f} in GPT-4.",
    }
    if return_word_label:
        words = []
        labels = []
        for w_list, l_list in zip(word_list, word_label_list):
            words.extend(w_list)
            labels.extend(l_list)

        word_label_lines = word_sep.join(
            [f"{word}{label_sep}{label}" for word, label in zip(words, labels)]
        )
        res["fn_labeled_original_prompt"] = word_label_lines
    return res
`}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </section>
  );
}

const ArchBlock: React.FC<{ icon: React.ReactNode; title: string; sub: string; highlight?: boolean; success?: boolean }> = ({ icon, title, sub, highlight, success }) => (
  <div className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 w-48 text-center shadow-sm ${
    highlight ? 'bg-blue-500 border-blue-500 text-white shadow-blue-500/20' : 
    success ? 'bg-green-500/20 border-green-500/50 text-green-300' : 
    'bg-white/5 border-[#27272a] text-white'
  }`}>
    <div className={`mb-3 p-2 rounded-lg ${highlight ? 'bg-white/10' : 'bg-white/5'}`}>{icon}</div>
    <div className="font-extrabold text-sm mb-1">{title}</div>
    <div className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-blue-100' : 'text-[#a1a1aa]'}`}>{sub}</div>
  </div>
);

const ArchArrow = () => (
  <div className="hidden md:block text-[#a1a1aa]">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </div>
);

const ArchLoop = () => (
  <div className="hidden md:flex flex-col items-center justify-center gap-1">
    {/* Arrow pointing right */}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#a1a1aa]">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
    {/* Arrow pointing left */}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#a1a1aa]">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  </div>
);

const InnovationCard: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="p-6 bg-white/5 rounded-2xl border border-[#27272a] group hover:bg-white/10 hover:shadow-xl transition-all duration-300">
    <h4 className="font-extrabold text-white mb-4 border-l-4 border-blue-500 pl-3">{title}</h4>
    <p className="text-sm text-[#a1a1aa] leading-relaxed font-medium">
      {desc}
    </p>
  </div>
);
