import { BuildCtx } from "../util/ctx"
import { FilePath, joinSegments } from "../util/path"
import { PerfTimer } from "../util/perf"

export async function filterContent(ctx: BuildCtx, paths: FilePath[]): Promise<FilePath[]> {
  const { cfg } = ctx
  const perf = new PerfTimer()
  const initialLength = paths.length
  for (const plugin of cfg.plugins.filters) {
    const updatedContent = []

    for (const item of paths) {
      if (!item.endsWith(".md")) {
        updatedContent.push(item)
        continue
      }

      const path = joinSegments(ctx.argv.directory, item) as FilePath
      const shouldPublish = await plugin.shouldPublish(ctx, path)

      if (shouldPublish) updatedContent.push(item)
    }
  
    paths = updatedContent
  }

  console.log(`Filtered out ${initialLength - paths.length} files in ${perf.timeSince()}`)
  return paths
}
