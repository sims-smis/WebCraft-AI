export interface Step {
    title: string;
    description: string;
    status: 'pending' | 'processing' | 'completed';
    type: StepType;
    content?: string;
    path?: string;
}

export enum StepType {
  CreateFile,
  CreateFolder,
  EditFile,
  DeleteFile,
  RunScript
}

export type FileNode = {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[]; // Only folders will have children
  content?: string; // Only files will have contents
};


export interface Message {
  text: string;
  sender: 'user' | 'assistant';
}

export interface FileExplorerProps {
  files: FileNode[];
  setContentToDisplay: (content: string) => void;
}