// import React from 'react'
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import {parseXML} from '../lib/stepsBuilder';
import axios from 'axios';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Code2, FileCode2, Layers, MonitorPlay, Code, Home, Maximize2, Minimize2 } from 'lucide-react';
import { Step } from '../types/index';
import { useNavigate, useLocation } from "react-router-dom";
import { Message, FileNode, StepType } from '../types/index';
import {BACKEND_URL} from '../config';
import FileExplorer from '@/lib/fileExplorer';
const files: FileNode[] = [];


function Builder() {
    const navigate = useNavigate();
    const location = useLocation();
    const {prompt, messages } = location.state as { prompt: string, messages: Message[] };
    // const [chatInput, setChatInput] = useState('');
    // const [messages, setMessages] = useState<Message[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [steps, setsteps] = useState<Step[]>([]);
    const [contentToDisplay, setContentToDisplay] = useState('');    
      // const handleChatSubmit = (e: React.FormEvent) => {
      //   e.preventDefault();
      //   if (chatInput.trim()) {
      //   //   setMessages([...messages, { text: chatInput, sender: 'user' }]);
      //     setChatInput('');
      //   }
      // };
    
      const handleGoHome = () => {
        navigate('/');
        // setMessages([]);
      };
        
    async function buildSteps() {
        const response = await axios.post(`${BACKEND_URL}/template`, {
            prompt: prompt.trim()
        })

        const { uiprompts } = response.data;
        const xml = uiprompts[0];
        const buildingSteps = await parseXML(xml);
        setsteps(buildingSteps);
        console.log(buildingSteps);
    }

    function giveFileStructure() {
        steps.forEach((step) => {
          if (step.type == StepType.CreateFile) {
            let parsedPath = step.path?.split('/') ?? [];
            let currentFolderName = ''; // 'src'
            let currentFolder = ''; // ''
            
            let lastFolderIndex = -1;
            let theOneToAddIn = files;
            let toCheckIn=files;
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
                theOneToAddIn = toCheckIn[folderIndex].children!;
                toCheckIn = toCheckIn[folderIndex].children!;
              }
            }
          }
        })
    }

    useEffect(() => {
      giveFileStructure();
    },[steps]);

    useEffect(() => {
        buildSteps();
      
    },[]);

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
                  <p className="text-muted-foreground">Website preview will appear here...</p>
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
                {messages.map((message, index) => (
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
            {/* <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
              <Input
                placeholder="Continue the conversation..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form> */}
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
              <p className="text-muted-foreground">Website preview will appear here...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Builder