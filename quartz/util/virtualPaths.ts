import { FilePath } from "./path";

/**
 * The virtual path map must map each physical file path to a unique virtual file path.
 */ 
export function getVirtualPathMap(markdownFiles: FilePath[]): Map<FilePath, FilePath> {
  const virtualPathMap = new Map<FilePath, FilePath>();

  // dummy logic, flatten directory structure, making sure values are unique
  const virtualPaths = new Set<FilePath>();
  for (const filePath of markdownFiles) {
    if (!filePath.endsWith(".md")) {
      virtualPathMap.set(filePath, filePath);
      continue;
    }

    const fileName = filePath.split("/").pop() as FilePath;
    if (!virtualPaths.has(fileName)) {
      virtualPathMap.set(filePath, fileName);
      virtualPaths.add(fileName);
    }
  }

  return virtualPathMap;
}