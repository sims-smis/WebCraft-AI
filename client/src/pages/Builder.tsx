import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {parseXML} from '../lib/stepsBuilder';
import axios from 'axios';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, FileCode2, Layers, MonitorPlay, Code, Home, Maximize2, Minimize2, Send } from 'lucide-react';
import { Step } from '../types/index';
import { useNavigate, useLocation } from "react-router-dom";
import { Message, FileNode, StepType } from '../types/index';
import {BACKEND_URL} from '../config';
import FileExplorer from '@/components/FileExplorer';
import PreviewTab from '@/components/PreviewTab';
import useWebcontainer from '../hooks/useWebcontainer';
import createStructuredFiles from '../lib/createStructuredFiles';
import Loading from '@/components/ui/Loading';
import { Textarea } from '@/components/ui/textarea';


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
      setLoading(true);
      try{
        setchatMessages([...chatMessages, { text: chatInput, sender: 'user' }]);
        const newMessage = {
          role: "user" as "user",
          content: chatInput
        };
        setChatInput('');
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

      }
      catch(e){
      }finally{
        setLoading(false);
      }
    };
        
    async function buildSteps() {
      try{
        const response = await axios.post(`${BACKEND_URL}/template`, {
            prompt: prompt.trim()
        })

        const {prompts, uiprompts } = response.data;
        const xml = uiprompts[0];
        const uiSteps = parseXML(xml);

        setLoading(true);

        setsteps(uiSteps.map((x: Step) => ({
            ...x,
            status: 'pending'
        })));

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
      }
      catch(e){
      }finally{
        setLoading(false);
      }

    }

    function giveFileStructure() {
        let updatedFiles: FileNode[] = [...files];
        let updateHappened:boolean = false;
        setLoading(true);
        steps.filter((step) => step.status === 'pending').forEach((step) => {
          updateHappened = true;
          step.status = 'processing';
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
            executeCommands(step.content!);
          }
          step.status = 'completed';
        })
        setLoading(false);
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
      try {
        const args = command?.split('&&');
        if (!args) return;
        for (const arg of args) {
          const cmdArgs = arg.trim().split(' ');
          const process = await webcontainer?.spawn(cmdArgs[0], cmdArgs.slice(1));
          await process?.exit;
        }
      } catch (error) {
        console.error(`Error executing command: ${command}`, error);
      }
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
            webcontainer?.mount(structuredFiles)
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
        <div className="w-[55%] border-r border-border p-4">
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
                  className="absolute top-2 right-2 z-10 bg-black/70 text-white hover:bg-black/80"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Maximize2 className=" h-4 w-4" />
                </Button>
                <div className="w-full h-full flex items-center justify-center">
                  {loading ? (
                    <Loading />
                  ) : !previewUrl ? (
                    <PreviewTab webcontainer={webcontainer!} setPreviewUrl={setPreviewUrl} />
                  ) : (
                    <iframe width="100%" height="100%" src={previewUrl} />
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="mt-0">
                <div className="w-full h-[calc(100vh-12rem)] bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-4 shadow-lg border border-[#3c3c3c] flex items-center justify-center">
                  {contentToDisplay ? (
                    <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto h-full w-full">
                      <code className="text-[#d4d4d4]">{contentToDisplay}</code>
                    </pre>
                  ) : (
                    <div className="text-center text-[#808080] italic">
                      <p className="text-xl font-semibold">🗂️ No File Selected</p>
                      <p className="mt-1 text-sm">Please select a file to view its content.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
          </Tabs>
        </div>

        {/* Right Side Container */}
        <div className="w-[45%] flex">
          {/* Conversation Section */}
          <div className="w-[55%] border-r border-border p-4 flex flex-col h-[calc(100vh-5rem)]">
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
            <form onSubmit={handleChatSubmit} className="mt-4 flex flex-col gap-2">
              <Textarea
                placeholder="Continue the conversation..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="h-24 resize-none overflow-y-auto break-words"
              />
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" /> Send
              </Button>
            </form>
          </div>

          {/* Steps and File Explorer Container */}
          <div className="w-[45%] flex flex-col">
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
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
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
               className="absolute top-2 right-2 z-10 bg-black/70 text-white hover:bg-black/80"
               onClick={() => setIsPreviewOpen(false)}
             >
               <Minimize2 className="h-4 w-4" />
             </Button>
             <div className="w-full h-full flex items-center justify-center">
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