import { read } from "to-vfile"
import { QuartzFilterPlugin } from "../types"
import matter from "gray-matter"

export const RemoveDrafts: QuartzFilterPlugin<{}> = () => ({
  name: "RemoveDrafts",
  async shouldPublish(_ctx, path) {
    const file = await read(path)
    const content = file.toString().trim()

    const fm = matter(content)
    const draftFlag = fm.data?.draft === "true"

    return !draftFlag
  },
})
