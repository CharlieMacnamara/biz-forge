/**
 * Module starter template for bizforge modules.
 *
 * Each module in modules/ is self-contained with its own:
 *   index.js     — exported functions
 *   README.md    — API docs and usage
 *   test/        — module-specific tests
 *
 * Pattern:
 *   1. Export pure functions (no side effects) for easy testing
 *   2. Accept API keys/config via parameters, not global state
 *   3. Use fetch() for HTTP — no extra dependencies needed
 *   4. Throw descriptive errors for bad inputs
 */

export async function exampleApiCall(param) {
  if (!param) {
    throw new Error('param is required');
  }
  const response = await fetch(`https://api.example.com/v1/${param}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
