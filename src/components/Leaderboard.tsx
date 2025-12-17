
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PNodeInfo } from "@/lib/types";

interface LeaderboardProps {
    pnodes: PNodeInfo[];
}

function formatStorage(bytes: number): string {
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    return `${(bytes / 1e6).toFixed(2)} MB`;
}

export function Leaderboard({ pnodes }: LeaderboardProps) {
    // Sort by storageCommitted desc, then uptime desc
    const topNodes = [...pnodes]
        .sort((a, b) => {
            const storageDiff = (b.storageCommitted || 0) - (a.storageCommitted || 0);
            if (storageDiff !== 0) return storageDiff;
            return (b.uptime || 0) - (a.uptime || 0);
        })
        .slice(0, 10);

    return (
        <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    Top Performing Nodes
                    <Badge variant="secondary" className="font-mono text-xs">TOP 10</Badge>
                </h2>
            </div>

            <div className="rounded-md border bg-background/50 overflow-x-auto">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Node ID</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Storage Committed</TableHead>
                            <TableHead>Uptime</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topNodes.map((node, index) => (
                            <TableRow key={node.id} className="hover:bg-muted/50 border-b border-border/50">
                                <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                                <TableCell className="font-mono" title={node.id}>
                                    {node.id.substring(0, 8)}...{node.id.substring(node.id.length - 4)}
                                </TableCell>
                                <TableCell className="font-mono">
                                    <div className="flex items-center gap-2">
                                        {node.country || 'Unknown'}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-accent">
                                    {node.storageCommitted ? formatStorage(node.storageCommitted) : '0 MB'}
                                </TableCell>
                                <TableCell className="font-mono">
                                    <span className={node.uptime > 98 ? "text-green-500" : node.uptime > 90 ? "text-yellow-500" : "text-red-500"}>
                                        {node.uptime.toFixed(2)}%
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        variant="outline"
                                        className={`uppercase text-[10px] border-none ${node.status === 'online' ? 'bg-green-500/20 text-green-500' :
                                            'bg-red-500/20 text-red-500'
                                            }`}
                                    >
                                        {node.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {topNodes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
