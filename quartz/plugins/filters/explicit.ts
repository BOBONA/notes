import matter from "gray-matter"
import { QuartzFilterPlugin } from "../types"
import { read } from "to-vfile"
import { styleText } from "util"

export const ExplicitPublish: QuartzFilterPlugin = () => ({
  name: "ExplicitPublish",
  async shouldPublish(_ctx, path) {
    const file = await read(path)
    const content = file.toString().trim()

    if (!content) {
      console.log(styleText("yellow", `Warning: File at ${path} read as empty, ExplicitPublish will not exclude it by default.`))
      return true
    }

    const fm = matter(content)
    const publish = fm.data?.publish === "true"

    return publish
  },
})
