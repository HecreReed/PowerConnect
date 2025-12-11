import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getTerminalWebSocketUrl } from '../services/api';
import '@xterm/xterm/css/xterm.css';

interface XTerminalProps {
  sessionId: string;
  onClose?: () => void;
}

export default function XTerminal({ sessionId, onClose }: XTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      scrollback: 10000,
    });

    // Create fit addon
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);

    // Open terminal in DOM
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    // Connect WebSocket
    const wsUrl = getTerminalWebSocketUrl(sessionId);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      if (terminal.current) {
        terminal.current.write(event.data);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      terminal.current?.writeln('\r\n\x1b[31mWebSocket connection error\x1b[0m');
    };

    ws.current.onclose = () => {
      console.log('WebSocket closed');
      terminal.current?.writeln('\r\n\x1b[33mConnection closed\x1b[0m');
    };

    // Handle terminal input
    const disposable = terminal.current.onData((data) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Fit after a short delay (ensures parent container is sized)
    setTimeout(() => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    }, 100);

    // Cleanup
    return () => {
      disposable.dispose();
      window.removeEventListener('resize', handleResize);

      if (ws.current) {
        ws.current.close();
      }

      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, [sessionId]);

  return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />;
}
