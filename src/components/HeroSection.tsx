import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Globe, Shield, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  onConfigClick?: () => void;
}

export function HeroSection({ onConfigClick }: HeroSectionProps) {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 px-4 border-b border-primary/20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      <div className="container mx-auto relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary/50 bg-primary/10 text-primary text-sm font-mono mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            SYSTEM_ALERT: LIVE_FEED_ACTIVE
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 font-mono text-primary"
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <span className="block text-white mb-2">XANDEUM_PNODES</span>
            <span className="text-primary/80 glitch" data-text="SURVEILLANCE_GRID">SURVEILLANCE_GRID</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-lg sm:text-xl text-primary/60 mb-8 max-w-2xl mx-auto font-mono"
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {'>'} INITIALIZING SCALABLE STORAGE ANALYTICS...<br />
            {'>'} MONITORING NETWORK HEALTH...<br />
            {'>'} TRACKING DECENTRALIZED ECOSYSTEM...
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            {...fadeInUp}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button
              size="lg"
              className="gap-2 bg-primary text-black hover:bg-primary/90 font-mono font-bold border border-primary"
              onClick={onConfigClick}
            >
              <Terminal className="h-4 w-4" />
              INITIATE_SCAN
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-primary/50 text-primary hover:bg-primary/10 font-mono"
              asChild
            >
              <a href="https://github.com/OsamaAbdul/xandeum-pnode-monitor" target="_blank" rel="noopener noreferrer">
                READ_DOCS
              </a>
            </Button>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-primary/60 font-mono"
            {...fadeInUp}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 border border-primary/20 px-3 py-1 bg-primary/5">
              <div className="w-2 h-2 bg-primary" />
              <span>REALTIME_UPDATES</span>
            </div>
            <div className="flex items-center gap-2 border border-primary/20 px-3 py-1 bg-primary/5">
              <Globe className="h-4 w-4" />
              <span>GLOBAL_NETWORK</span>
            </div>
            <div className="flex items-center gap-2 border border-primary/20 px-3 py-1 bg-primary/5">
              <Shield className="h-4 w-4" />
              <span>ENTERPRISE_GRADE</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
