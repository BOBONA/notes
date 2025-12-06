import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { FullSlug, RelativeURL } from "../../util/path"
import { sharedPageComponents, defaultListPageLayout } from "../../../quartz.layout"
import { NotFound } from "../../components"
import { defaultProcessedContent } from "../vfile"
import { write } from "./helpers"
import { i18n } from "../../i18n"

export const NotFoundPage: QuartzEmitterPlugin = () => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: NotFound(),
  }

  opts.beforeBody = []

  const {
    head: Head,
    header,
    beforeBody,
    pageBody,
    afterBody,
    left,
    right,
    footer: Footer,
  } = opts

  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "404Page",

    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },

    async *emit(ctx, _content, resources) {
      const cfg = ctx.cfg.configuration
      const slug = "404" as FullSlug
      const title = i18n(cfg.locale).pages.error.title

      const [tree, vfile] = defaultProcessedContent({
        slug,
        text: title,
        description: title,
        frontmatter: { title, tags: [] },
      })

      const externalResources = pageResources("/" as RelativeURL, resources)

      const componentData: QuartzComponentProps = {
        ctx,
        fileData: vfile.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles: [],
      }

      yield write({
        ctx,
        content: renderPage(cfg, slug, componentData, opts, externalResources),
        slug,
        ext: ".html",
      })
    },

    async *partialEmit() {},
  }
}
