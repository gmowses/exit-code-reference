import { useState, useEffect, useMemo } from 'react'
import { Sun, Moon, Languages, Search, Hash } from 'lucide-react'

const translations = {
  en: {
    title: 'Shell Exit Code Reference',
    subtitle: 'Exit codes 0–255 with descriptions, common codes highlighted and signal mapping. Everything client-side.',
    searchPlaceholder: 'Search by code, name or description...',
    code: 'Code',
    name: 'Name',
    description: 'Description',
    category: 'Category',
    all: 'All',
    common: 'Common',
    signal: 'Signal (128+N)',
    noResults: 'No exit codes match your search.',
    showing: 'Showing',
    of: 'of',
    entries: 'entries',
    builtBy: 'Built by',
    note: 'Exit codes 128+N indicate the process was terminated by signal N (e.g., 130 = 128+2 = SIGINT, 137 = 128+9 = SIGKILL). Exit code 255 may indicate exit(-1) or out-of-range value.',
  },
  pt: {
    title: 'Referencia de Exit Codes do Shell',
    subtitle: 'Exit codes 0–255 com descricoes, codigos comuns em destaque e mapeamento de sinais.',
    searchPlaceholder: 'Buscar por codigo, nome ou descricao...',
    code: 'Codigo',
    name: 'Nome',
    description: 'Descricao',
    category: 'Categoria',
    all: 'Todos',
    common: 'Comuns',
    signal: 'Sinal (128+N)',
    noResults: 'Nenhum exit code corresponde a busca.',
    showing: 'Exibindo',
    of: 'de',
    entries: 'entradas',
    builtBy: 'Criado por',
    note: 'Exit codes 128+N indicam que o processo foi terminado pelo sinal N (ex: 130 = 128+2 = SIGINT, 137 = 128+9 = SIGKILL). Exit code 255 pode indicar exit(-1) ou valor fora do intervalo.',
  },
} as const

type Lang = keyof typeof translations
type CodeCategory = 'success' | 'error' | 'signal' | 'common' | 'range'

interface ExitCode {
  code: number
  name: string
  description: string
  category: CodeCategory
  isCommon: boolean
}

const CATEGORY_COLORS: Record<CodeCategory, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  signal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  common: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  range: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

