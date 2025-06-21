import { ChatInterface } from "@/components/chat-interface";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
       <div className="w-full max-w-3xl mx-auto flex flex-col h-full flex-grow">
            <div className="mb-4 flex-shrink-0">
                <Button asChild variant="ghost">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Kalender
                    </Link>
                </Button>
            </div>
            <div className="flex-grow">
                <ChatInterface />
            </div>
       </div>
    </main>
  );
}
