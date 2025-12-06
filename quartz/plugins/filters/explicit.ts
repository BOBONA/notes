import matter from "gray-matter"
import { QuartzFilterPlugin } from "../types"
import { read } from "to-vfile"

export const ExplicitPublish: QuartzFilterPlugin = () => ({
  name: "ExplicitPublish",
  async shouldPublish(_ctx, path) {
    const file = await read(path)
    const content = file.toString().trim()

    const fm = matter(content)
    const publish = fm.data?.publish === "true"

    return publish
  },
})
