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

      let pageHtml = renderPage(cfg, slug, componentData, opts, externalResources)

      const basePath = new URL(cfg.baseUrl ?? "/", "https://example.com").pathname.replace(/\/$/, "")

      // Inject script to set actual requested slug for the explorer
      const script = `
<script>
const stripSlashes = (s) => s.replace(/^\\/+/, '').replace(/\\/+$/, '');
const endsWith = (s, suffix) => s === suffix || s.endsWith('/' + suffix);
const sluggify = (str) => str
  .split('/')
  .map(seg => seg.replace(/\\s/g, '-').replace(/&/g, '-and-').replace(/%/g, '-percent').replace(/\\?/g, '').replace(/#/g, ''))
  .join('/');

const slugifyFilePath = (fp) => {
  fp = stripSlashes(fp);
  let extMatch = fp.match(/\\.[A-Za-z0-9]+$/);
  let ext = extMatch ? extMatch[0] : '';
  const withoutFileExt = fp.replace(new RegExp(ext + "$"), '');
  ext = ''; // remove extension for explorer
  let slug = sluggify(withoutFileExt);
  if (endsWith(slug, '_index')) slug = slug.replace(/_index$/, 'index');
  return slug;
}

let pathFromBase = window.location.pathname;
if (pathFromBase.startsWith("${basePath}")) pathFromBase = pathFromBase.slice(${basePath.length});
pathFromBase = stripSlashes(pathFromBase);
const slug = slugifyFilePath(pathFromBase);
document.body.dataset.slug = slug;

console.log("404 page script set slug to:", slug);
</script>
`
      
      pageHtml = pageHtml.replace("</body>", `${script}</body>`)

      yield write({
        ctx,
        content: pageHtml,
        slug,
        ext: ".html",
      })
    },

    async *partialEmit() {},
  }
}
