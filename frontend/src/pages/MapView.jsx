import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../utils/api'

// Custom yellow/orange icon for current location
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function LocationMarker() {
  const [position, setPosition] = useState(null)
  const map = useMap()

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
    })
  }, [map])

  return position === null ? null : (
    <Marker position={position} icon={currentLocationIcon}>
      <Popup>You are here</Popup>
    </Marker>
  )
}

export default function MapView() {
  const [markers, setMarkers] = useState([])
  const [filter, setFilter] = useState('all')
  
  useEffect(() => { 
    api.get('/ai/map-markers').then(r => setMarkers(r.data)).catch(()=>{}) 
  }, [])

  const filteredMarkers = filter === 'all' ? markers : markers.filter(m => m.status === filter)
  const lost = markers.filter(m => m.status === 'lost')
  const found = markers.filter(m => m.status === 'found')
  const other = markers.filter(m => m.status !== 'lost' && m.status !== 'found')

  // Yellow-orange color scheme for map markers
  const colorMap = { 
    lost: '#ef4444',        // Red for lost
    found: '#10b981',       // Green for found
    registered: '#fbbf24',  // Yellow for registered
    returned: '#f97316'     // Orange for returned
  }

  const getBtnStyle = (btnFilter) => ({
    background: filter === btnFilter ? 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' : '#44403c',
    color: filter === btnFilter ? '#1c1917' : '#a8a29e'
  })

  const gradientTextStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }

  const popupStyle = {
    background: 'linear-gradient(135deg, #292524 0%, #1c1917 100%)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '8px',
    padding: '8px',
    color: '#fef3c7'
  }

  return (
    <div className="w-full">
      <div className="card mb-5">
        <div className="card-title" style={gradientTextStyle}>🗺️ Interactive Lost & Found Map</div>
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <button onClick={() => setFilter('all')} style={getBtnStyle('all')} className="px-3 py-1 rounded-full">
            All ({markers.length})
          </button>
          <button onClick={() => setFilter('lost')} style={getBtnStyle('lost')} className="px-3 py-1 rounded-full">
            Lost ({lost.length})
          </button>
          <button onClick={() => setFilter('found')} style={getBtnStyle('found')} className="px-3 py-1 rounded-full">
            Found ({found.length})
          </button>
          <button onClick={() => setFilter('registered')} style={getBtnStyle('registered')} className="px-3 py-1 rounded-full">
            Registered ({other.length})
          </button>
        </div>
        <div className="h-96 md:h-[480px] rounded-2xl overflow-hidden" style={{border: '2px solid #f97316', boxShadow: '0 8px 30px rgba(251, 191, 36, 0.2)'}}>
          <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{height:'100%',width:'100%'}} zoomControl={true}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />
            <LocationMarker />
            {filteredMarkers.map(m => (
              <CircleMarker key={m.token_id} center={[m.latitude, m.longitude]}
                radius={12} pathOptions={{ color: colorMap[m.status] || '#fbbf24', fillColor: colorMap[m.status] || '#fbbf24', fillOpacity: 0.9, weight: 3 }}>
                <Popup>
                  <div style={popupStyle}>
                    <div className="font-bold text-lg mb-1" style={{color: '#fef3c7'}}>{m.name}</div>
                    <div className="text-sm mb-2" style={{color: '#a8a29e'}}>{m.status ? m.status.toUpperCase() : 'N/A'} • {m.token_id}</div>
                    <div className="text-sm" style={{color: '#78716c'}}>{m.category}</div>
                    {m.reward_amount > 0 && (
                      <div className="mt-2 font-bold" style={{color: '#fbbf24'}}>Reward: ₹{m.reward_amount}</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div className="mt-4 text-sm text-center" style={{color: '#78716c'}}>
          📍 Showing <strong style={{color: '#fbbf24'}}>{filteredMarkers.length}</strong> reports. Tap markers for details. Your location is shown in gold.
        </div>
      </div>
    </div>
  )
}

