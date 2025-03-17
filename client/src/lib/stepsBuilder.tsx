import { Step, StepType } from '../types/index'
/*
 * Parse input XML and convert it into steps.
 * Eg: Input - 
 * <boltArtifact id=\"project-import\" title=\"Project Files\">
 *  <boltAction type=\"file\" filePath=\"eslint.config.js\">
 *      import js from '@eslint/js';\nimport globals from 'globals';\n
 *  </boltAction>
 * <boltAction type="shell">
 *      node index.js
 * </boltAction>
 * </boltArtifact>
 * 
 * Output - 
 * [{
 *      title: "Project Files",
 *      status: "Pending"
 * }, {
 *      title: "Create eslint.config.js",
 *      type: StepType.CreateFile,
 *      code: "import js from '@eslint/js';\nimport globals from 'globals';\n"
 * }, {
 *      title: "Run command",
 *      code: "node index.js",
 *      type: StepType.RunScript
 * }]
 * 
 * The input can have strings in the middle they need to be ignored
 */

export async function parseXML(xml: string): Promise<Step[]> {

  const steps : Step[] = [];
  try {
    const artifactMatch = xml.match(/<boltArtifact.*?>([\s\S]*?)<\/boltArtifact>/);
    if (!artifactMatch) return steps;

    const artifactContent = artifactMatch[1];
    const artifactTitleMatch = xml.match(/<boltArtifact.*?title="(.*?)"/);
    const title = artifactTitleMatch ? artifactTitleMatch[1] : 'Untitled';
    
    steps.push({
        title,
        description: '',
        status: "pending",
        type: StepType.CreateFolder
    });

    const actions = artifactContent.match(/<boltAction.*?>[\s\S]*?<\/boltAction>/g) || [];

    for (const action of actions) {
      const typeMatch = action.match(/type="(.*?)"/);
      const type = typeMatch ? typeMatch[1] : '';

      if (type === 'file') {
          const filePathMatch = action.match(/filePath="(.*?)"/);
          const filePath = filePathMatch ? filePathMatch[1] : 'Unknown file';
          const code = action.replace(/<[^>]*>/g, '').trim();
          steps.push({
              title: `Create ${filePath}`,
              description: `Creating file at ${filePath}`,
              status: "pending",
              type: StepType.CreateFile,
              content: code,
              path: filePath
          });
      } else if (type === 'shell') {
          const code = action.replace(/<[^>]*>/g, '').trim();
          steps.push({
              title: "Run command",
              description: "Executing shell command",
              status: "pending",
              type: StepType.RunScript,
              content: code,
          });
      }
    }
  } catch (error) {
      console.error("Error parsing XML:", error);
  }
  return steps;
}

export default parseXML
// export default stepsBuilder