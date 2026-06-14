#!/usr/bin/env node
/**
 * llm.js — OpenAI-compatible LLM integration.
 *
 * Reads credentials from env or opencode auth.json.
 * Configure via env vars: OPENCODE_GO_API_KEY, LLM_ENDPOINT, LLM_MODEL.
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DEFAULT_ENDPOINT = 'https://opencode.ai/zen/go/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-v4-flash';

function resolveApiKey() {
  if (process.env.OPENCODE_GO_API_KEY) {
    return process.env.OPENCODE_GO_API_KEY;
  }

  // Try reading from opencode auth.json
  try {
    const authPath = join(homedir(), '.local', 'share', 'opencode', 'auth.json');
    const auth = JSON.parse(readFileSync(authPath, 'utf-8'));
    if (auth['opencode-go']?.key) {
      return auth['opencode-go'].key;
    }
  } catch {
    // silent — fall through to env checks
  }

  // Fallback to common env vars
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  throw new Error(
    'No LLM API key found. Set OPENCODE_GO_API_KEY in .env, ' +
    'or ensure ~/.local/share/opencode/auth.json has "opencode-go" credentials.'
  );
}

function getEndpoint() {
  return process.env.LLM_ENDPOINT || DEFAULT_ENDPOINT;
}

function getModel() {
  return process.env.LLM_MODEL || DEFAULT_MODEL;
}

async function fetchCompletion(messages, options = {}) {
  const apiKey = resolveApiKey();
  const endpoint = getEndpoint();
  const model = getModel();
  const {
    temperature = 0.3,
    maxTokens = 2048,
  } = options;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`LLM API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

/**
 * Ask a business/tax/legal question using the LLM.
 * Context from the current project is injected into the system prompt.
 */
async function ask(prompt, context = '') {
  const systemPrompt = `You are a UK business advisor for a solo IT consultancy.
The business provides web development, software consultancy, and app development services.
The director is a solo founder operating as a UK limited company.

Answer concisely and accurately. Reference UK tax law, Companies House requirements,
GDPR/PECR regulations, and UK contracting best practices where relevant.
If you're not sure about something, say so rather than guessing.

${context ? `Additional context:\n${context}` : ''}`;

  return fetchCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ], { temperature: 0.3 });
}

/**
 * Generate edge-case test inputs for a given source code module.
 */
async function generateTestCases(sourceCode, moduleName) {
  const prompt = `Analyse the following JavaScript module and generate exhaustive edge-case test scenarios for vitest.

Module name: ${moduleName}

Source code:
\`\`\`js
${sourceCode}
\`\`\`

For each exported function, provide:
1. A list of edge cases (boundary values, zero inputs, negative inputs, null/undefined, type mismatches)
2. The expected outcome for each case
3. Any properties or invariants that should hold true

Focus on:
- Boundary values at thresholds
- Empty/null/undefined inputs
- Negative numbers where applicable
- Very large numbers
- Type coercion edge cases
- Error paths

Return as a structured list grouped by function name.`;

  return fetchCompletion([
    { role: 'system', content: 'You are a senior QA engineer specialised in JavaScript testing with vitest. Return only the test scenarios, no explanatory prose.' },
    { role: 'user', content: prompt },
  ], { temperature: 0.2, maxTokens: 4096 });
}

/**
 * Enhance a legal/business document with LLM review.
 */
async function enhanceDocument(document, vars, documentType) {
  const prompt = `Review this ${documentType} document for a UK-based IT consultancy and suggest improvements.

Client context:
${JSON.stringify(vars, null, 2)}

Document:
${document}

Check for:
1. Completeness — are all required sections present for UK law?
2. Accuracy — are the legal references and terminology correct?
3. Consistency — are names, dates, and figures consistent throughout?
4. Risk — are there any clauses that leave the company exposed?
5. Suggestions — what additional clauses or language would strengthen the document?

Return improvements as a numbered list of specific, actionable changes.`;

  return fetchCompletion([
    { role: 'system', content: 'You are a UK-qualified solicitor specialising in technology contracts, GDPR, and intellectual property. Review documents critically.' },
    { role: 'user', content: prompt },
  ], { temperature: 0.2, maxTokens: 4096 });
}

export { ask, generateTestCases, enhanceDocument };
