import { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { PNodeInfo } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { Tooltip as ReactTooltip } from 'react-tooltip';

interface NodesMapProps {
    nodes: PNodeInfo[];
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function NodesMap({ nodes }: NodesMapProps) {
    // Filter nodes with valid coordinates
    const markers = useMemo(() => {
        return nodes
            .filter(node => node.lat && node.lon)
            .map(node => ({
                name: node.ip,
                coordinates: [node.lon, node.lat] as [number, number],
                ...node
            }));
    }, [nodes]);

    return (
        <Card className="border-primary/20 bg-card overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-primary/5 pb-4">
                <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-bold text-primary tracking-wider">GLOBAL_DISTRIBUTION</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative h-[400px] bg-[#0a0a0a]">
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                        scale: 120,
                    }}
                    className="w-full h-full"
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#1a1a1a"
                                    stroke="#333"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#2a2a2a", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>
                    {markers.map((marker, i) => (
                        <Marker key={`${marker.pubkey}-${i}`} coordinates={marker.coordinates}>
                            <circle
                                r={4}
                                className="fill-primary stroke-background opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                strokeWidth={1}
                                data-tooltip-id="node-tooltip"
                                data-tooltip-content={`${marker.country} - ${marker.ip} (${marker.version})`}
                            />
                        </Marker>
                    ))}
                </ComposableMap>
                <ReactTooltip id="node-tooltip" className="z-50" />
            </CardContent>
        </Card>
    );
}
