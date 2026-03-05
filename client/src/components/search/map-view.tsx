
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Item, Report } from "@shared/schema";
import { divIcon } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { MapPin, Search, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface MapViewProps {
    items: (Item | Report)[];
    className?: string;
}

export default function MapView({ items, className }: MapViewProps) {
    // Default center (Kigali, Rwanda)
    const defaultCenter: [number, number] = [-1.9441, 30.0619];

    // Helper to extract lat/long from textual location (Mocking geocoding for now)
    const getCoordinates = (location: string): [number, number] => {
        const hash = location.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const latOffset = (hash % 100) / 10000;
        const lngOffset = ((hash >> 2) % 100) / 10000;
        return [defaultCenter[0] + latOffset, defaultCenter[1] + lngOffset];
    };

    const createCustomIcon = (type: 'lost' | 'found' | 'registered') => {
        let colorClass = 'text-blue-500';
        let bgClass = 'bg-blue-500/10';
        let Icon = MapPin;

        if (type === 'lost') {
            colorClass = 'text-red-500';
            bgClass = 'bg-red-500/10';
            Icon = Search;
        } else if (type === 'found') {
            colorClass = 'text-green-500';
            bgClass = 'bg-green-500/10';
            Icon = CheckCircle;
        }

        const html = renderToString(
            <div className={`relative flex items-center justify-center w-10 h-10 group transition-transform hover:scale-110`}>
                <div className={`absolute inset-0 ${bgClass} rounded-full animate-ping opacity-20`} />
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg bg-white`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <div className={`absolute -bottom-1 w-2 h-2 bg-white rotate-45 border-b-2 border-r-2 border-white shadow-sm`} />
            </div>
        );

        return divIcon({
            html: html,
            className: 'custom-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });
    };

    return (
        <div className={`relative border border-border/50 rounded-xl overflow-hidden shadow-sm ${className}`}>
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={false} className="h-full w-full z-0">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* CSS to clean up Leaflet defaults further */}
                <style>{`
                    .leaflet-popup-content-wrapper {
                        padding: 0;
                        overflow: hidden;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    .leaflet-popup-content {
                        margin: 0;
                        width: auto !important;
                    }
                    .leaflet-popup-tip {
                        box-shadow: none;
                    }
                    .custom-marker {
                        background: none;
                        border: none;
                    }
                `}</style>

                {items.map((item) => {
                    const isReport = 'type' in item;
                    if (!item.location) return null;
                    const position = getCoordinates(item.location);
                    const type = isReport ? (item as Report).type : 'registered';
                    const link = type === 'registered' ? `/items/${item.id}` : `/reports/${item.id}`;

                    return (
                        <Marker
                            key={`${type}-${item.id}`}
                            position={position}
                            icon={createCustomIcon(type as any)}
                        >
                            <Popup className="premium-popup">
                                <div className="p-3 w-56 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${type === 'lost' ? 'bg-red-100 text-red-700' :
                                                type === 'found' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {type}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="font-bold text-sm text-foreground leading-tight">
                                            {isReport ? (item as Report).title : (item as Item).name}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {item.location}
                                        </div>
                                    </div>

                                    <div className="mt-2 border-t pt-2 flex justify-end">
                                        <Link href={link}>
                                            <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold gap-1 rounded-lg">
                                                <Info className="w-3 h-3" /> Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
