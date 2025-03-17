import mapboxgl from 'mapbox-gl';

// Mapbox 標記實現
class MapboxMarker {
  constructor(lngLat, options = {}) {
    if (options.element) {
      this.markerInstance = new mapboxgl.Marker({
        element: options.element,
        anchor: options.anchor || 'bottom',
        offset: options.offset || [0, 0]
      }).setLngLat(lngLat);
    } else {
      this.markerInstance = new mapboxgl.Marker(options).setLngLat(lngLat);
    }
    
    this.data = options.data || null;
  }

  addTo(map) {
    this.markerInstance.addTo(map.getMapInstance());
    return this;
  }

  setLngLat(lngLat) {
    this.markerInstance.setLngLat(lngLat);
    return this;
  }

  getLngLat() {
    return this.markerInstance.getLngLat();
  }
  
  setData(data) {
    this.data = data;
    return this;
  }
  
  getData() {
    return this.data;
  }

  on(event, callback) {
    this.markerInstance.getElement().addEventListener(event, callback);
    return this;
  }

  remove() {
    this.markerInstance.remove();
    return this;
  }
}

export default MapboxMarker;