const CLAIMBUSTER_API_KEY = "9936dfa4d6f342119108a5dcc60e19b5";
const CLAIMBUSTER_BASE_URL = "https://idir.uta.edu/claimbuster/api/v2/score/text";

export async function analyzeClaimWithClaimBuster(claim: string): Promise<number> {
  try {
    console.log('Analyzing claim with ClaimBuster:', claim);
    
    const response = await fetch(
      `${CLAIMBUSTER_BASE_URL}/${encodeURIComponent(claim)}`,
      {
        headers: {
          "x-api-key": CLAIMBUSTER_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ClaimBuster API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('ClaimBuster response:', data);
    
    // Return the score from ClaimBuster (0-1 range)
    return data.results[0].score;
  } catch (error) {
    console.error('Error analyzing claim:', error);
    return 0;
  }
}