const EXIT_CODES: ExitCode[] = [
  { code: 0, name: 'SUCCESS', description: 'Command completed successfully. False/no-match in test expressions.', category: 'success', isCommon: true },
  { code: 1, name: 'GENERAL_ERROR', description: 'General error. Catchall for miscellaneous errors.', category: 'error', isCommon: true },
  { code: 2, name: 'MISUSE_BUILTIN', description: 'Misuse of shell builtins (e.g., invalid options). Bash reserved.', category: 'error', isCommon: true },
  { code: 3, name: 'APP_DEFINED', description: 'Application-defined. Many daemons (systemd, OpenSSL, etc.) use 3 for specific conditions.', category: 'common', isCommon: false },
  { code: 4, name: 'APP_DEFINED', description: 'Application-defined. Context-dependent error.', category: 'common', isCommon: false },
  { code: 5, name: 'APP_DEFINED', description: 'Application-defined.', category: 'common', isCommon: false },
  { code: 6, name: 'APP_DEFINED', description: 'Application-defined.', category: 'common', isCommon: false },
  { code: 7, name: 'APP_DEFINED', description: 'Application-defined.', category: 'common', isCommon: false },
  { code: 13, name: 'PERMISSION_DENIED', description: 'Some tools return 13 for permission denied (mirrors EACCES errno).', category: 'common', isCommon: false },
  { code: 64, name: 'EX_USAGE', description: 'Command line usage error (sysexits.h EX_USAGE). Used by sendmail, ssh, etc.', category: 'common', isCommon: false },
  { code: 65, name: 'EX_DATAERR', description: 'Data format error (sysexits.h). Input data incorrect format.', category: 'common', isCommon: false },
  { code: 66, name: 'EX_NOINPUT', description: 'Cannot open input (sysexits.h).', category: 'common', isCommon: false },
  { code: 67, name: 'EX_NOUSER', description: 'Addressee unknown (sysexits.h).', category: 'common', isCommon: false },
  { code: 68, name: 'EX_NOHOST', description: 'Host name unknown (sysexits.h).', category: 'common', isCommon: false },
  { code: 69, name: 'EX_UNAVAILABLE', description: 'Service unavailable (sysexits.h).', category: 'common', isCommon: false },
  { code: 70, name: 'EX_SOFTWARE', description: 'Internal software error (sysexits.h).', category: 'common', isCommon: false },
  { code: 71, name: 'EX_OSERR', description: 'System error (sysexits.h). e.g., cannot fork.', category: 'common', isCommon: false },
  { code: 72, name: 'EX_OSFILE', description: 'Critical OS file missing (sysexits.h).', category: 'common', isCommon: false },
  { code: 73, name: 'EX_CANTCREAT', description: 'Cannot create output file (sysexits.h).', category: 'common', isCommon: false },
  { code: 74, name: 'EX_IOERR', description: 'Input/output error (sysexits.h).', category: 'common', isCommon: false },
  { code: 75, name: 'EX_TEMPFAIL', description: 'Temporary failure; user is invited to retry (sysexits.h).', category: 'common', isCommon: false },
  { code: 76, name: 'EX_PROTOCOL', description: 'Remote error in protocol (sysexits.h).', category: 'common', isCommon: false },
  { code: 77, name: 'EX_NOPERM', description: 'Permission denied (sysexits.h).', category: 'common', isCommon: false },
  { code: 78, name: 'EX_CONFIG', description: 'Configuration error (sysexits.h).', category: 'common', isCommon: false },
  { code: 126, name: 'NOT_EXECUTABLE', description: 'Command invoked cannot execute (permission denied, not an executable).', category: 'error', isCommon: true },
  { code: 127, name: 'NOT_FOUND', description: 'Command not found. PATH issue or command does not exist.', category: 'error', isCommon: true },
  { code: 128, name: 'INVALID_EXIT', description: 'Invalid exit argument. exit() called with argument outside 0-255.', category: 'range', isCommon: true },
  { code: 129, name: 'SIGHUP', description: '128 + 1: Terminated by SIGHUP (hangup).', category: 'signal', isCommon: false },
  { code: 130, name: 'SIGINT', description: '128 + 2: Terminated by SIGINT (Ctrl+C).', category: 'signal', isCommon: true },
  { code: 131, name: 'SIGQUIT', description: '128 + 3: Terminated by SIGQUIT (Ctrl+\\, core dump).', category: 'signal', isCommon: false },
  { code: 132, name: 'SIGILL', description: '128 + 4: Terminated by SIGILL (illegal instruction).', category: 'signal', isCommon: false },
  { code: 133, name: 'SIGTRAP', description: '128 + 5: Terminated by SIGTRAP (debugger breakpoint).', category: 'signal', isCommon: false },
  { code: 134, name: 'SIGABRT', description: '128 + 6: Terminated by SIGABRT (abort(3), assertion failure).', category: 'signal', isCommon: false },
  { code: 135, name: 'SIGBUS', description: '128 + 7: Terminated by SIGBUS (bus error).', category: 'signal', isCommon: false },
  { code: 136, name: 'SIGFPE', description: '128 + 8: Terminated by SIGFPE (floating point exception).', category: 'signal', isCommon: false },
  { code: 137, name: 'SIGKILL', description: '128 + 9: Terminated by SIGKILL (kill -9, OOM killer).', category: 'signal', isCommon: true },
  { code: 138, name: 'SIGUSR1', description: '128 + 10: Terminated by SIGUSR1 (user-defined).', category: 'signal', isCommon: false },
  { code: 139, name: 'SIGSEGV', description: '128 + 11: Terminated by SIGSEGV (segmentation fault).', category: 'signal', isCommon: true },
  { code: 140, name: 'SIGUSR2', description: '128 + 12: Terminated by SIGUSR2 (user-defined).', category: 'signal', isCommon: false },
  { code: 141, name: 'SIGPIPE', description: '128 + 13: Terminated by SIGPIPE (broken pipe).', category: 'signal', isCommon: false },
  { code: 142, name: 'SIGALRM', description: '128 + 14: Terminated by SIGALRM (alarm timeout).', category: 'signal', isCommon: false },
  { code: 143, name: 'SIGTERM', description: '128 + 15: Terminated by SIGTERM (graceful kill, default).', category: 'signal', isCommon: true },
  { code: 152, name: 'SIGXCPU', description: '128 + 24: Terminated by SIGXCPU (CPU limit exceeded).', category: 'signal', isCommon: false },
  { code: 153, name: 'SIGXFSZ', description: '128 + 25: Terminated by SIGXFSZ (file size limit).', category: 'signal', isCommon: false },
  { code: 255, name: 'OUT_OF_RANGE', description: 'Exit code out of range. exit(-1) wraps to 255. Also used by SSH to indicate connection errors.', category: 'range', isCommon: true },
]

