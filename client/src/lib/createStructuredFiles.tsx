/** @satisfies {import('@webcontainer/api').FileSystemTree} */
import { FileNode } from '../types/index'

async function createStructuredFiles(files: FileNode[]): Promise<Record<string, any>> {
  // Read this function, I didn't make this one

    const structuredFiles: Record<string, any> = {};

    const processFile = (file: FileNode, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          // For folders, create a directory entry
          structuredFiles[file.name] = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            structuredFiles[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
        return structuredFiles[file.name];
    };

    files.forEach(file => processFile(file, true));

    return structuredFiles
}

export default createStructuredFiles