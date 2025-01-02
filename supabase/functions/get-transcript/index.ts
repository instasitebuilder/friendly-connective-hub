import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { YoutubeTranscript } from "npm:youtube-transcript"
import { corsHeaders } from "../_shared/cors.ts"

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    console.log('Attempting to fetch YouTube transcript for:', videoId);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
      country: 'US'
    });

    if (!transcript || transcript.length === 0) {
      console.log('No YouTube transcript found for:', videoId);
      return null;
    }

    // Transform the transcript format
    return transcript.map(segment => ({
      text: segment.text,
      offset: segment.offset || segment.start * 1000, // Convert to milliseconds
      duration: segment.duration * 1000 // Convert to milliseconds
    }));
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    return null;
  }
}

async function fetchAudioTranscript(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    console.log('Attempting to fetch audio transcript for:', videoId);
    // Note: This is a placeholder for the actual audio transcription implementation
    // In a real implementation, you would:
    // 1. Download the video's audio
    // 2. Convert it to the required format
    // 3. Send it to a speech-to-text service
    // 4. Process and return the results
    
    // For now, we'll return null to indicate that audio transcription failed
    return null;
  } catch (error) {
    console.error('Error fetching audio transcript:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { videoId } = await req.json()
    console.log('Received request for video ID:', videoId)

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
      )
    }

    // First, try to get YouTube transcript
    let transcript = await fetchYouTubeTranscript(videoId);

    // If YouTube transcript fails, try audio transcription
    if (!transcript) {
      console.log('YouTube transcript unavailable, attempting audio transcription');
      transcript = await fetchAudioTranscript(videoId);
    }

    // If both methods fail, return an error
    if (!transcript) {
      return new Response(
        JSON.stringify({ 
          error: 'No transcript available for this video',
          message: 'Both YouTube captions and audio transcription failed'
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return new Response(
      JSON.stringify(transcript),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('General error:', error)
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
    )
  }
})