import { useState, useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TranscriptDisplay } from "./youtube/TranscriptDisplay";
import { processTranscriptSegment } from "./youtube/TranscriptProcessor";

interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

const YouTubePlayer = ({ videoUrl }: { videoUrl: string }) => {
  const [videoId, setVideoId] = useState<string>("");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef<number>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoUrl) {
      const id = extractVideoId(videoUrl);
      if (id) {
        setVideoId(id);
        fetchTranscript(id);
      } else {
        toast({
          title: "Invalid URL",
          description: "Please provide a valid YouTube URL",
          variant: "destructive",
        });
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoUrl]);

  const extractVideoId = (url: string) => {
    const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[\&\?]|$)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const fetchTranscript = async (id: string) => {
    setIsLoadingTranscript(true);
    setTranscript([]); // Clear previous transcript
    
    try {
      console.log('Fetching transcript for video ID:', id);
      const { data, error } = await supabase.functions.invoke('get-transcript', {
        body: { videoId: id }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('No transcript data received');
      }

      // Transform the transcript data to match our interface
      const formattedTranscript: TranscriptItem[] = data.map((item: any) => ({
        text: item.text,
        start: item.offset / 1000, // Convert milliseconds to seconds
        duration: item.duration / 1000 // Convert milliseconds to seconds
      }));
      
      console.log('Transcript data received:', formattedTranscript);
      setTranscript(formattedTranscript);

      // Process each transcript segment for fact-checking
      formattedTranscript.forEach(async (item) => {
        try {
          await processTranscriptSegment(item, videoUrl);
        } catch (error) {
          console.error('Error processing transcript segment:', error);
        }
      });
    } catch (error: any) {
      console.error('Error fetching transcript:', error);
      setTranscript([]);
      
      let errorMessage = "No transcript is available for this video";
      if (error.message?.includes('Video is unavailable')) {
        errorMessage = "The video is unavailable or does not exist";
      } else if (error.message?.includes('Invalid YouTube URL')) {
        errorMessage = "Please provide a valid YouTube URL";
      }
      
      toast({
        title: "Transcript Unavailable",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const onPlayerReady = (event: any) => {
    console.log("Player ready");
  };

  const onPlayerStateChange = (event: any) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (event.data === 1) { // Playing
      intervalRef.current = window.setInterval(() => {
        setCurrentTime(event.target.getCurrentTime());
      }, 1000);
    }
  };

  // Auto-scroll to current transcript
  useEffect(() => {
    const currentTranscript = transcript.find(
      item => currentTime >= item.start && currentTime <= item.start + item.duration
    );
    
    if (currentTranscript && scrollRef.current) {
      const element = document.getElementById(`transcript-${currentTranscript.start}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, transcript]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <YouTube
          videoId={videoId}
          opts={{
            height: "390",
            width: "100%",
            playerVars: {
              autoplay: 1,
            },
          }}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
        />
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Live Transcript</h3>
        <TranscriptDisplay
          transcript={transcript}
          currentTime={currentTime}
          isLoadingTranscript={isLoadingTranscript}
          scrollRef={scrollRef}
        />
      </Card>
    </div>
  );
};

export default YouTubePlayer;