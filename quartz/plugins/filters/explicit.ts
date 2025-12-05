import { QuartzFilterPlugin } from "../types"

function checkPublishInFrontmatter(src?: string) {
  if (!src) return false
  const s = src.trim()
  if (!s.startsWith("---")) return false
  const end = s.indexOf("---", 3)
  if (end === -1) return false
  const fm = s.slice(3, end)
  // simple heuristic: look for `publish: true` (allow quotes and spaces)
  const m = fm.match(/publish\s*:\s*(?:"|')?true(?:"|')?/i)
  return !!m
}

export const ExplicitPublish: QuartzFilterPlugin = () => ({
  name: "ExplicitPublish",
  shouldPublish(_ctx, _filePath, src) {
    return checkPublishInFrontmatter(src)
  },
})
