import os from 'os'
import path from 'path'
import {
  assertExists,
  copyPath,
  countPathStats,
  getPathType,
  listDirectory,
  mkdirPaths,
  movePath,
  readTextFile,
  removePath,
  resolveInputPath,
  touchFile,
} from './fsOps.js'
import { fmt, formatLsRows, formatStatResult } from './formatter.js'
import {
  normalizeVirtualPath,
  vfsListChildren,
  vfsMkdir,
  vfsStat,
  vfsTouch,
} from './virtualFs.js'

export const COMMANDS = ['cat', 'cd', 'cp', 'echo', 'exit', 'help', 'ls', 'mkdir', 'mv', 'pwd', 'rm', 'stat', 'touch']

export const COMMAND_OPTIONS = {
  cp: ['-r'],
  ls: ['-a'],
  mkdir: ['-p'],
  rm: ['-f', '-r'],
  stat: ['-r'],
}

function getUsage() {
  const rows = [
    ['pwd', '输出当前工作目录'],
    ['ls [-a] [path]', '列出文件或目录'],
    ['cd [path]', '切换当前目录'],
    ['mkdir [-p] <path...>', '创建一个或多个目录'],
    ['rm [-r] [-f] <path...>', '删除文件或目录'],
    ['touch <file...>', '创建文件或更新修改时间'],
    ['cat <file>', '打印文件内容'],
    ['cp [-r] <source> <target>', '复制文件或目录'],
    ['mv <source> <target>', '移动或重命名文件'],
    ['echo <text>', '打印文本'],
    ['stat [-r] [path]', '显示文件和目录计数'],
    ['help', '查看可用命令'],
    ['exit', '关闭当前CLI会话'],
  ]

  const cmdWidth = Math.max(...rows.map(([cmd]) => cmd.length)) + 2
  const body = rows.map(([cmd, desc]) => `  ${fmt.info(cmd.padEnd(cmdWidth))}${fmt.dim(desc)}`).join('\n')
  return `${fmt.title('命令列表')}\n${body}`
}

async function cmdPwd(_, state) {
  if (state.user) {
    return state.cwd || '/'
  }
  return state.cwd
}

async function cmdLs(parsed, state) {
  if (state.user) {
    const cwd = state.cwd || '/'
    const targetPath = normalizeVirtualPath(cwd, parsed.args[0] || '.')
    const children = await vfsListChildren(state.user.id, targetPath)
    const rows = children.map((c) => ({
      name: c.name,
      type: c.type === 'folder' ? 'dir' : 'file',
    }))
    return formatLsRows(rows)
  }

  const target = resolveInputPath(state.cwd, parsed.args[0] || '.')
  await assertExists(target)
  const type = await getPathType(target)

  if (type === 'file') {
    return path.basename(target)
  }

  const rows = await listDirectory(target, { all: parsed.options.has('a') })
  return formatLsRows(rows)
}

async function cmdCd(parsed, state) {
  if (state.user) {
    const cwd = state.cwd || '/'
    const input = parsed.args[0] || '/'
    const next = normalizeVirtualPath(cwd, input)
    if (next !== '/') {
      // will throw if path 不存在或不是目录
      await vfsListChildren(state.user.id, next)
    }
    state.cwd = next
    return fmt.success(next)
  }

  const next = parsed.args[0] ? resolveInputPath(state.cwd, parsed.args[0]) : os.homedir()
  await assertExists(next)
  const type = await getPathType(next)
  if (type !== 'dir') {
    throw new Error(`不是一个目录: ${parsed.args[0] || next}`)
  }
  state.cwd = next
  return fmt.success(next)
}

async function cmdMkdir(parsed, state) {
  if (parsed.args.length === 0) throw new Error('mkdir 至少需要一个路径')
  if (state.user) {
    const cwd = state.cwd || '/'
    const created = []
    for (const arg of parsed.args) {
      const targetDir = path.posix.dirname(arg)
      const name = path.posix.basename(arg)
      const basePath = normalizeVirtualPath(cwd, targetDir === '.' ? '.' : targetDir)
      await vfsMkdir(state.user.id, basePath, name)
      created.push(arg)
    }
    return fmt.success(`created ${created.length} path(s)`)
  }
  const targets = parsed.args.map((arg) => resolveInputPath(state.cwd, arg))
  await mkdirPaths(targets, { recursive: parsed.options.has('p') })
  return fmt.success(`created ${targets.length} path(s)`)
}

