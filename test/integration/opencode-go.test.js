import { describe, it, expect, beforeAll } from 'vitest';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * Deterministic integration test against the real OpenCode Go API
 * using opencode-go credentials for deepseek-v4-flash.
 *
 * DeepSeek V4 Flash is a reasoning model. It emits reasoning_content
 * (chain-of-thought) before the final content. Both are part of the
 * same completion_tokens budget. We use max_tokens=1024 to ensure
 * the model can finish reasoning and produce visible output.
 *
 * Observable: reasoning_tokens in usage, reasoning_content in message.
 * finish_reason="stop" means it completed normally.
 * finish_reason="length" means it hit the token limit.
 */

const AUTH_PATH = join(homedir(), '.local', 'share', 'opencode', 'auth.json');
const ENDPOINT = 'https://opencode.ai/zen/go/v1/chat/completions';
const MODEL = 'deepseek-v4-flash';
const MAX_TOKENS = 1024;

function getApiKey() {
  const auth = JSON.parse(readFileSync(AUTH_PATH, 'utf-8'));
  const key = auth['opencode-go']?.key;
  if (!key) throw new Error('No opencode-go key found in auth.json');
  return key;
}

async function callLLM(prompt, options = {}) {
  const key = getApiKey();
  const { temperature = 0, maxTokens = MAX_TOKENS } = options;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

let apiAvailable = false;

describe('OpenCode Go — deepseek-v4-flash', () => {
  beforeAll(async () => {
    try {
      const key = getApiKey();
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: 'ping' }], temperature: 0, max_tokens: 16 }),
        signal: AbortSignal.timeout(10000),
      });
      apiAvailable = res.ok;
    } catch {
      apiAvailable = false;
    }
  });

  it('resolves API key from opencode auth.json', () => {
    const key = getApiKey();
    expect(key).toBeTruthy();
    expect(key.length).toBeGreaterThan(20);
    expect(key.startsWith('sk-')).toBe(true);
  });

  it('returns valid chat completion format', { skip: !apiAvailable }, async () => {
    const data = await callLLM('say hello');
    expect(data).toHaveProperty('id');
    expect(data.object).toBe('chat.completion');
    expect(data.model).toContain('deepseek');
    expect(data.choices).toBeInstanceOf(Array);
    expect(data.choices.length).toBe(1);
    expect(data.choices[0].message).toHaveProperty('content');
    expect(data.usage.total_tokens).toBeGreaterThan(0);
  });

  it('returns visible content when given enough tokens', { skip: !apiAvailable }, async () => {
    const data = await callLLM('respond with only the word hello');
    const content = (data.choices[0].message.content || '').trim();
    expect(content.length).toBeGreaterThan(0);
    expect(content.toLowerCase()).toContain('hello');
  });

  it('emits reasoning_content (DeepSeek reasoning model feature)', { skip: !apiAvailable }, async () => {
    const data = await callLLM('say hello');
    const msg = data.choices[0].message;
    expect(msg).toHaveProperty('reasoning_content');
    const hasReasoning = (msg.reasoning_content || '').length > 0;
    const hasReasoningTokens = (data.usage.completion_tokens_details?.reasoning_tokens || 0) > 0;
    expect(hasReasoning || hasReasoningTokens).toBe(true);
  });

  it('finishes with "stop" reason when given enough tokens', { skip: !apiAvailable }, async () => {
    const data = await callLLM('respond with only the word hello');
    expect(data.choices[0].finish_reason).toBe('stop');
  });

  it('produces deterministic output at temperature=0', { skip: !apiAvailable }, async () => {
    const data1 = await callLLM('respond with only the word hello');
    const data2 = await callLLM('respond with only the word hello');

    const content1 = (data1.choices[0].message.content || '').trim().toLowerCase();
    const content2 = (data2.choices[0].message.content || '').trim().toLowerCase();

    expect(content1).toBe('hello');
    expect(content2).toBe('hello');
  });

  it('tracks reasoning tokens separately in usage', { skip: !apiAvailable }, async () => {
    const data = await callLLM('say hello');
    const details = data.usage.completion_tokens_details;
    expect(details).toHaveProperty('reasoning_tokens');
    expect(details.reasoning_tokens).toBeGreaterThanOrEqual(0);
    expect(data.usage.completion_tokens).toBeGreaterThanOrEqual(details.reasoning_tokens);
  });
});
