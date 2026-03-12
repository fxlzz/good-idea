export function tokenize(input) {
  const tokens = []
  let current = ''
  let quote = null
  let escaped = false

  for (const ch of input) {
    if (escaped) {
      current += ch
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (quote) {
      if (ch === quote) {
        quote = null
      } else {
        current += ch
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }
    current += ch
  }

  if (current) tokens.push(current)
  return tokens
}

export function parseCommand(input) {
  const tokens = tokenize(input.trim())
  if (tokens.length === 0) return null

  const [command, ...rest] = tokens
  const options = new Set()
  const args = []

  for (const token of rest) {
    if (token.startsWith('-') && token.length > 1) {
      for (const flag of token.slice(1)) {
        options.add(flag)
      }
    } else {
      args.push(token)
    }
  }

  return {
    command,
    raw: input,
    args,
    options,
  }
}
