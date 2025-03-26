import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from 'react'
import { useState } from 'react';
import { Code2, MoveRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { Message } from "../types/index";

    

function Home() {

    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const messages: Message[] = [];


    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
        messages.push({ text: prompt, sender: 'user' });
        navigate('/builder', { state: { prompt, messages } });
    }
    };

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
                            Build <MoveRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}

export default Home