export default function ExitCodeReference() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'common' | 'signal'>('all')

  const t = translations[lang]
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return EXIT_CODES.filter(e => {
      const matchFilter = filter === 'all' || (filter === 'common' && e.isCommon) || (filter === 'signal' && e.category === 'signal')
      const matchSearch = !q || String(e.code).includes(q) || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [search, filter])

  const filters = [
    { key: 'all' as const, label: t.all },
    { key: 'common' as const, label: t.common },
    { key: 'signal' as const, label: t.signal },
  ]

  const codeColor = (code: number) => {
    if (code === 0) return 'text-green-600 dark:text-green-400'
    if (code >= 128) return 'text-purple-600 dark:text-purple-400'
    if (code === 1 || code === 2) return 'text-red-600 dark:text-red-400'
    if (code >= 126 && code <= 128) return 'text-orange-600 dark:text-orange-400'
    return 'text-zinc-600 dark:text-zinc-400'
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-600 rounded-lg flex items-center justify-center">
              <Hash size={18} className="text-white" />
            </div>
            <span className="font-semibold">Exit Code Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/exit-code-reference" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Common codes quick-ref */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { code: 0, label: 'OK', color: 'bg-green-500' },
              { code: 1, label: 'Error', color: 'bg-red-500' },
              { code: 127, label: 'Not found', color: 'bg-orange-500' },
              { code: 130, label: 'Ctrl+C', color: 'bg-purple-500' },
              { code: 137, label: 'SIGKILL', color: 'bg-purple-600' },
              { code: 139, label: 'Segfault', color: 'bg-red-600' },
              { code: 143, label: 'SIGTERM', color: 'bg-purple-400' },
              { code: 255, label: 'Out of range', color: 'bg-zinc-500' },
            ].map(({ code, label, color }) => (
              <div key={code} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 flex items-center gap-3">
                <span className={`w-10 h-10 rounded-lg ${color} text-white text-sm font-bold flex items-center justify-center font-mono shrink-0`}>{code}</span>
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500" />
            </div>
            <div className="flex gap-1.5">
              {filters.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${filter === f.key ? 'bg-zinc-600 border-zinc-600 text-white' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-zinc-400">{t.showing} {filtered.length} {t.of} {EXIT_CODES.length} {t.entries}</div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 w-16">{t.code}</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 w-36">{t.name}</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 w-28">{t.category}</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">{t.description}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-zinc-400">{t.noResults}</td></tr>
                  ) : filtered.map(e => (
                    <tr key={e.code} className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors ${e.isCommon ? 'bg-zinc-50/70 dark:bg-zinc-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                      <td className={`px-4 py-3 font-mono font-bold text-lg tabular-nums ${codeColor(e.code)}`}>
                        {e.code}
                        {e.isCommon && <span className="block text-[9px] font-normal text-zinc-400">common</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{e.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${CATEGORY_COLORS[e.category]}`}>{e.category}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3">{t.note}</p>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
