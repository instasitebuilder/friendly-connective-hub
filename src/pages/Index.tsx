import DashboardLayout from "@/components/DashboardLayout";
import FactCheckingFeed from "@/components/FactCheckingFeed";
import LiveStreamInput from "@/components/LiveStreamInput";
import { TextFactChecker } from "@/components/fact-checking/TextFactChecker";
import { FactCheckStats } from "@/components/fact-checking/FactCheckStats";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fetchStats = async () => {
  const { data: broadcasts, error: broadcastsError } = await supabase
    .from("broadcasts")
    .select("status", { count: "exact" });

  if (broadcastsError) throw broadcastsError;

  const verified = broadcasts?.filter((b) => b.status === "verified").length || 0;
  const debunked = broadcasts?.filter((b) => b.status === "debunked").length || 0;
  const flagged = broadcasts?.filter((b) => b.status === "flagged").length || 0;
  const pending = broadcasts?.filter((b) => b.status === "pending" || !b.status).length || 0;

  return { verified, debunked, flagged, pending };
};

const Index = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Fact-Checking Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-2 space-y-6">
            <LiveStreamInput />
            <TextFactChecker />
            <FactCheckingFeed />
          </div>
          
          <div className="space-y-6">
            <Card className="p-6 bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
              <h2 className="font-semibold mb-4 text-lg">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <span className="text-sm font-medium">Verified Claims</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {statsLoading ? "..." : stats?.verified || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <span className="text-sm font-medium">Debunked Claims</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {statsLoading ? "..." : stats?.debunked || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <span className="text-sm font-medium">Flagged Claims</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {statsLoading ? "..." : stats?.flagged || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/20">
                  <span className="text-sm font-medium">Pending Review</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    {statsLoading ? "..." : stats?.pending || 0}
                  </span>
                </div>
              </div>
            </Card>
            
            <FactCheckStats />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;