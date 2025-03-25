// import { WebContainer } from "@webcontainer/api";
// // import { FileNode } from "../types/index";
// import { Terminal } from '@xterm/xterm';
// import {useState, useEffect, useRef} from 'react';
// // import { FitAddon } from '@xterm/addon-fit';
// import '@xterm/xterm/css/xterm.css';

// function PreviewTab({webcontainer}: {webcontainer: WebContainer}) {
//     // const { webcontainer, isBooted } = useWebcontainer();
//     // console.log('webcontainer issss', webcontainer);
//     // const iframeRef = useRef<HTMLIFrameElement>(null);
//     // console.log("Inside preview tab", files);
//     console.log("Inside PreviewTab and webcontainer is", webcontainer);
//     const [url, setUrl] = useState("");
//     const terminalRef = useRef<HTMLDivElement>(null);
//     const terminal = useRef<Terminal | null>(null);
//     // const hasStartedRef = useRef(false);

//     async function runWebcontainer() {
//         // await webcontainer.spawn('pkill', ['-f', 'node']);

//         // if (hasStartedRef.current) return;  // Prevents duplicate execution
//         // hasStartedRef.current = true;
//         webcontainer.on('server-ready', (port, url) => {
//             console.log('server is ready and running at port ', port, ' and url is ', url);
//             setUrl(url);
//         });
    
//         const installDependencies = await webcontainer.spawn('npm', ['install']);
//         console.log("Installed dependencies");
//         installDependencies.output.pipeTo(new WritableStream({
//             write(data) {
//                 console.log(data);
//                 terminal.current?.write(data);
//             }
//         }));
    
//         const exitCode = await installDependencies.exit;
//         console.log("Exit code", exitCode);
    
//         const startServer = await webcontainer.spawn('npm', ['start']);
//         startServer.output.pipeTo(new WritableStream({
//             write(data) {
//                 console.log("ayyeeeeeeee")
//                 console.log(data);
//                 terminal.current?.write(data);
//             }
//         }));
//         console.log("Running server");
//     }
    
//     useEffect(()=>{
//         runWebcontainer();
//     },[webcontainer])

//     useEffect(()=>{
//         if (terminalRef.current && !terminal.current) {
//             terminal.current = new Terminal({ convertEol: true });
//             terminal.current.open(terminalRef.current);
//             terminal.current.write('Terminal initialized...\r\n');
//             // Resize terminal on window resize
//             // const handleResize = () => {
//             //   fitAddon.fit();
//             // };
//             // window.addEventListener('resize', handleResize);
//             // Cleanup to avoid memory leaks
//             // return () => {
//             //   window.removeEventListener('resize', handleResize);
//             // };
//         }
//     },[])
    
//     return (
//         <>
//             {/* <iframe ref={iframeRef} src="loading.html" title='preview' style={{width: '100%', height: '100%', border: 'none'}}></iframe> */}
//             <div className="h-full w-full flex items-center justify-center text-gray-400">
//             {!url && <div className="text-center">
//                 {/* <p className="mb-2">Loading...</p> */}
//                 <div ref={terminalRef} className="terminal"></div>
//             </div>}
//             {url && <iframe width={"100%"} height={"100%"} src={url} />}
//             </div>
//         </>
//     )
// }

// export default PreviewTab






















import { WebContainer } from "@webcontainer/api";
// import { FileNode } from "../types/index";
import { Terminal } from '@xterm/xterm';
import {useState, useEffect, useRef} from 'react';
// import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

function PreviewTab({webcontainer, setPreviewUrl}: {webcontainer: WebContainer, setPreviewUrl: React.Dispatch<React.SetStateAction<string>>}) {
    // const { webcontainer, isBooted } = useWebcontainer();
    // console.log('webcontainer issss', webcontainer);
    // const iframeRef = useRef<HTMLIFrameElement>(null);
    // console.log("Inside preview tab", files);
    console.log("Inside PreviewTab and webcontainer is", webcontainer);
    const [url, setUrl] = useState("");
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal | null>(null);
    // const hasStartedRef = useRef(false);

    async function runWebcontainer() {
        // await webcontainer.spawn('pkill', ['-f', 'node']);

        // if (hasStartedRef.current) return;  // Prevents duplicate execution
        // hasStartedRef.current = true;
        webcontainer.on('server-ready', (port, url) => {
            console.log('server is ready and running at port ', port, ' and url is ', url);
            setUrl(url);
            setPreviewUrl(url);
        });
    
        const installDependencies = await webcontainer.spawn('npm', ['install']);
        console.log("Installed dependencies");
        installDependencies.output.pipeTo(new WritableStream({
            write(data) {
                console.log(data);
                terminal.current?.write(data);
            }
        }));
    
        const exitCode = await installDependencies.exit;
        console.log("Exit code", exitCode);
    
        const startServer = await webcontainer.spawn('npm', ['run','dev']);
        startServer.output.pipeTo(new WritableStream({
            write(data) {
                console.log("ayyeeeeeeee")
                console.log(data);
                terminal.current?.write(data);
            }
        }));
        console.log("Running server");
    }
    
    useEffect(()=>{
        runWebcontainer();
    },[webcontainer])

    useEffect(()=>{
        if (terminalRef.current && !terminal.current) {
            terminal.current = new Terminal({ convertEol: true });
            terminal.current.open(terminalRef.current);
            terminal.current.write('Terminal initialized...\r\n');
            // Resize terminal on window resize
            // const handleResize = () => {
            //   fitAddon.fit();
            // };
            // window.addEventListener('resize', handleResize);
            // Cleanup to avoid memory leaks
            // return () => {
            //   window.removeEventListener('resize', handleResize);
            // };
        }
    },[])
    
    return (
        <>
            {/* <iframe ref={iframeRef} src="loading.html" title='preview' style={{width: '100%', height: '100%', border: 'none'}}></iframe> */}
            <div className="h-full w-full flex items-center justify-center text-gray-400">
            {!url && <div className="text-center">
                {/* <p className="mb-2">Loading...</p> */}
                <div ref={terminalRef} className="terminal"></div>
            </div>}
            {url && <iframe width={"100%"} height={"100%"} src={url} />}
            </div>
        </>
    )
}

export default PreviewTab
