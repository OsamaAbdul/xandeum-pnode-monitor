import { useState, useMemo } from 'react';
import { PNodeInfo, SortConfig, FilterConfig } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Clock,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PNodesTableProps {
  data: PNodeInfo[];
  versions: string[];
}

const ITEMS_PER_PAGE = 25;

function shortenPubkey(pubkey: string): string {
  return `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
}

export function PNodesTable({ data, versions }: PNodesTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'uptime', direction: 'desc' });
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    version: null,
    uptimeMin: 0,
    storageMin: 0,
    status: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        p => p.pubkey.toLowerCase().includes(search) ||
          p.ip.toLowerCase().includes(search) ||
          p.version.toLowerCase().includes(search)
      );
    }
    if (filters.version) {
      result = result.filter(p => p.version === filters.version);
    }
    if (filters.uptimeMin > 0) {
      result = result.filter(p => p.uptime >= filters.uptimeMin);
    }
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      return 0;
    });

    return result;
  }, [data, filters, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key: keyof PNodeInfo) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const copyPubkey = (pubkey: string) => {
    navigator.clipboard.writeText(pubkey);
    toast({ title: 'COPIED_TO_CLIPBOARD', description: 'PUBKEY_SECURED' });
  };

  const clearFilters = () => {
    setFilters({ search: '', version: null, uptimeMin: 0, storageMin: 0, status: null });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.search || filters.version || filters.uptimeMin > 0 || filters.status;

  const SortIcon = ({ column }: { column: keyof PNodeInfo }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      online: 'text-primary border-primary/50 bg-primary/10',
      degraded: 'text-amber-500 border-amber-500/50 bg-amber-500/10',
      offline: 'text-destructive border-destructive/50 bg-destructive/10',
    };
    return (
      <Badge variant="outline" className={cn('capitalize font-mono text-xs rounded-none', variants[status])}>
        <span className={cn(
          'w-1.5 h-1.5 mr-1.5',
          status === 'online' ? 'bg-primary animate-pulse' : status === 'degraded' ? 'bg-amber-500' : 'bg-destructive'
        )} />
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
          <Input
            placeholder="SEARCH_QUERY: PUBKEY | IP | VERSION"
            value={filters.search}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, search: e.target.value }));
              setCurrentPage(1);
            }}
            className="pl-9 bg-card border-primary/30 text-primary placeholder:text-primary/30 rounded-none focus-visible:ring-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className={cn("gap-2 rounded-none border-primary/30", showFilters ? "bg-primary text-black hover:bg-primary/90" : "text-primary hover:bg-primary/10")}
          >
            <Filter className="h-4 w-4" />
            FILTERS
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary animate-pulse" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" size="icon" onClick={clearFilters} className="rounded-none border-primary/30 text-primary hover:bg-primary/10">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-primary/5 border border-primary/20 animate-fade-in">
          <Select
            value={filters.version || 'all'}
            onValueChange={(v) => {
              setFilters(prev => ({ ...prev, version: v === 'all' ? null : v }));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-36 rounded-none border-primary/30 bg-card text-primary">
              <SelectValue placeholder="VERSION" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-primary/30 bg-card text-primary">
              <SelectItem value="all">ALL_VERSIONS</SelectItem>
              {versions.map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.uptimeMin.toString()}
            onValueChange={(v) => {
              setFilters(prev => ({ ...prev, uptimeMin: parseInt(v) }));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-36 rounded-none border-primary/30 bg-card text-primary">
              <SelectValue placeholder="MIN_UPTIME" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-primary/30 bg-card text-primary">
              <SelectItem value="0">ANY_UPTIME</SelectItem>
              <SelectItem value="80">≥80%</SelectItem>
              <SelectItem value="90">≥90%</SelectItem>
              <SelectItem value="95">≥95%</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => {
              setFilters(prev => ({ ...prev, status: v === 'all' ? null : v }));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-36 rounded-none border-primary/30 bg-card text-primary">
              <SelectValue placeholder="STATUS" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-primary/30 bg-card text-primary">
              <SelectItem value="all">ALL_STATUS</SelectItem>
              <SelectItem value="online">ONLINE</SelectItem>
              <SelectItem value="degraded">DEGRADED</SelectItem>
              <SelectItem value="offline">OFFLINE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      <div className="border border-primary/30 bg-card overflow-hidden relative">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-primary z-10" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-primary z-10" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-primary z-10" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-primary z-10" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/20 bg-primary/5">
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('pubkey')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    PUBKEY <SortIcon column="pubkey" />
                  </button>
                </th>
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider hidden md:table-cell">
                  <button
                    onClick={() => handleSort('ip')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    IP_ADDR <SortIcon column="ip" />
                  </button>
                </th>
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('version')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    VERSION <SortIcon column="version" />
                  </button>
                </th>
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('uptime')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    UPTIME <SortIcon column="uptime" />
                  </button>
                </th>
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider hidden lg:table-cell">
                  <button
                    onClick={() => handleSort('storageUsedBytes')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    STORAGE <SortIcon column="storageUsedBytes" />
                  </button>
                </th>
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider hidden sm:table-cell">
                  <button
                    onClick={() => handleSort('podsCount')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    PODS <SortIcon column="podsCount" />
                  </button>
                </th>
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider">STATUS</th>
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider hidden xl:table-cell">
                  <button
                    onClick={() => handleSort('updatedAt')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    LAST_SEEN <SortIcon column="updatedAt" />
                  </button>
                </th>
                <th className="text-left p-4 font-bold text-primary/80 uppercase tracking-wider w-20">CMD</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-primary/40">
                      <Terminal className="h-12 w-12 opacity-30" />
                      <p className="font-medium uppercase tracking-widest">NO_DATA_FOUND</p>
                      <p className="text-xs">ADJUST_SEARCH_PARAMETERS</p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 border-primary/30 text-primary hover:bg-primary/10 rounded-none">
                          RESET_FILTERS
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((pnode) => (
                  <tr
                    key={pnode.id}
                    className="border-b border-primary/10 last:border-0 hover:bg-primary/5 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <code className="text-primary/90 bg-primary/5 px-2 py-1">
                          {shortenPubkey(pnode.pubkey)}
                        </code>
                        <button
                          onClick={() => copyPubkey(pnode.pubkey)}
                          className="text-primary/40 hover:text-primary transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-primary/70 hidden md:table-cell">
                      {pnode.ip}:6000
                    </td>
                    <td className="p-4">
                      <span className="text-primary/90">
                        {pnode.version}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-primary/10 overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              pnode.uptime >= 95 ? 'bg-primary' :
                                pnode.uptime >= 80 ? 'bg-amber-500' : 'bg-destructive'
                            )}
                            style={{ width: `${pnode.uptime}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-12 text-primary/80">{pnode.uptime}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-primary/70 hidden lg:table-cell">{pnode.storageUsed}</td>
                    <td className="p-4 text-primary/70 hidden sm:table-cell">{pnode.podsCount}</td>
                    <td className="p-4"><StatusBadge status={pnode.status} /></td>
                    <td className="p-4 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-primary/50">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(pnode.updatedAt, { addSuffix: true }).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/50 hover:text-primary hover:bg-primary/10 rounded-none">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-primary/20 bg-primary/5">
            <p className="text-xs text-primary/60 uppercase">
              DISPLAYING {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedData.length)} OF {filteredAndSortedData.length} NODES
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-none border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-none border-primary/30",
                      currentPage === page ? "bg-primary text-black hover:bg-primary/90" : "text-primary hover:bg-primary/10"
                    )}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-none border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
