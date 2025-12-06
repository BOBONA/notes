import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { ProcessedContent, QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import path from "path"
import {
  FullSlug,
  SimpleSlug,
  stripSlashes,
  joinSegments,
  pathToRoot,
  simplifySlug,
  FilePath,
} from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { FolderContent } from "../../components"
import { write } from "./helpers"
import { i18n, TRANSLATIONS } from "../../i18n"
import { BuildCtx } from "../../util/ctx"
import { StaticResources } from "../../util/resources"
interface FolderPageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

async function* processFolderInfo(
  ctx: BuildCtx,
  folderInfo: Record<SimpleSlug, ProcessedContent>,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
) {
  for (const [folder, folderContent] of Object.entries(folderInfo) as [
    SimpleSlug,
    ProcessedContent,
  ][]) {
    const slug = joinSegments(folder, "index") as FullSlug
    const [tree, file] = folderContent
    const cfg = ctx.cfg.configuration
    const externalResources = pageResources(pathToRoot(slug), resources)
    const componentData: QuartzComponentProps = {
      ctx,
      fileData: file.data,
      externalResources,
      cfg,
      children: [],
      tree,
      allFiles,
    }

    const content = renderPage(cfg, slug, componentData, opts, externalResources)
    yield write({
      ctx,
      content,
      slug,
      ext: ".html",
    })
  }
}

function computeFolderInfo(
  folders: Set<[SimpleSlug, SimpleSlug]>,
  content: ProcessedContent[],
  locale: keyof typeof TRANSLATIONS,
): Record<SimpleSlug, ProcessedContent> {
  // Create default folder descriptions
  const folderInfo: Record<SimpleSlug, ProcessedContent> = Object.fromEntries(
    [...folders].map((folder) => [
      folder[1],
      defaultProcessedContent({
        slug: joinSegments(folder[1], "index") as FullSlug,
        frontmatter: {
          title: `${folder[0].split("/").pop()}`,
          tags: [],
        },
      }),
    ]),
  )

  // Update with actual content if available
  const folderSlugs = new Set([...folders].map((f) => f[1]))
  for (const [tree, file] of content) {
    const slug = stripSlashes(simplifySlug(file.data.slug!)) as SimpleSlug
    if (folderSlugs.has(slug)) {
      folderInfo[slug] = [tree, file]
    }
  }

  return folderInfo
}

function _getFolders(file: FullSlug): SimpleSlug[] {
  var folderName = path.dirname(file ?? "") as SimpleSlug

  const parentFolderNames = [folderName]

  while (folderName !== ".") {
    folderName = path.dirname(folderName ?? "") as SimpleSlug
    parentFolderNames.push(folderName)
  }
  
  return parentFolderNames.filter((folderName) => folderName !== "." && folderName !== "tags")
}

export const FolderPage: QuartzEmitterPlugin<Partial<FolderPageOptions>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: FolderContent({ sort: userOpts?.sort }),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "FolderPage",
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
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration

      const zip = (a: any, b: any) => a.map((k: any, i: number) => [k, b[i]])

      const folders: Set<[SimpleSlug, SimpleSlug]> = new Set(
        allFiles.flatMap((data) => {
          return data.slug
            ? zip(_getFolders(data.relativePath?.toString() as FullSlug), _getFolders(data.slug))
            : []
        }),
      )

      const folderInfo = computeFolderInfo(folders, content, cfg.locale)
      yield* processFolderInfo(ctx, folderInfo, allFiles, opts, resources)
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration

      // Find all folders that need to be updated based on changed files
      const affectedFolders: Set<[SimpleSlug, SimpleSlug]> = new Set()
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue

        const zip = (a: any, b: any) => a.map((k: any, i: number) => [k, b[i]])
        const pathFolders = _getFolders(changeEvent.file.data.relativePath?.toString() as FullSlug)
        const slugFolders = _getFolders(changeEvent.file.data.slug as FullSlug)

        zip(pathFolders, slugFolders).forEach((folderPair: [SimpleSlug, SimpleSlug]) => affectedFolders.add(folderPair))
      }

      // If there are affected folders, rebuild their pages
      if (affectedFolders.size > 0) {
        const folderInfo = computeFolderInfo(affectedFolders, content, cfg.locale)
        yield* processFolderInfo(ctx, folderInfo, allFiles, opts, resources)
      }
    },
  }
}
