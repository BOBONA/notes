import { QuartzTransformerPlugin } from "../types";

/**
 * To deal with KateX's handling of math delimiters, we need to ensure:
 *    1. Block math ($$...$$) is always on its own lines.
 *    2. Inline math ($...$) does not have consecutive dollar signs 
 *       (e.g., $...$$...$ should be merged to $...$).
 */ 
export const FixDoubleDollar: QuartzTransformerPlugin = () => ({
  name: "FixDoubleDollar",
  textTransform: (_ctx, src: string) => {
    return processSource(src);
  },
});

function isEscaped(str: string, index: number): boolean {
  let backslashCount = 0;
  let i = index - 1;
  
  while (i >= 0 && str[i] === "\\") {
    backslashCount++;
    i--;
  }
  
  return backslashCount % 2 === 1;
}

function processSource(src: string): string {
  let result = "";
  let i = 0;

  while (i < src.length) {
    if (src[i] === "$" && !isEscaped(src, i)) {
      if (i < src.length - 1 && src[i + 1] === "$") {  // $$ detected
        let j = i + 2;
        let foundClosing = false;
        
        while (j < src.length - 1) {
          if (src[j] === "$" && !isEscaped(src, j) && 
              src[j + 1] === "$") {
            foundClosing = true;
            break;
          }
          j++;
        }
        
        // If we found a closing $$, treat as block delimiters and 
        // ensure each $$ is on its own line
        if (foundClosing) {
          if (result.length > 0 && !result.endsWith("\n")) {
            result += "\n";
          }
          result += "$$\n";
          
          i += 2; 
          
          let blockContent = "";
          while (i < j) {
            blockContent += src[i];
            i++;
          }
          
          result += blockContent.trim();
          
          result += "\n$$";
          i += 2; 
          
          if (i < src.length && src[i] !== "\n") {
            result += "\n";
          }
          
          continue;
        }
      }
      
      // Single $ detected
      let inlineMath = "";
      i++; 
      
      while (i < src.length) {
        if (src[i] === "$" && !isEscaped(src, i)) {
          // We only want to close on a single $, so check for consecutive $
          i++;
          
          if (i < src.length && src[i] === "$" && !isEscaped(src, i)) {
            i++;
            continue;
          } else {
            // Finished with this inline math block
            break;
          }
        }
        inlineMath += src[i];
        i++;
      }
      
      // Now add the complete inline math block to result
      result += "$" + inlineMath + "$";
    } else {
      result += src[i];
      i++;
    }
  }

  return result;
}