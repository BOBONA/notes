import { BuildCtx } from "../util/ctx"
import { PerfTimer } from "../util/perf"
import { slugifyFilePath, joinSegments } from "../util/path"
import { readFile } from "fs/promises"
import { FilePath } from "../util/path"

export async function filterFiles(ctx: BuildCtx, filePaths: FilePath[]) {
  const { cfg, argv } = ctx
  const perf = new PerfTimer()

  let published = [...filePaths]

  for (const plugin of cfg.plugins.filters) {
    // prepare raw sources for markdown files (only for files we are evaluating)
    const sources: Record<string, string> = {}
    await Promise.all(
      published.map(async (relPath) => {
        if (!relPath.endsWith(".md")) return
        try {
          const abs = joinSegments(argv.directory, relPath)
          const src = await readFile(abs, "utf8")
          sources[relPath] = src
        } catch (err) {
          sources[relPath] = ""
        }
      }),
    )

    const updated = [] as FilePath[]
    for (const relPath of published) {
      const src = sources[relPath]
      try {
        const should = await plugin.shouldPublish(ctx, relPath as FilePath, src)
        if (should) updated.push(relPath as FilePath)
        else if (argv.verbose) console.log(`[filter:${plugin.name}] ${relPath} (filtered)`)
      } catch (err) {
        // if plugin fails, conservatively exclude
        if (argv.verbose) console.error(`[filter:${plugin.name}] error for ${relPath}:`, err)
      }
    }

    published = updated

    // Update ctx.allFiles and slugs to reflect current published set
    const otherFiles = ctx.allFiles.filter((f) => !f.endsWith(".md"))
    ctx.allFiles = [...otherFiles, ...published]
    ctx.allSlugs = ctx.allFiles.map((f) => slugifyFilePath(f as FilePath))
  }

  console.log(`Filtered out ${filePaths.length - published.length} files in ${perf.timeSince()}`)
  return published
}
