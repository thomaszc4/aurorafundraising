import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  url: string;
  studentName?: string;
  campaignName?: string;
}

export function QRCodeGenerator({ url, studentName, campaignName }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [url]);

  const generateQRCode = async () => {
    // Using a simple QR code generation approach with canvas
    // This creates a basic QR-like visual - in production you'd use a proper QR library
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    // Create QR code using Google Charts API (simple approach)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=10`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      setQrDataUrl(canvas.toDataURL('image/png'));
    };
    img.src = qrUrl;
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${studentName?.replace(/\s+/g, '-').toLowerCase() || 'fundraiser'}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('QR Code downloaded!');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Support ${studentName || 'our'} Fundraiser`,
          text: `Help ${studentName || 'us'} reach ${studentName ? 'their' : 'our'} fundraising goal for ${campaignName || 'our campaign'}!`,
          url: url
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Your QR Code
        </CardTitle>
        <CardDescription>
          Use this QR code when going door-to-door. People can scan it to visit your fundraising page instantly!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <canvas ref={canvasRef} className="hidden" />
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="QR Code" 
                className="w-48 h-48 md:w-56 md:h-56"
              />
            ) : (
              <div className="w-48 h-48 md:w-56 md:h-56 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                <QrCode className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* URL Display */}
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 bg-transparent text-sm text-muted-foreground truncate border-none outline-none"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Tips */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">Tips for Door-to-Door</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Print this QR code or show it on your phone</li>
            <li>• Supporters can scan to buy products instantly</li>
            <li>• No cash needed - secure online payment</li>
            <li>• Orders are tracked automatically to your account</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}