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
          confidence: Math.round(claimScore * 100) // Convert 0-1 score to percentage
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