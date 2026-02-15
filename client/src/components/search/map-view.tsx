
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Item, Report } from "@shared/schema";
import { divIcon } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in React Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
    items: (Item | Report)[];
    className?: string;
}

export default function MapView({ items, className }: MapViewProps) {
    // Default center (Kigali, Rwanda)
    const defaultCenter: [number, number] = [-1.9441, 30.0619];

    // Helper to extract lat/long from textual location (Mocking geocoding for now)
    // In a real app, we would store lat/long in the DB
    const getCoordinates = (location: string): [number, number] => {
        // Simple mock deterministic offset based on string hash to spread items around Kigali
        const hash = location.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const latOffset = (hash % 100) / 10000;
        const lngOffset = ((hash >> 2) % 100) / 10000;

        return [defaultCenter[0] + latOffset, defaultCenter[1] + lngOffset];
    };

    const createCustomIcon = (type: string) => {
        const color = type === 'lost' ? 'text-red-500' : 'text-green-500';
        const html = renderToString(<MapPin className={`w-8 h-8 ${color} fill-current`} />);
        return divIcon({
            html: html,
            className: 'custom-marker-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });
    };

    return (
        <div className={className}>
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={false} className="h-full w-full rounded-lg z-0">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {items.map((item) => {
                    const isReport = 'type' in item;
                    if (!item.location) return null;
                    const position = getCoordinates(item.location);
                    const type = isReport ? (item as Report).type : 'registered';

                    return (
                        <Marker key={item.id} position={position} icon={DefaultIcon}>
                            <Popup>
                                <div className="font-semibold">{isReport ? (item as Report).title : (item as Item).name}</div>
                                <div className="text-sm text-gray-500">{item.location}</div>
                                <div className="text-xs uppercase font-bold mt-1">{type}</div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
