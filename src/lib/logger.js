const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m';

function tick(text, ...args) {
  console.log(`  ${GREEN}✓${NC} ${text}`, ...args);
}

function cross(text, ...args) {
  console.log(`  ${RED}✗${NC} ${text}`, ...args);
}

function info(text, ...args) {
  console.log(`  ${CYAN}i${NC} ${BOLD}${text}${NC}`, ...args);
}

function warn(text, ...args) {
  console.log(`  ${YELLOW}⚠${NC} ${text}`, ...args);
}

function error(text, ...args) {
  console.log(`  ${RED}✘${NC} ${text}`, ...args);
}

function dim(text) {
  return `${DIM}${text}${NC}`;
}

function header(text) {
  console.log(`\n${BOLD}${CYAN}═══ ${text}${NC}\n`);
}

function rule() {
  console.log(`  ${DIM}${'─'.repeat(50)}${NC}`);
}

function section(label, value) {
  console.log(`  ${DIM}${label}:${NC} ${value}`);
}

function table(rows) {
  const colWidths = [];
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i] || 0, String(row[i]).length);
    }
  }
  for (const row of rows) {
    const formatted = row.map((cell, i) => {
      const str = String(cell);
      return i === 0 ? DIM + str.padEnd(colWidths[i]) + NC : str.padEnd(colWidths[i]);
    }).join('    ');
    console.log(`  ${formatted}`);
  }
}

function ok(text) {
  console.log(`\n  ${GREEN}${BOLD}✓ ${text}${NC}`);
}

function fail(text) {
  console.log(`\n  ${RED}${BOLD}✗ ${text}${NC}`);
  process.exitCode = 1;
}

export { tick, cross, info, warn, error, dim, header, rule, section, table, ok, fail };