async function cmdRm(parsed, state) {
  if (parsed.args.length === 0) throw new Error('rm 至少需要一个路径')
  const recursive = parsed.options.has('r')
  const force = parsed.options.has('f')
  for (const arg of parsed.args) {
    const target = resolveInputPath(state.cwd, arg)
    if (!force) await assertExists(target)
    await removePath(target, { recursive, force })
  }
  return fmt.success(`removed ${parsed.args.length} path(s)`)
}

async function cmdTouch(parsed, state) {
  if (parsed.args.length === 0) throw new Error('touch 至少需要一个文件路径')
  if (state.user) {
    const cwd = state.cwd || '/'
    for (const arg of parsed.args) {
      const targetDir = path.posix.dirname(arg)
      const name = path.posix.basename(arg)
      const basePath = normalizeVirtualPath(cwd, targetDir === '.' ? '.' : targetDir)
      await vfsTouch(state.user.id, basePath, name)
    }
    return fmt.success(`updated ${parsed.args.length} file(s)`)
  }
  for (const arg of parsed.args) {
    await touchFile(resolveInputPath(state.cwd, arg))
  }
  return fmt.success(`updated ${parsed.args.length} file(s)`)
}

async function cmdCat(parsed, state) {
  const file = parsed.args[0]
  if (!file) throw new Error('cat 至少需要一个文件路径')
  const target = resolveInputPath(state.cwd, file)
  await assertExists(target)
  const type = await getPathType(target)
  if (type !== 'file') throw new Error('cat 只支持文件')
  return readTextFile(target)
}

async function cmdCp(parsed, state) {
  if (parsed.args.length !== 2) throw new Error('cp 至少需要一个源路径和目标路径')
  const source = resolveInputPath(state.cwd, parsed.args[0])
  const target = resolveInputPath(state.cwd, parsed.args[1])
  await assertExists(source)
  await copyPath(source, target, { recursive: parsed.options.has('r') })
  return fmt.success('copied')
}

async function cmdMv(parsed, state) {
  if (parsed.args.length !== 2) throw new Error('mv 至少需要一个源路径和目标路径')
  const source = resolveInputPath(state.cwd, parsed.args[0])
  const target = resolveInputPath(state.cwd, parsed.args[1])
  await assertExists(source)
  await movePath(source, target)
  return fmt.success('moved')
}

async function cmdEcho(parsed) {
  return parsed.args.join(' ')
}

async function cmdStat(parsed, state) {
  const recursive = parsed.options.has('r')
  if (state.user) {
    const cwd = state.cwd || '/'
    const targetPath = normalizeVirtualPath(cwd, parsed.args[0] || '.')
    const totals = await vfsStat(state.user.id, targetPath, { recursive })
    return formatStatResult({
      path: targetPath,
      recursive,
      ...totals,
    })
  }
  const target = resolveInputPath(state.cwd, parsed.args[0] || '.')
  await assertExists(target)
  const totals = await countPathStats(target, { recursive })
  return formatStatResult({
    path: target,
    recursive,
    ...totals,
  })
}

const handlers = {
  cat: cmdCat,
  cd: cmdCd,
  cp: cmdCp,
  echo: cmdEcho,
  help: async () => getUsage(),
  ls: cmdLs,
  mkdir: cmdMkdir,
  mv: cmdMv,
  pwd: cmdPwd,
  rm: cmdRm,
  stat: cmdStat,
  touch: cmdTouch,
}

export async function executeCommand(parsed, state) {
  if (!parsed) return { output: '', shouldExit: false }

  if (parsed.command === 'exit') {
    return { output: fmt.dim('bye'), shouldExit: true }
  }

  const handler = handlers[parsed.command]
  if (!handler) {
    return {
      output: `${fmt.error(`未知命令: ${parsed.command}`)}\n${fmt.dim('运行 `help` 查看可用命令')}`,
      shouldExit: false,
    }
  }

  try {
    const output = await handler(parsed, state)
    return { output, shouldExit: false }
  } catch (error) {
    return {
      output: fmt.error(error.message || String(error)),
      shouldExit: false,
    }
  }
}
