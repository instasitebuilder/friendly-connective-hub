import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { analyzeClaimWithClaimBuster } from "@/utils/claimBusterApi";

export const TextFactChecker = () => {
  const [inputText, setInputText] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to fact-check",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      const score = await analyzeClaimWithClaimBuster(inputText);
      setConfidence(score * 100); // Convert to percentage
      
      toast({
        title: "Fact Check Complete",
        description: `Analyzed with ${Math.round(score * 100)}% confidence`,
      });
    } catch (error) {
      console.error("Error checking fact:", error);
      toast({
        title: "Error",
        description: "Failed to analyze the text",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quick Fact Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter text to fact-check..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleCheck}
            disabled={isChecking}
          >
            Check
          </Button>
        </div>
        
        {confidence !== null && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Analysis Results:</h4>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  confidence > 80
                    ? "bg-green-500/10 text-green-500"
                    : confidence > 60
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-red-500/10 text-red-500"
                }
              >
                {Math.round(confidence)}% confidence
              </Badge>
              <span className="text-sm text-muted-foreground">
                {confidence > 80
                  ? "High likelihood of being a factual claim"
                  : confidence > 60
                  ? "Moderate likelihood of being a factual claim"
                  : "Low likelihood of being a factual claim"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};