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
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
      country: 'US'
    });

    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript found');
    }

    // Transform the transcript format
    return transcript.map(segment => ({
      text: segment.text,
      offset: segment.offset || segment.start * 1000, // Convert to milliseconds
      duration: segment.duration * 1000 // Convert to milliseconds
    }));
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw error;
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
        JSON.stringify({ 
          error: 'Transcript is not available for this video',
          details: error.message 
        }),
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