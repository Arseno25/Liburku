'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sparkles, CalendarCheck, Plane, FileText, Backpack, Wallet, Bot, Route } from 'lucide-react';

interface WelcomeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  {
    icon: CalendarCheck,
    title: 'Kalender Interaktif & Audio',
    description: 'Lihat hari libur, dapatkan penjelasan AI, dan dengarkan audionya.',
  },
  {
    icon: Plane,
    title: 'Perencana Libur Panjang AI',
    description: 'Temukan semua potensi libur panjang dan dapatkan ide liburan instan.',
  },
  {
    icon: Route,
    title: 'Perencana Multi-Destinasi',
    description: 'Rencanakan perjalanan epik melintasi beberapa kota dalam satu itinerary.',
  },
  {
    icon: FileText,
    title: 'Rencana Perjalanan Detail',
    description: 'AI akan membuatkan itinerary lengkap, termasuk mencari acara lokal.',
  },
  {
    icon: Wallet,
    title: 'Estimasi Anggaran Cerdas',
    description: 'Dapatkan perkiraan biaya untuk akomodasi, makan, dan aktivitas.',
  },
  {
    icon: Backpack,
    title: 'Daftar Bawaan Personal',
    description: 'AI membuatkan daftar barang bawaan sesuai rencana perjalanan Anda.',
  },
  {
    icon: Bot,
    title: 'Asisten Chat Canggih',
    description: 'Tanyakan apa saja untuk merencanakan liburan, langsung dari chat.',
  },
];

export function WelcomeDialog({ isOpen, onOpenChange }: WelcomeDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      if (typeof window !== 'undefined') {
          localStorage.setItem('hasSeenWelcome', 'true');
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90dvh] flex flex-col">
        <DialogHeader className="text-center items-center">
          <div className="p-3 bg-primary/10 rounded-full w-fit mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold font-headline">Selamat Datang di Liburku!</DialogTitle>
          <DialogDescription className="text-base max-w-sm">
            Asisten perjalanan AI Anda untuk merencanakan liburan impian di Indonesia.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4 overflow-y-auto pr-4 -mr-4">
            <h3 className="text-lg font-semibold text-center text-foreground">Temukan Fitur-Fitur Canggih Kami:</h3>
            <div className="space-y-3">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="p-2 bg-primary/10 rounded-md shrink-0">
                            <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <DialogFooter className="mt-auto pt-4 flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
            />
            <Label htmlFor="dont-show-again" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Jangan tampilkan lagi
            </Label>
          </div>
          <Button onClick={handleClose} className="w-full sm:w-auto">Mulai Jelajahi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
