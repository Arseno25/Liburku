'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, LoaderCircle, Send, User, Minus, X, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { chatWithAssistant, ChatInput } from '@/ai/flows/chat-flow';
import { MarkdownRenderer } from './markdown-renderer';
import type { Holiday } from '@/types/holiday';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatInterfaceProps {
  holidays: Holiday[];
  year: number;
  isMinimized: boolean;
  onMinimizeToggle: () => void;
  onClose: () => void;
}

export function ChatInterface({ holidays, year, isMinimized, onMinimizeToggle, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Halo! Saya Asisten Liburku. Ada yang bisa saya bantu untuk merencanakan liburan Anda di Indonesia?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change, but only if not minimized
    if (scrollAreaRef.current && !isMinimized) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isMinimized]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
        const currentDate = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        
        const chatInput: ChatInput = {
            history: chatHistory,
            message: input,
            currentDate: currentDate,
            holidays: holidays,
            year: year,
        };

        const result = await chatWithAssistant(chatInput);
        const modelMessage: Message = { role: 'model', content: result.response };
        setMessages((prev) => [...prev, modelMessage]);

    } catch (error) {
      console.error("Error chatting with assistant:", error);
      const errorMessage: Message = { role: 'model', content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col rounded-xl overflow-hidden shadow-none border-none">
      <CardHeader 
        className={`flex flex-row items-center justify-between gap-3 flex-shrink-0 p-4 border-b bg-muted/50 transition-colors ${isMinimized ? 'cursor-pointer hover:bg-muted' : ''}`}
        onClick={isMinimized ? onMinimizeToggle : undefined}
      >
        <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="w-5 h-5"/>
                </div>
            </Avatar>
            <div>
                <CardTitle className="text-base font-semibold">Asisten Liburku</CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1 text-xs">
                     <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>Online</span>
                </CardDescription>
            </div>
        </div>
        <div className="flex items-center gap-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onMinimizeToggle(); }}>
                {isMinimized ? <ChevronUp className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                <span className="sr-only">{isMinimized ? 'Maksimalkan' : 'Minimalkan'}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                <X className="h-5 w-5" />
                <span className="sr-only">Tutup</span>
            </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <>
            <CardContent className="flex-grow overflow-hidden flex flex-col p-4">
                <ScrollArea className="h-full pr-4 -mr-4 flex-grow" ref={scrollAreaRef}>
                <div className="space-y-6 pb-4">
                    {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 text-sm ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'model' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Bot className="w-5 h-5"/>
                            </div>
                        </Avatar>
                        )}
                        <div className={`max-w-[85%] p-3 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <MarkdownRenderer>{message.content}</MarkdownRenderer>
                        </div>
                        {message.role === 'user' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                <User className="w-5 h-5"/>
                            </div>
                        </Avatar>
                        )}
                    </div>
                    ))}
                    {isLoading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Bot className="w-5 h-5"/>
                            </div>
                        </Avatar>
                        <div className="max-w-[85%] p-3 rounded-lg bg-muted flex items-center">
                        <LoaderCircle className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                    )}
                </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="pt-4 border-t flex-shrink-0 p-4">
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                <Input
                    id="message"
                    placeholder="Ketik pesan Anda..."
                    className="flex-1"
                    autoComplete="off"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Kirim</span>
                </Button>
                </form>
            </CardFooter>
        </>
      )}
    </Card>
  );
}
