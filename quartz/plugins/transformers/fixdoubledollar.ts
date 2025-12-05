import { QuartzTransformerPlugin } from "../types";

// This is needed with KaTeX 
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
  
  // If odd number of backslashes, the character is escaped
  return backslashCount % 2 === 1;
}

function processSource(src: string): string {
  let result = "";
  let i = 0;

  while (i < src.length) {
    // Check for unescaped $ (start of inline or block math)
    if (src[i] === "$" && !isEscaped(src, i)) {
      // Check if it's $$
      if (i < src.length - 1 && src[i + 1] === "$") {
        // Look for the closing $$
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
        
        // If we found a closing $$, treat as block delimiters
        if (foundClosing) {
          // Ensure opening $$ is on its own line
          if (result.length > 0 && !result.endsWith("\n")) {
            result += "\n";
          }
          result += "$$\n";
          
          i += 2; // skip opening $$
          
          // Collect content until closing $$
          let blockContent = "";
          while (i < j) {
            blockContent += src[i];
            i++;
          }
          
          // Add content (trim to remove extra whitespace)
          result += blockContent.trim();
          
          // Ensure closing $$ is on its own line
          result += "\n$$";
          i += 2; // skip closing $$
          
          // Add newline after closing $$ if there's more content
          if (i < src.length && src[i] !== "\n") {
            result += "\n";
          }
          
          continue;
        }
        
        // Otherwise, it's inline math starting with $
        // The second $ will be handled as closing the first inline block
      }
      
      // Process inline math: collect $...$, merging consecutive blocks
      let inlineMath = "";
      i++; // skip opening $
      
      while (i < src.length) {
        if (src[i] === "$" && !isEscaped(src, i)) {
          // Found closing $ - but check if immediately followed by another $
          i++; // move past this closing $
          
          // Check if next is $ (start of another inline block to merge)
          if (i < src.length && src[i] === "$" && !isEscaped(src, i)) {
            // This is $$, skip the second $ to continue the inline block
            i++; // skip the second $
            // Continue collecting in the same inline block
            continue;
          } else {
            // Not followed by $, so we're done with this inline block
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