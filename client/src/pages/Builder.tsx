import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {parseXML} from '../lib/stepsBuilder';
import { Input } from "@/components/ui/input";
import axios from 'axios';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, FileCode2, Layers, MonitorPlay, Code, Home, Maximize2, Minimize2 } from 'lucide-react';
import { Step } from '../types/index';
import { useNavigate, useLocation } from "react-router-dom";
import { Message, FileNode, StepType } from '../types/index';
import {BACKEND_URL} from '../config';
import FileExplorer from '@/components/FileExplorer';
import PreviewTab from '@/components/PreviewTab';
import useWebcontainer from '../hooks/useWebcontainer';
import createStructuredFiles from '../lib/createStructuredFiles';

const realFiles: Record<any,any> = {
  'package.json': {
    file: {
      contents: `{
        "name": "react-app",
        "version": "1.0.0",
        "main": "index.js",
        "scripts": {
          "start": "react-scripts start"
        },
        "dependencies": {
          "react": "^18.0.0",
          "react-dom": "^18.0.0",
          "react-scripts": "^5.0.0",
          "tailwindcss": "^3.0.0"
        },
        "browserslist": {
          "production": [
            ">0.2%",
            "not dead",
            "not op_mini all"
          ],
          "development": [
            "last 1 chrome version",
            "last 1 firefox version",
            "last 1 safari version"
          ]
        }
      }`,
    },
  },
  'tailwind.config.js': {
    file: {
      contents: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}`
    }
  },
  '.env': {
    file: {
      contents: `FAST_REFRESH=false`,
    },
  },
  public: {
    directory: {
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
          <html>
            <head>
              <title>React App</title>
            </head>
            <body>
              <div id="root"></div>
            </body>
          </html>`
        },
      },
    },
  },
  src: {
    directory: {
      'index.js': {
        file: {
          contents: `import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
        },
      },
      'App.js': {
        file: {
          contents: `import React, { useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  const removeTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Todo App</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task"
          className="border border-blue-300 p-2 rounded-md w-64"
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2 w-72">
        {todos.map((todo, index) => (
          <li key={index} className="flex justify-between items-center bg-white shadow-md p-2 rounded-md">
            {todo}
            <button
              onClick={() => removeTodo(index)}
              className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}`
        },
      },
      'index.css': {
        file: {
          contents: `@tailwind base;
    @tailwind components;
    @tailwind utilities;`
        }
      }
    },
  },
};



function Builder() {
    const navigate = useNavigate();
    const location = useLocation();
    const { webcontainer, isBooted } = useWebcontainer();
    const {prompt, messages } = location.state as { prompt: string, messages: Message[] };
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [steps, setsteps] = useState<Step[]>([]);
    const [contentToDisplay, setContentToDisplay] = useState('');    
    const [files, setFiles] = useState<FileNode[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    // const [chatInput, setChatInput] = useState('');
    // const [messages, setMessages] = useState<Message[]>([]);
    const [llmMessages,setLlmMessages] = useState<{role: "user" | "assistant" ,content: string;}[]>([])
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setchatMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const handleGoHome = () => {
        navigate('/');
        setchatMessages([]);
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) {
        return;
      }
      setchatMessages([...chatMessages, { text: chatInput, sender: 'user' }]);
      const newMessage = {
        role: "user" as "user",
        content: chatInput
      };
      setChatInput('');
      setLoading(true);
      // const addedPrompt = {role:'user',content: 'Important Note: use boltArtifact and boltAction to create a file structure, the way I have used in the prompt. Do not give spacing between files or folders name. Do not add anything irrelavant and only give code. Do not give JSON or any other format.only give like I have given you example.'}; ;
      // const addedPrompt = {role:'user',content: 'Analyse the package.json that I have given and if any dependency is missing which is required for your code output then add it accorndingly. take care of the compatibilty with the other things already existed.'}; ;
      // const addedPrompt = '';
      const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [...llmMessages, newMessage]
      });
      setLoading(false);


      setLlmMessages(x => [...x, newMessage]);
      setLlmMessages(x => [...x, {
        role: "assistant",
        content: stepsResponse.data.response
      }]);

      const newBuildSteps = stepsResponse.data.response;
      const parsedNewBuildSteps = parseXML(newBuildSteps);
      setsteps(s => [...s, ...parsedNewBuildSteps.map(x => ({
        ...x,
        status: "pending" as "pending"
      }))]);

      console.log("New Build Steps are",newBuildSteps);
      console.log("Parsed New Build Steps are",parsedNewBuildSteps);
    };
        
    async function buildSteps() {
        const response = await axios.post(`${BACKEND_URL}/template`, {
            prompt: prompt.trim()
        })

        const {prompts, uiprompts } = response.data;
        const xml = uiprompts[0];
        const uiSteps = parseXML(xml);

        setsteps(uiSteps.map((x: Step) => ({
            ...x,
            status: 'pending'
        })));

        setLoading(true);
        
        // const addedPrompt = 'Important Note: use boltArtifact and boltAction to create a file structure, the way I have used in the prompt. No spacing in file or folder names. Do not add anything irrelavant and only give code.Do not give JSON or any other format only give like I have given you example.';
        // const addedPrompt = 'Analyse the package.json that I have given and if any dependency is missing which is required for your code output then add it accorndingly. take care of the compatibilty with the other things already existed.'
        // const addedPrompt = '';
        const stepResponse = await axios.post(`${BACKEND_URL}/chat`, {
          messages:[...prompts,prompt].map(content => ({role: 'user', content}))
        })

        setLoading(false);
        
        const buildSteps = stepResponse.data.response
        const paresdBuiltSteps = parseXML(buildSteps);

        setsteps( s => [...s,...paresdBuiltSteps.map(content => ({
          ...content,
          status: 'pending' as 'pending'
        }))] )

        setLlmMessages([...prompts,prompt].map(content => ({
          role: 'user',
          content
        })))

        setLlmMessages(x => [...x,{role: 'assistant',content: buildSteps}])
        console.log("Build Steps are",buildSteps);
        console.log("Parsed Build Steps are",paresdBuiltSteps);
    }

    function giveFileStructure() {
        let updatedFiles: FileNode[] = [...files];
        let updateHappened:boolean = false;
        steps.filter((step) => step.status === 'pending').forEach((step) => {
          updateHappened = true;
          if (step.type == StepType.CreateFile) {
            let parsedPath = step.path?.split('/') ?? [];
            let currentFolderName = ''; // 'src'
            let currentFolder = ''; // ''
            
            let lastFolderIndex = -1;
            let theOneToAddIn = updatedFiles;
            let toCheckIn=updatedFiles;
            while (parsedPath.length){
              currentFolderName = parsedPath[0]; // 'src'
              currentFolder =  `${currentFolder}/${parsedPath[0]}`; // '/src'
              const folderIndex = toCheckIn.findIndex((file) => file.path === currentFolder);
              parsedPath = parsedPath.slice(1);
              if (folderIndex === -1) {
                if (!parsedPath.length){
                  theOneToAddIn.push({
                    name: currentFolderName,
                    type: 'file',
                    path: currentFolder,
                    content: step.content
                  })
                  break;
                }
                theOneToAddIn.push({
                  name: currentFolderName,
                  type: 'folder',
                  path: currentFolder,
                  children: []
                })
                lastFolderIndex = theOneToAddIn.length - 1;
                theOneToAddIn = theOneToAddIn[lastFolderIndex].children!;
                
              } else {
                if (!parsedPath.length){
                  toCheckIn[folderIndex].content = step.content;
                  break;
                }
                theOneToAddIn = toCheckIn[folderIndex].children!;
                toCheckIn = toCheckIn[folderIndex].children!;
              }
            }
          } else if (step.type == StepType.RunScript){
            console.log("Run Script is",step.content);
            executeCommands(step.content!);
          }
        })
        if (updateHappened){
          setFiles(updatedFiles);
          setsteps(steps => steps.map((s: Step) => {
            return {
              ...s,
              status: "completed"
            }
            
          }))
        }
    }

    async function executeCommands(command:string) {
      // steps.filter((step) => step.status === 'pending').forEach(async (step) => {
      //   if (step.type === StepType.RunScript) {
      //     // Run the script
      //     // console.log(`Running script: ${step.content}`);
      //     const command = step.content;
      //     try {
      //       const args = command?.split('&&');
      //       if (!args) return;
      //       for (const arg of args) {
      //         const cmdArgs = arg.trim().split(' ');
      //         const process = await webcontainer?.spawn(cmdArgs[0], cmdArgs.slice(1));
      //         await process?.exit;
      //         console.log(`Command executed: ${arg.trim()}`);
      //       }
      //     } catch (error) {
      //       console.error(`Error executing command: ${command}`, error);
      //     }

      //   }
      // });
      console.log("Inside execuetCommands and command is",command)
      try {
        const args = command?.split('&&');
        if (!args) return;
        for (const arg of args) {
          const cmdArgs = arg.trim().split(' ');
          console.log("CommanArgs is",cmdArgs);
          const process = await webcontainer?.spawn(cmdArgs[0], cmdArgs.slice(1));
          await process?.exit;
          console.log(`Command executed: ${arg.trim()}`);
        }
      } catch (error) {
        console.error(`Error executing command: ${command}`, error);
      }
      // await webcontainer?.spawn('npm', [``]);
    }

    useEffect(() => {
      giveFileStructure();
    },[steps,files]);

    useEffect(() => {
        setchatMessages([...messages])
        buildSteps();
    },[]);

    useEffect(() => {
      const mountFiles = async () => {
        const structuredFiles = await createStructuredFiles(files);
        if (isBooted && webcontainer) {
          // console.log("I am mounting files, structuredFiles are", structuredFiles);
          // try{
            webcontainer?.mount(structuredFiles)
          // }
          // catch(e){
          //   console.log("Error in mounting files",e);
          // }
          console.log("Mounted files");
          // executeCommands();
        }
      }
      mountFiles();
    },[webcontainer,files])


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Code2 className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">WebCraft AI</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleGoHome} className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview/Code Area */}
        <div className="w-1/2 border-r border-border p-4">
          <Tabs defaultValue="preview" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-48 grid-cols-2">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <MonitorPlay className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Code
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="preview" className="mt-0">
              <div className="relative w-full h-[calc(100vh-12rem)] bg-card rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <div className="w-full h-full flex items-center justify-center">
                  {/* <p className="text-muted-foreground">Website preview will appear here...</p> */}
                  {/* <PreviewTab webcontainer={webcontainer!} setPreviewUrl={setPreviewUrl}/> */}
                  {!previewUrl ? (
                    <PreviewTab webcontainer={webcontainer!} setPreviewUrl={setPreviewUrl} />
                  ) : (
                    <iframe width="100%" height="100%" src={previewUrl} />
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="mt-0">
              <div className="w-full h-[calc(100vh-12rem)] bg-card rounded-lg p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto h-full">
                  <code>{contentToDisplay}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side Container */}
        <div className="w-1/2 flex">
          {/* Conversation Section */}
          <div className="w-1/2 border-r border-border p-4 flex flex-col h-[calc(100vh-5rem)]">
            <h2 className="text-lg font-semibold mb-4">Conversation</h2>
            <ScrollArea className="flex-1 rounded-md border">
              <div className="p-4 space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`break-words ${
                      message.sender === 'user' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="font-semibold block mb-1">
                      {message.sender === 'user' ? 'You: ' : 'Assistant: '}
                    </span>
                    <div className="pl-4">{message.text}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
             <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
               <Input
                 placeholder="Continue the conversation..."
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 className="flex-1"
               />
               <Button type="submit" size="icon">
                 {/* <Send className="h-4 w-4" /> */}
               </Button>
             </form>
          </div>

          {/* Steps and File Explorer Container */}
          <div className="w-1/2 flex flex-col">
            {/* Steps Section */}
            <div className="h-1/2 border-b border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Build Steps</h2>
              </div>
              <ScrollArea className="h-[calc(50vh-8rem)]">
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === 'completed' ? 'bg-green-500' :
                          step.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                          'bg-muted'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="absolute left-4 top-8 w-px h-8 bg-border" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* File Explorer Section */}
            <div className="h-1/2 p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileCode2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Files</h2>
              </div>
              <div className="h-[calc(50vh-8rem)] overflow-y-auto">
                <FileExplorer files={files} setContentToDisplay = {setContentToDisplay} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Full Screen Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
         <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] p-0">
           <div className="relative w-full h-full bg-card rounded-lg">
             <Button
               variant="ghost"
               size="icon"
               className="absolute top-2 right-2 z-10"
               onClick={() => setIsPreviewOpen(false)}
             >
               <Minimize2 className="h-4 w-4" />
             </Button>
             <div className="w-full h-full flex items-center justify-center">
               {/* <p className="text-muted-foreground">Website preview will appear here...</p> */}
               {/* {previewUrl && <iframe width="100%" height="100%" src={previewUrl} />} */}
               {!previewUrl ? (
                  <p className="text-muted-foreground">Website is being created. Please wait...</p>
                ) : (
                  <iframe width="100%" height="100%" src={previewUrl} />
                )}
             </div>
           </div>
         </DialogContent>
       </Dialog>

    </div>
  );
}

export default Builder