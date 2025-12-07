import { read } from "to-vfile"
import { QuartzFilterPlugin } from "../types"
import matter from "gray-matter"
import { styleText } from "util"

export const RemoveDrafts: QuartzFilterPlugin<{}> = () => ({
  name: "RemoveDrafts",
  async shouldPublish(_ctx, path) {
    const file = await read(path)
    const content = file.toString().trim()

    if (!content) {
      console.log(styleText("yellow", `Warning: File at ${path} read as empty, RemoveDrafts will not exclude it by default.`))
      return true
    }

    const fm = matter(content)
    const draftFlag = fm.data?.draft === "true"

    return !draftFlag
  },
})
