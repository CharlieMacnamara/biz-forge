import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readFileSync: vi.fn((path) => {
      if (path.includes('auth.json')) {
        throw new Error('ENOENT: no such file');
      }
      return actual.readFileSync(path);
    }),
  };
});

describe('llm module', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear all env vars that might provide an API key
    delete process.env.OPENCODE_GO_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it('exports ask, generateTestCases, enhanceDocument functions', async () => {
    process.env.OPENCODE_GO_API_KEY = 'test-key';
    const mod = await import('../../src/lib/llm.js');
    expect(typeof mod.ask).toBe('function');
    expect(typeof mod.generateTestCases).toBe('function');
    expect(typeof mod.enhanceDocument).toBe('function');
  });

  it('throws when no LLM key is available', async () => {
    const mod = await import('../../src/lib/llm.js');
    await expect(mod.ask('test')).rejects.toThrow('No LLM API key found');
  }, 10000);
});
