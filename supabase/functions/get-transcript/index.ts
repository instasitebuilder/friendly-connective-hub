import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { YoutubeTranscript } from "npm:youtube-transcript"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS
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

    try {
      console.log('Fetching transcript for video:', videoId)
      const transcript = await YoutubeTranscript.fetchTranscript(videoId)
      
      if (!transcript || transcript.length === 0) {
        console.log('No transcript found for video:', videoId)
        throw new Error('No transcript available')
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
      console.error('Error fetching transcript:', error)
      return new Response(
        JSON.stringify({ error: 'Transcript is not available for this video' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
  } catch (error) {
    console.error('General error:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
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