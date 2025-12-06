import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, ShieldCheck, Activity, Radio } from "lucide-react";

export const JudgesGuide = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem("xandeum_judges_guide_seen");
        if (!hasSeenGuide) {
            // Small delay for dramatic effect
            const timer = setTimeout(() => setOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setOpen(false);
        localStorage.setItem("xandeum_judges_guide_seen", "true");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-black border-2 border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.2)] font-mono max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-500 text-xl tracking-widest uppercase border-b border-green-500/30 pb-4">
                        <Terminal className="w-6 h-6 animate-pulse" />
                        System Message: Incoming Transmission
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4 text-green-400/90">
                    <div className="p-4 border border-green-500/20 bg-green-500/5 rounded-lg">
                        <p className="mb-2 text-sm uppercase tracking-wider text-green-500/60">
                            Mission Objective
                        </p>
                        <p className="text-lg">
                            Welcome, Operative. You have accessed the Xandeum pNode Surveillance System.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                                <Radio className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-400">1. Initialize Uplink</h3>
                                <p className="text-sm text-green-400/70">
                                    Locate the <span className="text-green-300 font-bold border border-green-500/30 px-1 rounded">Configure</span> button. Input the Bootstrap Node coordinates to establish a secure pRPC connection.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-400">2. Analyze Telemetry</h3>
                                <p className="text-sm text-green-400/70">
                                    Monitor real-time network health, version distribution, and uptime metrics across the grid.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-400">3. Verify Nodes</h3>
                                <p className="text-sm text-green-400/70">
                                    Inspect the pNode Directory for individual node status and integrity verification.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleClose}
                        className="w-full bg-green-500 hover:bg-green-600 text-black font-bold tracking-widest uppercase"
                    >
                        Acknowledge & Proceed
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
