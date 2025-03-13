import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, FileCode2, Layers, MonitorPlay, Code, MoveRight } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedFile, setSelectedFile] = useState('App.tsx');

  const steps: Step[] = [
    {
      title: 'Analyzing Prompt',
      description: 'Understanding your requirements and planning the structure',
      status: 'completed'
    },
    {
      title: 'Setting Up Project',
      description: 'Creating necessary files and installing dependencies',
      status: 'processing'
    },
    {
      title: 'Building Components',
      description: 'Developing UI components based on specifications',
      status: 'pending'
    },
    {
      title: 'Styling',
      description: 'Applying styles and ensuring responsive design',
      status: 'pending'
    },
    {
      title: 'Testing',
      description: 'Performing quality checks and optimizations',
      status: 'pending'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setIsBuilding(true);
    }
  };

  const fileContents = {
    'App.tsx': `import React from 'react';
import { Button } from './components/Button';

function App() {
  return (
    <div className="app">
      <h1>Hello World</h1>
      <Button>Click me</Button>
    </div>
  );
}

export default App;`,
    'index.tsx': `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
    'styles.css': `.app {
  text-align: center;
  padding: 2rem;
}

.button {
  background: blue;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}`,
  };

  if (!isBuilding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 bg-card">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <Code2 className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold text-primary">WebCraft AI</h1>
            </div>
            <p className="text-muted-foreground text-center max-w-md">
              Describe your dream website, and let our AI bring it to life. From simple landing pages to complex web applications, we've got you covered.
            </p>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <Input
                placeholder="Describe your website (e.g., 'Create a modern portfolio website with a dark theme...')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-24 px-4 py-2 text-base"
              />
              <Button type="submit" className="w-full">
                Generate Website <MoveRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Steps Sidebar */}
      <div className="w-1/4 border-r border-border p-4">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Build Steps</h2>
        </div>
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
      </div>

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
            <div className="w-full h-[calc(100vh-12rem)] bg-card rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Website preview will appear here...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="mt-0">
            <div className="w-full h-[calc(100vh-12rem)] bg-card rounded-lg p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto h-full">
                <code>{fileContents[selectedFile as keyof typeof fileContents]}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* File Explorer */}
      <div className="w-1/4 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileCode2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Files</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-2">
            <div className="text-sm">
              <div className="pl-2 py-1 hover:bg-muted rounded cursor-pointer">
                📁 src/
              </div>
              <div 
                className={`pl-6 py-1 hover:bg-muted rounded cursor-pointer ${selectedFile === 'App.tsx' ? 'bg-muted' : ''}`}
                onClick={() => setSelectedFile('App.tsx')}
              >
                📄 App.tsx
              </div>
              <div 
                className={`pl-6 py-1 hover:bg-muted rounded cursor-pointer ${selectedFile === 'index.tsx' ? 'bg-muted' : ''}`}
                onClick={() => setSelectedFile('index.tsx')}
              >
                📄 index.tsx
              </div>
              <div 
                className={`pl-6 py-1 hover:bg-muted rounded cursor-pointer ${selectedFile === 'styles.css' ? 'bg-muted' : ''}`}
                onClick={() => setSelectedFile('styles.css')}
              >
                📄 styles.css
              </div>
              <div className="pl-2 py-1 hover:bg-muted rounded cursor-pointer">
                📁 components/
              </div>
              <div className="pl-6 py-1 hover:bg-muted rounded cursor-pointer">
                📄 Header.tsx
              </div>
              <div className="pl-6 py-1 hover:bg-muted rounded cursor-pointer">
                📄 Footer.tsx
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default App;