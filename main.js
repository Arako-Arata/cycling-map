import maplibregl, { Properties } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new maplibregl.Map({
  container: 'map',
  zoom: 15,
  center: [139.661, 35.629],
  minZoom: 3,
  maxZoom: 18,
  maxBounds: [122, 20, 153, 46],
  style: {
    version: 8,
    sources: {
      //basemap source
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        maxzoom: 19,
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
      ports: {
        type: 'geojson',
        data: 'api/stations',
      }
    },

    layers: [
      {
        id: 'osm-layer',
        source: 'osm',
        type: 'raster',
      },
      {
        id: 'points-layer',
        source: 'ports',
        type: 'circle',
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'bikes'],
            0, '#888888',
            1, '#f8bf02'
          ],


          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            2,
            14,
            6,
          ],
        },
      },
    ],
  },
});

// P153 4-2-8 と P221 5-2-4
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['points-layer'],
  });
  if (features.length === 0) return;
  const feature = features[0];
  const popup = new maplibregl.Popup()
    .setLngLat(feature.geometry.coordinates)

    // ポップアップの内容
    .setHTML(
      `
    <div style="font-weight:1000; font-size: 1rem;">${feature.properties.name
      }</div>
    <div style="font-weight:450; font-size: 0.5rem;">${feature.properties.address
      }</div>
    <div style="font-weight:600; font-size: 0.7rem;">貸出可能: ${feature.properties.bikes} 台</div>
    <div style="font-weight:600; font-size: 0.7rem;">返却可能: ${feature.properties.docks} 台</div> 
      `
    )
    .addTo(map);

});

// P221 5-2-4
map.on('mousemove', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['points-layer'],
  });
  if (features.length > 0) {
    map.getCanvas().style.cursor = 'pointer';
  } else {
    map.getCanvas().style.cursor = '';
  }
});

