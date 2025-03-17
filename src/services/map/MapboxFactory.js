import MapFactory from './MapFactory';
import MapboxMap from './MapboxMap';
import MapboxMarker from './MapboxMarker';
import MapboxPopup from './MapboxPopup';
import MapboxCircle from './MapboxCircle';

// Mapbox 實現工廠
class MapboxFactory extends MapFactory {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  createMap(containerId, options) {
    options.accessToken = options.accessToken || this.apiKey;
    return new MapboxMap(containerId, options);
  }

  createMarker(lngLat, options) {
    return new MapboxMarker(lngLat, options);
  }

  createPopup(options) {
    return new MapboxPopup(options);
  }

  createCircle(center, radius, options) {
    return new MapboxCircle(center, radius, options);
  }
}

export default MapboxFactory;