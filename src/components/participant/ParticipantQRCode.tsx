import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ParticipantQRCodeProps {
    shareUrl: string;
    participantName: string;
}

export function ParticipantQRCode({ shareUrl, participantName }: ParticipantQRCodeProps) {
    const [showDialog, setShowDialog] = useState(false);

    const downloadQRCode = () => {
        const svg = document.getElementById('participant-qr-code');
        if (!svg) return;

        // Create a canvas to convert SVG to PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size (larger for better quality)
        const size = 1000;
        canvas.width = size;
        canvas.height = size;

        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);

        // Create an image from the SVG
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            // Draw the QR code centered
            const qrSize = size * 0.8;
            const offset = (size - qrSize) / 2;
            ctx.drawImage(img, offset, offset, qrSize, qrSize);

            // Convert canvas to blob and download
            canvas.toBlob((blob) => {
                if (!blob) return;
                const link = document.createElement('a');
                link.download = `${participantName.replace(/\s+/g, '-')}-QR-Code.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
                toast.success('QR Code downloaded!');
            });

            URL.revokeObjectURL(url);
        };

        img.src = url;
    };

    const printQRCode = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${participantName}</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .container {
              text-align: center;
              max-width: 600px;
            }
            h1 {
              font-size: 28px;
              margin-bottom: 10px;
              color: #1a1a1a;
            }
            p {
              font-size: 18px;
              color: #666;
              margin-bottom: 30px;
            }
            .qr-container {
              background: white;
              padding: 30px;
              border: 2px solid #e5e5e5;
              border-radius: 12px;
              display: inline-block;
            }
            .url {
              margin-top: 20px;
              font-size: 14px;
              color: #999;
              word-break: break-all;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Support ${participantName}</h1>
            <p>Scan to visit my fundraising page!</p>
            <div class="qr-container">
              ${document.getElementById('participant-qr-code')?.outerHTML || ''}
            </div>
            <p class="url">${shareUrl}</p>
          </div>
        </body>
      </html>
    `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    return (
        <>
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-primary" />
                        QR Code for Door-to-Door
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                        <QRCodeSVG
                            id="participant-qr-code-preview"
                            value={shareUrl}
                            size={120}
                            level="H"
                            includeMargin
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                        Show this QR code when going door-to-door so people can easily visit your page!
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDialog(true)}
                            className="gap-2"
                        >
                            <QrCode className="h-4 w-4" />
                            View Large
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadQRCode}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Your QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-center p-8 bg-white rounded-lg">
                            <QRCodeSVG
                                id="participant-qr-code"
                                value={shareUrl}
                                size={280}
                                level="H"
                                includeMargin
                            />
                        </div>
                        <p className="text-sm text-center text-muted-foreground">
                            People can scan this code to visit your fundraising page
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={downloadQRCode}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                            <Button
                                variant="outline"
                                onClick={printQRCode}
                                className="gap-2"
                            >
                                Print
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
