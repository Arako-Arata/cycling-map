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
      // ports source
      ports: {
        type: 'geojson',
        data: 'api/stations',
      },
    },


    // id: i
    // name: n
    // address: a
    // bikes: b
    // docks: d

    layers: [
      {
        id: 'osm-layer',
        source: 'osm',
        type: 'raster',
        paint: { 'raster-opacity': 0.6 },
      },
      {
        id: 'points-layer',
        source: 'ports',
        type: 'circle',
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'b'],
            0, '#94a3b8',
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

          'circle-stroke-width': 1.1,
          'circle-stroke-color': '#fff',

          // P178
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            0,
            9,
            0.1,
            11,
            0.5,
            12,
            0.9,
            13, //level
            1.0, //100%
          ],

          'circle-stroke-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            0,
            9,
            0.1,
            11,
            0.5,
            12,
            0.9,
            13, //level
            1.0, //100%
          ],

          // p213 5.2.3.


        },
      },
      // P174 heatmap 
      {
        id: 'points-heatmap-layer',
        source: 'ports',
        type: 'heatmap',
        maxzoom: 12,
        paint: {
          'heatmap-weight': 0.01,
          'heatmap-opacity': 0.7,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.3,
            'rgba(253,224,71,0.55)',
            0.6,
            'rgba(248,191,2,0.85)',
            0.85,
            'rgba(234,118,0,0.95)',
            1.0,
            'rgba(194,64,12,1)',
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
    <div style="font-weight:1000; font-size: 1rem;">${feature.properties.n
      }</div>
    <div style="font-weight:450; font-size: 0.5rem;">${feature.properties.a
      }</div>
    <div style="font-weight:600; font-size: 0.7rem;">貸出可能: ${feature.properties.b} 台</div>
    <div style="font-weight:600; font-size: 0.7rem;">返却可能: ${feature.properties.d} 台</div> 
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

