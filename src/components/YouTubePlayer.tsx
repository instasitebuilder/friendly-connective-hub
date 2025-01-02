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
        console.log('Extracted video ID:', id);
        setVideoId(id);
        fetchTranscript(id);
      } else {
        console.error('Invalid YouTube URL:', videoUrl);
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
        console.error('Supabase function error:', error);
        let errorMessage = "Failed to fetch transcript";
        
        try {
          if (typeof error.message === 'string') {
            const errorBody = JSON.parse(error.message);
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        toast({
          title: "Transcript Unavailable",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('No transcript data received:', data);
        throw new Error('No transcript data available for this video');
      }

      // Transform the transcript data to match our interface
      const formattedTranscript: TranscriptItem[] = data.map((item: any) => ({
        text: item.text,
        start: item.offset / 1000, // Convert milliseconds to seconds
        duration: item.duration / 1000 // Convert milliseconds to seconds
      }));
      
      console.log('Transcript data processed:', formattedTranscript);
      setTranscript(formattedTranscript);

      toast({
        title: "Transcript Loaded",
        description: "The transcript has been successfully loaded.",
      });

      // Process each transcript segment for fact-checking
      formattedTranscript.forEach(async (item) => {
        try {
          await processTranscriptSegment(item, videoUrl);
        } catch (error) {
          console.error('Error processing transcript segment:', error);
        }
      });
    } catch (error: any) {
      console.error('Error in transcript processing:', error);
      setTranscript([]);
      
      toast({
        title: "Transcript Unavailable",
        description: error.message || "No transcript is available for this video",
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
