import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as logger from '../../src/lib/logger.js';

describe('logger', () => {
  let output;
  const originalLog = console.log;

  beforeEach(() => {
    output = '';
    console.log = (...args) => {
      output += args.join(' ');
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('tick outputs checkmark', () => {
    logger.tick('test message');
    expect(output).toContain('✓');
    expect(output).toContain('test message');
  });

  it('cross outputs X mark', () => {
    logger.cross('error message');
    expect(output).toContain('✗');
    expect(output).toContain('error message');
  });

  it('info outputs info prefix', () => {
    logger.info('info message');
    expect(output).toContain('i');
    expect(output).toContain('info message');
  });

  it('warn outputs warning prefix', () => {
    logger.warn('warning message');
    expect(output).toContain('⚠');
    expect(output).toContain('warning message');
  });

  it('error outputs error prefix', () => {
    logger.error('error message');
    expect(output).toContain('✘');
    expect(output).toContain('error message');
  });

  it('dim wraps text in dim ANSI codes', () => {
    const result = logger.dim('dimmed text');
    expect(result).toContain('\x1b[2m');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('dimmed text');
  });

  it('header outputs header format', () => {
    logger.header('Test Header');
    expect(output).toContain('Test Header');
  });

  it('rule outputs separator line', () => {
    logger.rule();
    expect(output).toContain('─');
  });

  it('section outputs label + value format', () => {
    logger.section('Name', 'Value');
    expect(output).toContain('Name');
    expect(output).toContain('Value');
  });

  it('table formats rows with columns', () => {
    logger.table([['A', 'B'], ['1', '2']]);
    expect(output).toContain('A');
    expect(output).toContain('B');
    expect(output).toContain('1');
    expect(output).toContain('2');
  });

  it('ok outputs success message with newline', () => {
    logger.ok('Success!');
    expect(output).toContain('Success!');
    expect(output).toContain('✓');
  });

  it('fail sets process.exitCode to 1', () => {
    const originalExitCode = process.exitCode;
    process.exitCode = 0;
    logger.fail('Failure message');
    expect(process.exitCode).toBe(1);
    process.exitCode = originalExitCode;
  });

  it('fail outputs failure message', () => {
    logger.fail('Something failed');
    expect(output).toContain('Something failed');
    expect(output).toContain('✗');
  });

  it('emits ANSI color codes for visual output', () => {
    logger.tick('colored');
    expect(output).toContain('\x1b[32m'); // green
    logger.error('error');
    expect(output).toContain('\x1b[31m'); // red
    logger.info('info');
    expect(output).toContain('\x1b[36m'); // cyan
  });
});
