import { supabase } from "@/integrations/supabase/client";
import { analyzeClaimWithClaimBuster } from "@/utils/claimBusterApi";

interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

export async function processTranscriptSegment(
  item: TranscriptItem,
  videoUrl: string
) {
  try {
    console.log('Processing transcript segment:', item.text);
    
    // Analyze the claim using ClaimBuster
    const claimScore = await analyzeClaimWithClaimBuster(item.text);
    console.log('ClaimBuster score:', claimScore);

    // Convert score to percentage and determine status
    const confidencePercentage = Math.round(claimScore * 100);
    let status: "verified" | "debunked" | "flagged";
    
    if (confidencePercentage > 80) {
      status = "verified";
    } else if (confidencePercentage > 60) {
      status = "flagged";
    } else {
      status = "debunked";
    }

    console.log('Inserting broadcast with status:', status, 'and confidence:', confidencePercentage);

    // Insert into broadcasts table
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .insert([
        {
          content: item.text,
          source: 'YouTube Live',
          video_url: videoUrl,
          timestamp: new Date(item.start * 1000).toISOString(),
          transcript_status: 'processed',
          confidence: confidencePercentage,
          status: status
        }
      ])
      .select()
      .single();

    if (broadcastError) {
      throw broadcastError;
    }

    // Trigger fact-checking process
    if (broadcast) {
      await supabase.functions.invoke('process-claim', {
        body: { broadcastId: broadcast.id }
      });
    }

    return broadcast;
  } catch (error) {
    console.error('Error processing transcript segment:', error);
    throw error;
  }
}