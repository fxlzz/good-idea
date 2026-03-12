import chalk from 'chalk'

export const fmt = {
  success: (text) => chalk.green(text),
  error: (text) => chalk.red(text),
  info: (text) => chalk.cyan(text),
  warn: (text) => chalk.yellow(text),
  dim: (text) => chalk.gray(text),
  title: (text) => chalk.bold.blue(text),
}

export function formatLsRows(rows) {
  if (rows.length === 0) return fmt.dim('(empty)')
  return rows
    .map((row) => {
      const kind = row.type === 'dir' ? fmt.info('[DIR] ') : fmt.dim('[FILE]')
      const name = row.type === 'dir' ? fmt.info(` ${row.name}`) : ` ${row.name}`
      return `${kind}${name}`
    })
    .join('\n')
}

export function formatStatResult(result) {
  const lines = [
    `${fmt.title('Path:')} ${result.path}`,
    `${fmt.title('Mode:')} ${result.recursive ? 'recursive' : 'shallow'}`,
    `${fmt.title('Files:')} ${fmt.success(String(result.files))}`,
    `${fmt.title('Directories:')} ${fmt.info(String(result.directories))}`,
  ]
  return lines.join('\n')
}
