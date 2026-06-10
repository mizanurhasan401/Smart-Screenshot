interface CaptureInfoBarProps {
  title?: string
  url?: string
}

export default function CaptureInfoBar({ title, url }: CaptureInfoBarProps) {
  if (!title && !url) return null

  return (
    <div className="shrink-0 overflow-x-auto border-b border-blue-100 bg-blue-50/80 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        {title && (
          <span className="shrink-0 font-medium text-zinc-800 dark:text-zinc-100">
            {title}
          </span>
        )}
        {title && url && (
          <span className="shrink-0 text-zinc-300 dark:text-zinc-600" aria-hidden="true">
            |
          </span>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            title={url}
          >
            {url}
          </a>
        )}
      </div>
    </div>
  )
}
