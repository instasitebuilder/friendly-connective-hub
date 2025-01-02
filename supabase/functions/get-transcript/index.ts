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
    
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Invalid video ID provided');
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en' // Try to get English transcript first
    });
    
    console.log('Raw transcript response:', transcript ? 'Received data' : 'No data');

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      throw new Error('No transcript available for this video');
    }

    return transcript.map(segment => ({
      text: segment.text,
      offset: segment.offset || segment.start * 1000,
      duration: segment.duration * 1000
    }));
  } catch (error) {
    console.error('Error in fetchYouTubeTranscript:', error);
    
    if (error.message?.includes('Captions are disabled')) {
      throw new Error('Captions are disabled for this video');
    }
    if (error.message?.includes('private video')) {
      throw new Error('This video is private or unavailable');
    }
    if (error.message?.includes('Invalid video ID')) {
      throw new Error('Invalid YouTube video ID provided');
    }
    
    throw new Error('No transcript available for this video');
  }
}

serve(async (req) => {
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
        JSON.stringify({ error: error.message || 'No transcript available for this video' }),
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