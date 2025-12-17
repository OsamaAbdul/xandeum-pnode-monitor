import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { StatsCards } from '@/components/StatsCards';
import { PNodesTable } from '@/components/PNodesTable';
import { VersionPieChart } from '@/components/charts/VersionPieChart';
import { UptimeBarChart } from '@/components/charts/UptimeBarChart';
import { usePNodes } from '@/hooks/usePNodes';
import { RefreshCw, Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { JudgesGuide } from '@/components/JudgesGuide';

import { NodesMap } from '@/components/NodesMap';
import { Leaderboard } from '@/components/Leaderboard';

const Index = () => {
  const {
    pnodes,
    stats,
    versionDistribution,
    uptimeBuckets,
    versions,
    isLoading,
    isRefreshing,
    error,
    refresh,
    refreshFromAPI,
  } = usePNodes();

  const DEFAULT_BOOTSTRAP_URL = 'http://192.190.136.28:6000/rpc';
  const [bootstrapUrl, setBootstrapUrl] = useState(DEFAULT_BOOTSTRAP_URL);
  const [configOpen, setConfigOpen] = useState(false);

  // Auto-refresh every 30 seconds (always on)
  useEffect(() => {
    const url = bootstrapUrl || DEFAULT_BOOTSTRAP_URL;

    // Initial fetch
    refreshFromAPI(url);

    const interval = setInterval(() => {
      refreshFromAPI(url);
    }, 30000);

    return () => clearInterval(interval);
  }, [bootstrapUrl, refreshFromAPI]);

  const handleRefresh = () => {
    refreshFromAPI(bootstrapUrl || DEFAULT_BOOTSTRAP_URL);
  };

  const handleConfigSave = () => {
    setConfigOpen(false);
    if (bootstrapUrl) {
      refreshFromAPI(bootstrapUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <JudgesGuide />
      <Navbar />

      {/* Hero Section */}
      <HeroSection onConfigClick={() => setConfigOpen(true)} />

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-20 space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Network Overview
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>pRPC Configuration</DialogTitle>
                    <DialogDescription>
                      Enter your Xandeum bootstrap node URL to fetch live pNode data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bootstrap URL</label>
                      <Input
                        placeholder="http://bootstrap-ip:6000/rpc"
                        value={bootstrapUrl}
                        onChange={(e) => setBootstrapUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Example: http://167.235.0.123:6000/rpc
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleConfigSave} className="flex-1">
                        Save & Fetch
                      </Button>
                      <Button variant="outline" onClick={() => setConfigOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <StatsCards stats={stats} />
          )}

        </section>

        {/* Global Distribution Map */}
        <section className="space-y-4 animate-fade-in delay-100">
          <NodesMap nodes={pnodes} />
        </section>

        {/* Charts Section */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <VersionPieChart data={versionDistribution} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <UptimeBarChart data={uptimeBuckets} />
          </div>
        </section>

        {/* Leaderboard Section */}
        <section className="space-y-4 animate-fade-in delay-200">
          {isLoading ? (
            <div className="rounded-xl border bg-card p-6 h-[400px] animate-pulse" />
          ) : (
            <Leaderboard pnodes={pnodes} />
          )}
        </section>

        {/* Table Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">pNodes Directory</h2>
          {isLoading ? (
            <div className="rounded-xl border bg-card p-8">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <PNodesTable data={pnodes} versions={versions} />
          )}
        </section>
      </main >

      {/* Footer */}
      < footer className="border-t bg-card/50" >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">X</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Xandeum. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
};

export default Index;
