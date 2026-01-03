import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, X } from 'lucide-react';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl relative animate-in fade-in zoom-in duration-300">
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-white hover:bg-white/20 hover:text-white"
          onClick={onComplete}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="space-y-6 text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Welcome to Aurora
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Watch this short video to see how Aurora helps you raise 10x more than traditional fundraisers.
          </p>
        </div>

        <Card className="border-0 bg-black/50 shadow-2xl overflow-hidden aspect-video relative group">
          {/* Main Video Area */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
            <div className="text-center p-6">
              <Play className="w-20 h-20 text-white opacity-80 mb-4 mx-auto" />
              <p className="text-white/60 font-medium">Video Player Placeholder</p>
              <p className="text-xs text-white/40 mt-2">Replace with your actual video source (YouTube/Vimeo/MP4)</p>
            </div>

            {/* Example IFRAME structure for when user has a link
             <iframe 
               width="100%" 
               height="100%" 
               src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1" 
               title="Aurora Fundraiser Tour" 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               allowFullScreen
             ></iframe>
             */}
          </div>
        </Card>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={onComplete}
            className="text-lg px-8 py-6 h-auto shadow-lg hover:scale-105 transition-transform bg-white text-primary hover:bg-white/90"
          >
            Start Your First Fundraiser
          </Button>
        </div>
      </div>
    </div>
  );
}
