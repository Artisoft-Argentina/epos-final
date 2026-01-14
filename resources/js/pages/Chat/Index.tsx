import { useState, useRef, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Bot, User } from 'lucide-react';

interface Message {
    id: number;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

export default function ChatIndex() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now(),
            content: input,
            role: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        const history = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
        }));

        try {
            const response = await fetch('/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ 
                    message: input,
                    history: history,
                }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: Date.now() + 1,
                content: data.response,
                role: 'assistant',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Chat IA" />
            <div className="flex flex-col h-[calc(100vh-4rem)]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Inicia una conversación con la IA</p>
                            </div>
                        </div>
                    )}
                    {messages.map(message => (
                        <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5 text-primary-foreground" />
                                </div>
                            )}
                            <Card className={`p-3 max-w-[70%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </Card>
                            {message.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <Card className="p-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </Card>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="border-t p-4">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Escribe tu mensaje..."
                            disabled={loading}
                        />
                        <Button onClick={handleSend} disabled={loading || !input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
