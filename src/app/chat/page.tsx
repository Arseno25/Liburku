import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";

export default function ChatPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
       <h1 className="text-2xl font-bold mb-4">Fitur Chat Telah Dipindahkan</h1>
       <p className="text-muted-foreground mb-6 max-w-md">
         Asisten chat sekarang dapat diakses sebagai widget mengambang melalui tombol di pojok kanan bawah halaman utama.
       </p>
       <Button asChild>
         <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Halaman Utama
         </Link>
       </Button>
    </main>
  );
}
