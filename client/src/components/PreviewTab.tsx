import { WebContainer } from "@webcontainer/api";
import { Terminal } from '@xterm/xterm';
import {useState, useEffect, useRef} from 'react';
import '@xterm/xterm/css/xterm.css';

function PreviewTab({webcontainer, setPreviewUrl}: {webcontainer: WebContainer, setPreviewUrl: React.Dispatch<React.SetStateAction<string>>}) {
    const [url, setUrl] = useState("");
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal | null>(null);

    async function runWebcontainer() {
        webcontainer.on('server-ready', (port, url) => {
            setUrl(url);
            setPreviewUrl(url);
        });
    
        const installDependencies = await webcontainer.spawn('npm', ['install']);
        installDependencies.output.pipeTo(new WritableStream({
            write(data) {
                terminal.current?.write(data);
            }
        }));
    
        await installDependencies.exit;
    
        const startServer = await webcontainer.spawn('npm', ['run','dev']);
        startServer.output.pipeTo(new WritableStream({
            write(data) {
                terminal.current?.write(data);
            }
        }));
    }
    
    useEffect(()=>{
        runWebcontainer();
    },[webcontainer])

    useEffect(()=>{
        if (terminalRef.current && !terminal.current) {
            terminal.current = new Terminal({ convertEol: true });
            terminal.current.open(terminalRef.current);
            terminal.current.write('Terminal initialized...\r\n');
        }
    },[])
    
    return (
        <>
            <div className="h-full w-full flex items-center justify-center text-gray-400">
            {!url && <div className="text-center">
                <div ref={terminalRef} className="terminal"></div>
            </div>}
            {url && <iframe width={"100%"} height={"100%"} src={url} />}
            </div>
        </>
    )
}

export default PreviewTab
