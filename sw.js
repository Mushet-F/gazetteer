const cacheName = "Gazetteer";
const staticAssets = [
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',
    './css/index.css',
    './data/airports.json',
    './data/countryBorders.geo.json',
    './data/countryCoords.json',
    './img/airport.png',
    './img/city.png',
    './img/landmark.png',
    './img/world-map-192x192.png',
    './img/world-map-512x512.png',
    './js/script.js',
    './php/getData.php',
    './vendors/bootstrap/css/bootstrap.min.css',
    './vendors/bootstrap/css/bootstrap.min.css.map',
    './vendors/bootstrap/js/bootstrap.min.js',
    './vendors/bootstrap/js/bootstrap.min.js.map',
    './vendors/fontawesome/css/all.min.css',
    './vendors/fontawesome/webfonts/fa-solid-900.woff2',
    './vendors/jquery/jquery-2.2.3.min.js',
    './vendors/leaflet/images/layers-2x.png',
    './vendors/leaflet/leaflet.css',
    './vendors/leaflet/leaflet.js',
    './vendors/leaflet/leaflet.js.map',
    './vendors/leaflet/leaflet.markercluster.js',
    './vendors/leaflet/leaflet.markercluster.js.map',
    './vendors/leaflet/MarkerCluster.css',
    './vendors/leaflet/MarkerCluster.Default.css'
];

self.addEventListener('install',  e => {
    e.waitUntil(
        caches.open("static").then(cache => {
            return cache.addAll(staticAssets);
        })
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});