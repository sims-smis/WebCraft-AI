import React, {useState} from 'react'
import { FileNode } from '../types'
import { FileExplorerProps } from '../types';

function File({ file, path, openFolders, setOpenFolders, selectedFile, setSelectedFile, handleFileClick }: {
    file: FileNode;
    path: string;
    openFolders: string[];
    setOpenFolders: React.Dispatch<React.SetStateAction<string[]>>;
    selectedFile: string | null;
    setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
    handleFileClick: (content: string) => void;
}) {
    const fullPath = `${path}/${file.name}`;
    const isSelected = selectedFile === fullPath;

    if (file.type === 'folder') {
        const isOpen = openFolders.includes(fullPath);

        return (
            <div>
                <div
                    className="pl-2 py-1 hover:bg-muted rounded cursor-pointer"
                    onClick={() =>
                        setOpenFolders((prev) =>
                            isOpen
                                ? prev.filter((name) => name !== fullPath)
                                : [...prev, fullPath]
                        )
                    }
                >
                    {isOpen ? '📂' : '📁'} {file.name}
                </div>
                {isOpen && (
                    <div className="pl-4">
                        {file.children?.map((child) => (
                            <File
                                key={child.name}
                                file={child}
                                path={fullPath}
                                openFolders={openFolders}
                                setOpenFolders={setOpenFolders}
                                selectedFile={selectedFile}
                                setSelectedFile={setSelectedFile}
                                handleFileClick={handleFileClick}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={`pl-6 py-1 rounded cursor-pointer ${
                isSelected ? 'bg-blue-300' : 'hover:bg-muted'
            }`}
            onClick={() => {
                setSelectedFile(fullPath)
                handleFileClick(file.content || 'No content available');
            }}
        >
            📄 {file.name}
        </div>
    );
}


function FileExplorer({ files, setContentToDisplay }: FileExplorerProps) {
    const [openFolders, setOpenFolders] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const handleFileClick = (content: string) => {
        setContentToDisplay(content);
    }

    return (
        <div>
            {files.map((file) => (
                <File
                    key={file.name}
                    file={file}
                    path=""
                    openFolders={openFolders}
                    setOpenFolders={setOpenFolders}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    handleFileClick={handleFileClick}
                />
            ))}
        </div>
    )
}

export default FileExplorer