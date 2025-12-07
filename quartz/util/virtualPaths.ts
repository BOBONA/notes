import { FilePath, joinSegments } from "./path";
import matter from "gray-matter";
import { resolveRelative, FullSlug, SimpleSlug } from "./path";
import { read } from "to-vfile";
import { styleText } from "util";
import { BuildCtx } from "./ctx";

interface FileNode {
  value: string;
  isFile: boolean;
  children: Map<string, FileNode>;
}

/**
 * Build a tree structure from file paths
 */
function buildTree(files: FilePath[]): FileNode {
  const root: FileNode = { value: '', isFile: false, children: new Map() };
  
  for (const filePath of files) {
    const parts = filePath.split('/');
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!currentNode.children.has(part)) {
        currentNode.children.set(part, { 
          value: part,
          isFile: i === parts.length - 1,
          children: new Map()
        });
      }
      currentNode = currentNode.children.get(part)!;
    }
  }
  
  return root;
}

/**
 * Resolve a path (absolute or relative) against a base path
 */
function resolvePath(basePath: FilePath, targetPath: string): FilePath {
  if (targetPath.startsWith('/')) {
    return targetPath.substring(1) as FilePath;
  }
  
  return resolveRelative(basePath.toString() as FullSlug, targetPath as SimpleSlug).toString() as FilePath;
}

/**
 * Resolve files
 */
async function resolveFiles(
  sourceDirectory: string,
  node: FileNode,
  currentPath: string,
  virtualPath: string,
  virtualPathMap: Map<FilePath, FilePath>,
  claimedVirtualPaths: Set<FilePath>,
): Promise<void> {
  if (node.value !== '') {
    const frontmatterPath = node.isFile ? `${currentPath}/${node.value}` : `${currentPath}/${node.value}/index.md`;

    // check if frontmatterPath exists
    if (node.value !== 'index.md') {
      try {
        const { value } = await read(joinSegments(sourceDirectory, frontmatterPath));
        const { data } = matter(value.toString());
        if (data && data.path) {
          let resolvedVirtualPath = resolvePath(currentPath as FilePath, data.path as string);
          if (resolvedVirtualPath.endsWith('/')) {
            resolvedVirtualPath = resolvedVirtualPath.slice(0, -1) as FilePath;
          }
          virtualPath = resolvedVirtualPath;
        }
      } catch (e) {
        // file does not exist, ignore
      }
    }

    currentPath = currentPath ? `${currentPath}/${node.value}` : node.value;
    virtualPath = virtualPath ? `${virtualPath}/${node.value}` : node.value;
  }

  if (node.isFile && node.value) {
    const physicalPath = currentPath as FilePath;
    let assignedVirtualPath = virtualPath as FilePath;

    if (claimedVirtualPaths.has(assignedVirtualPath)) {
      console.log(styleText("yellow", `Warning: Virtual path conflict for ${assignedVirtualPath}, ignoring file ${physicalPath}`));
    } else {
      virtualPathMap.set(physicalPath, assignedVirtualPath);
      claimedVirtualPaths.add(assignedVirtualPath);
    }

    return;
  }

  for (const [, childNode] of node.children) {    
    await resolveFiles(sourceDirectory, childNode, currentPath, virtualPath, virtualPathMap, claimedVirtualPaths);
  }
}

/**
 * The virtual path map must map each physical file path to a unique virtual file path.
 */
export async function getVirtualPathMap(ctx: BuildCtx, allFiles: FilePath[]): Promise<Map<FilePath, FilePath>> {
  const virtualPathMap = new Map<FilePath, FilePath>();
  const claimedVirtualPaths = new Set<FilePath>();

  let markdownFiles = []
  for (const file of allFiles) {
    if (file.endsWith('.md')) {
      markdownFiles.push(file);
    } else {
      virtualPathMap.set(file, file);
      claimedVirtualPaths.add(file);
    }
  }
  
  const tree = buildTree(markdownFiles);
  
  await resolveFiles(ctx.argv.directory, tree, '', '', virtualPathMap, claimedVirtualPaths);
  
  return virtualPathMap;
}