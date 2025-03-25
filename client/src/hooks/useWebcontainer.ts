import { useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null; // Cache instance

export default function useWebcontainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [isBooted, setIsBooted] = useState(false);

    useEffect(() => {
        const bootWebContainer = async () => {
            if (!webcontainerInstance) {
                webcontainerInstance = await WebContainer.boot();
            }
            setIsBooted(true);
            setWebcontainer(webcontainerInstance);
        };
        bootWebContainer();
    }, []);

    return { webcontainer, isBooted };
}
