import { QuartzFilterPlugin } from "../types"

function hasDraftFlag(src?: string) {
  if (!src) return false
  const s = src.trim()
  if (!s.startsWith("---")) return false
  const end = s.indexOf("---", 3)
  if (end === -1) return false
  const fm = s.slice(3, end)
  const m = fm.match(/draft\s*:\s*(?:"|')?true(?:"|')?/i)
  return !!m
}

export const RemoveDrafts: QuartzFilterPlugin<{}> = () => ({
  name: "RemoveDrafts",
  shouldPublish(_ctx, _filePath, src) {
    const draftFlag = hasDraftFlag(src)
    return !draftFlag
  },
})
