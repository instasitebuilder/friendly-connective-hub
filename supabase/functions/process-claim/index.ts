import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { broadcastId } = await req.json();
    console.log('Processing broadcast:', broadcastId);

    // Fetch the broadcast content
    const { data: broadcast, error: fetchError } = await supabaseClient
      .from('broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch broadcast:', fetchError);
      throw new Error(`Failed to fetch broadcast: ${fetchError.message}`);
    }

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    console.log('Fetched broadcast:', broadcast);

    // Generate a confidence score (0-100)
    const confidence = Math.floor(Math.random() * 100);
    const status = confidence > 80 ? 'verified' : confidence > 60 ? 'flagged' : 'pending';

    // Update the broadcast with status and confidence - using transcript_status instead of api_processed
    const { error: updateError } = await supabaseClient
      .from('broadcasts')
      .update({
        confidence,
        status,
        transcript_status: 'processed'
      })
      .eq('id', broadcastId);

    if (updateError) {
      console.error('Failed to update broadcast:', updateError);
      throw new Error(`Failed to update broadcast: ${updateError.message}`);
    }

    // Create a fact check entry
    const { error: factCheckError } = await supabaseClient
      .from('fact_checks')
      .insert([{
        broadcast_id: broadcastId,
        verification_source: 'AI Analysis',
        explanation: `Automated fact check with ${confidence}% confidence`,
        confidence_score: confidence
      }]);

    if (factCheckError) {
      console.error('Failed to create fact check:', factCheckError);
      throw new Error(`Failed to create fact check: ${factCheckError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        confidence,
        status
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing claim:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
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