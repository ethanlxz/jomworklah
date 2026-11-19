import { createRuleAdapter } from './rule-adapter.js';
import { createLlmAdapter } from './llm-adapter.js';

export function createAiAdapter(config) {
  const rule = createRuleAdapter();
  if (config.ai.provider === 'openai' && config.ai.apiKey) {
    return createLlmAdapter(config.ai, rule);
  }
  return rule;
}

export { createRuleAdapter };
