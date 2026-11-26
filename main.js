import maplibregl, { Properties } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import distance from '@turf/distance'
import OpacityControl from 'maplibre-gl-opacity';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css';

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
      Tanshoku: {
        type: 'raster',
        tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
        maxzoom: 19,
        tileSize: 256,
        attribution:
          '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
      },
      // ports source
      ports: {
        type: 'geojson',
        data: 'api/stations',
        attribution:
          '&copy; <a href="https://ckan.odpt.org/dataset/c_bikeshare_gbfs-openstreet">OpenStreet株式会社 / 公共交通オープンデータ協議会</a>',
      },
      route: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      },
    },


    // id: i
    // name: n
    // address: a
    // bikes: b
    // docks: d

    layers: [
      // base map
      {
        id: 'osm-layer',
        source: 'osm',
        type: 'raster',
        paint: { 'raster-opacity': 0.6 },
      },

      {
        id: 'Tanshoku-layer',
        source: 'Tanshoku',
        type: 'raster',
        paint: { 'raster-opacity': 0.5 },
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
      // P174 ヒートマップ
      {
        id: 'points-heatmap-layer',
        source: 'ports',
        type: 'heatmap',
        maxzoom: 12,
        paint: {
          'heatmap-weight': 0.015,
          'heatmap-opacity': 0.55,
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
            'rgba(234,88,12,0.9)',
          ],
        },
      },
      {
        id: 'route-layer',
        source: 'route',
        type: 'line',
        paint: {
          'line-color': '#2563eb',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2],
        },
      },
    ],
  },
});

// P204 basemapの切り替え
map.on('load', () => {
  const opacity = new OpacityControl({
    baseLayers: {
      'osm-layer': 'OpenStreetMap',
      'Tanshoku-layer': '淡色地図',
    },
  });
  map.addControl(opacity, 'top-left');
});



// P153 4-2-8 と P221 5-2-4 ポップアップ
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['points-layer'],
  });
  if (features.length === 0) return;
  const feature = features[0];

  // GoogleMaps検索の準備
  const [lng, lat] = feature.geometry.coordinates;
  const portscoordinates = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const portsroute = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const popup = new maplibregl.Popup()
    .setLngLat(feature.geometry.coordinates)

  
    .setHTML(
      `
    <div style="font-weight:1000; font-size: 1rem;">${feature.properties.n
      }</div>

    <div style="font-weight:450; font-size: 0.5rem;">
      <a href = "${portscoordinates}" target="_blank" rel="noopener noreferrer">${feature.properties.a}</a></div>

    <div>
      <a href = "${portsroute}" target="_blank" rel="noopener noreferrer">ポートまでの経路</a></div>

    <div style="font-weight:600; font-size: 0.7rem;">貸出可能: ${feature.properties.b} 台</div>
    <div style="font-weight:600; font-size: 0.7rem;">返却可能: ${feature.properties.d} 台</div> 
      `
    )
    .addTo(map);

});

// P221 5-2-4 マウスポインタの見た目
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

// 方位と縮尺
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl(), 'bottom-left');


// P226 5-2-6 位置情報，最寄りポートの計算
let userLocation = null;

const geolocationControl = new maplibregl.GeolocateControl({
  trackUserLocation: true,
});
map.addControl(geolocationControl, 'bottom-right');
geolocationControl.on('geolocate', (e) => {
  userLocation = [e.coords.longitude, e.coords.latitude];
});

const getNearestFeature = (longitude, latitude) => {
  const features = map.querySourceFeatures('ports', {
    filter: ['<', 0, ['get', 'b']],
  });
  if (features.length === 0) return null;



  const nearestFeature = features.reduce((minDistFeature, feature) => {
    const dist = distance(
      [longitude, latitude],
      feature.geometry.coordinates,
    );
    if (minDistFeature === null || minDistFeature.properties.dist > dist)

      return {
        ...feature,
        properties: {
          ...feature.properties,
          dist,
        },
      };

    return minDistFeature;
  }, null);

  return nearestFeature;
};

map.on('load', () => {
  map.on('render', () => {
    if (geolocationControl._watchState === 'OFF') userLocation = null;
    if (map.getZoom() < 7 || userLocation === null) {
      map.getSource('route').setData({
        type: 'FeatureCollection',
        features: [],
      });
      return;
    }
    const nearestFeature = getNearestFeature(
      userLocation[0],
      userLocation[1],
    );

    const routeFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          userLocation,
          nearestFeature._geometry.coordinates,
        ],
      },
    };

    map.getSource('route').setData({
      type: 'FeatureCollection',
      features: [routeFeature],
    });
  });
});