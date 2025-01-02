import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { YoutubeTranscript } from 'npm:youtube-transcript'

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    console.log('Attempting to fetch YouTube transcript for:', videoId);
    
    // Validate video ID
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Invalid video ID provided');
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
      country: 'US'
    });

    console.log('Raw transcript response:', transcript ? 'Received data' : 'No data');

    if (!transcript || transcript.length === 0) {
      console.error('No transcript found for video:', videoId);
      throw new Error('No transcript found for this video');
    }

    // Transform the transcript format
    return transcript.map(segment => ({
      text: segment.text,
      offset: segment.offset || segment.start * 1000, // Convert to milliseconds
      duration: segment.duration * 1000 // Convert to milliseconds
    }));
  } catch (error) {
    console.error('Error in fetchYouTubeTranscript:', error);
    
    // Check specific error conditions
    if (error.message?.includes('Captions are disabled')) {
      throw new Error('Captions are disabled for this video');
    }
    if (error.message?.includes('private video')) {
      throw new Error('This video is private or unavailable');
    }
    if (error.message?.includes('Invalid video ID')) {
      throw new Error('Invalid YouTube video ID provided');
    }
    
    // Generic transcript not available error
    throw new Error('Transcript is not available for this video');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    console.log('Received request for video ID:', videoId);

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      const transcript = await fetchYouTubeTranscript(videoId);
      console.log('Successfully fetched transcript for video:', videoId);
      
      return new Response(
        JSON.stringify(transcript),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Transcript fetch error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Transcript is not available for this video' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error('General error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});