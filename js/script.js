$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(100).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

// **************** Initialize Leaflet and OSM ************************************ //
const map = L.map('map', { zoomControl: false }).fitWorld();

// Locate current users position
map.locate({setView: true, maxZoom: 5});

// Add osm as tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);
// Zoom and scale
L.control.zoom({ position: 'topleft' }).addTo(map);

L.control.scale({ position: 'bottomright'}).addTo(map);

// Info button
L.HamburgerControl = L.Control.extend({

    options: {
        position: 'bottomleft'

    },
    onAdd: function () {
        let container = L.DomUtil.create('div', 'infobtn');
        let button = L.DomUtil.create('a', '', container);
        button.innerHTML = '<i class="fas fa-info-circle"></i>';
        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.on(button, 'click', this._click);

        container.title = "Open Menu";

        return container;
    },
    _click : function () {
        document.getElementById('side-menu').style.width='300px';
    }
});

new L.HamburgerControl().addTo(map);

$('.infobtn').css({ 'font-size' : '5rem', 'color' : '#222153'});

function openSlideMenu() {
	document.getElementById('side-menu').style.width='300px';
}
function closeSlideMenu() {
	document.getElementById('side-menu').style.width='0';
}

// **************************************************************************************** //

// ********************** Select weather map ********************************************** //
let myWeatherLayer;
let initialLayerCount = 0;

$( "#weather" ).change(function() {
    let selWeatherLayer = $('#weather').val();

    if (initialLayerCount > 0) {
        myWeatherLayer.remove();
    } 

    if(selWeatherLayer === 'none') {
        myWeatherLayer.remove();
    } else {
        initialLayerCount = 1;
        myWeatherLayer = L.tileLayer('https://tile.openweathermap.org/map/' + selWeatherLayer + '_new/{z}/{x}/{y}.png?appid=63df060eaace2012a0cb1f7cc925ad64', {
            maxZoom: 19,
            attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
        });
        myWeatherLayer.addTo(map);
    }
});

// **************************************************************************************** //

// ******************** Accessing Open Cage *********************************************** //

const getOpenCage = (lat, lng) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "php/getOpenCage.php",
            type: 'POST',
            dataType: 'json',
            data: {
                lat: lat,
                lng: lng,
            },
            success: function(result) {
                if (result.status.name == "ok") {       
                    resolve(result);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                reject(errorThrown);
            }
        }); 
    });
}

// **************************************************************************************** //

// ********************** Updates panes with selected country  **************************** //

let countryBorders = new L.geoJson();
countryBorders.addTo(map);

function updatePane(alpha) {
    $.ajax({
        url: "php/getCountryBorders.php",
        type: 'POST',
        dataType: "json",
    success: function(result) {

        countryBorders.clearLayers();

        $(result.data.features).each(function(key, country) {

            if (country.properties.iso_a2 === alpha) {
                countryBorders.addData(country);
            } 
        });

        map.fitBounds(countryBorders.getBounds(), {padding: [100, 100]});
    }
    }).error(function() {});
}

// **************************************************************************************** //

// ******************** Retrieve the airport data ***************************************** //

let latArray = [];
let lngArray = [];

const getAirportGeoJson = (countryName) => {
    let jsonFeatures = [];
    latArray =  [];
    lngArray = [];
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "php/getAirports.php",
            type: 'POST',
            dataType: "json",
        success: function(result) {

            result.data.forEach(function(point){

                let lat = point.lat;
                let lon = point.lon;

                if(point.country === countryName && point.type === "Airports" && point.direct_flights > 20 && jsonFeatures.length < 30) {
                    var feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon,lat]
                        }
                    };
                    jsonFeatures.push(feature);

                    latArray.push(lat);
                    lngArray.push(lon);
                }          
            });

            const geoJson = { type: 'FeatureCollection', features: jsonFeatures };
            resolve(geoJson);

        }
        }).error(function(error) {reject(error);});
    });
}

// **************************************************************************************** //

// ******************** Create weather array ********************************************** //

const getWeatherArray = async () => {
    let weatherArray = [];
    let weatherObj = {};

    for(let i = 0; i < latArray.length; i++) {

        const weatherResult = await getWeatherResult(latArray[i], lngArray[i]);
      
        let desc = weatherResult['data']['weather'][0]['description'];
        let temp = weatherResult['data']['main']['temp'];
        let pressure = weatherResult['data']['main']['pressure'];
        let humidity = weatherResult['data']['main']['humidity'];
        let wind = weatherResult['data']['wind']['speed'];

        weatherObj = {
            description: desc,
            temperature: temp,
            pressure: pressure,
            humidity: humidity,
            wind_speed: wind
        }

        weatherArray.push(weatherObj);
    }
    return weatherArray;
}

// **************************************************************************************** //

// ********************** Get Open Weather data ******************************************* //

const getWeatherResult = (lat, lng) => {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "php/getWeather.php",
            type: 'POST',
            dataType: 'json',
            data: {
                lat: lat,
                lng: lng,
            },
            success: function(result) {
                if (result.status.name == "ok") {  
                    resolve(result);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
                reject(errorThrown);
            }
        }); 
    });
}

// **************************************************************************************** //

// ******************** Add markers for the aiport and with its weather data  ************* //
    
let airportLayer;
let removeAirportLayer = false;

function addAirportLayer(geoJson, weatherArray) {

    if (removeAirportLayer) {
        map.removeLayer(airportLayer);
    }

    removeAirportLayer = true;

    let arrayCount = 0;
    
    airportLayer = new L.geoJson(geoJson, {
        onEachFeature: function (feature, layer) {
            let popupContent = [];
            let airportArray = [];
            let addWeatherArray = [];
      
            for (let key in feature.properties) {
                if(key === 'name' || key === 'city' || key === 'country' || key === 'carriers') {
                    airportArray.push(key + ": " + feature.properties[key]);
                } else if (key === 'url') {
                    airportArray.push(key + ": " + '<span>' + feature.properties[key] + '</span>');
                } else if (key === 'direct_flights' || key === 'runway_length') {
                    let str = key;
                    let removeUnderscore = str.replace('_', ' ');
                    airportArray.push(removeUnderscore + ": " + feature.properties[key]);
                }
            }
          
            if(feature.geometry.type === "Point")
            {
                airportArray.push("Latitude: " + feature.geometry.coordinates[1] + '°');
                airportArray.push("Longitude: " + feature.geometry.coordinates[0] + '°');
            }
                      
            for(let key in weatherArray[arrayCount]) {
                if (key === 'temperature') {
                    addWeatherArray.push(key + ": " + weatherArray[arrayCount][key]  + '°C');
                } else if (key === 'pressure'){
                    addWeatherArray.push(key + ": " + weatherArray[arrayCount][key]  + 'hPa');
                } else if (key === 'humidity'){
                    addWeatherArray.push(key + ": " + weatherArray[arrayCount][key]  + '%');
                } else if (key === 'wind_speed'){
                    let str = key;
                    let removeUnderscore = str.replace('_', ' ');
                    addWeatherArray.push(removeUnderscore + ": " + weatherArray[arrayCount][key]  + 'm/s');
                } else {
                    addWeatherArray.push(key + ": " + weatherArray[arrayCount][key]);
                }
            }

            addWeatherArray.unshift('<h1>Weather</h1>');

            popupContent = airportArray.concat(addWeatherArray);
  
            popupContent.unshift('<h1>Airport</h1>')
            layer.bindPopup(popupContent.join("<p>"));

            arrayCount++
        }
    }).addTo(map);

}

// **************************************************************************************** //

// ********************** getRestCountries to update country info sidebar ***************** //

function getRestCountries(alpha) {
    $.ajax({
    url: "php/getRestCountries.php",
    type: 'POST',
    dataType: 'json',
    data: {
        alpha: alpha
    },
    success: function(result) {

        if (result.status.name == "ok") {
            
            let flag = result['data']['flag'];

            $('#flag').attr('src', flag);
            $('#country').html(result['data']['name']);
            $('#nativeName').html(result['data']['nativeName']);
            $('#capital').html(result['data']['capital']);
            $('#nativeLang').html(result['data']['languages'][0]['name']);
            $('#demonym').html(result['data']['demonym']);
            $('#population').html(result['data']['population']);
            $('#region').html(result['data']['region']);
            $('#subregion').html(result['data']['subregion']);

        }

    }
}).error(function() {});
}

// **************************************************************************************** //

// ********************** Intialise current location ************************************** //

function geoInit() {

    async function success(position) {
        let latitude  = await position.coords.latitude;
        let longitude =  await position.coords.longitude;

        const openCage = await getOpenCage(latitude, longitude);

        const countryName = openCage['data']['results'][0]['components']['country'];
        const alpha = openCage['data']['results'][0]['components']['ISO_3166-1_alpha-2'];

        updatePane(alpha);

        const airportGeoJson =  await getAirportGeoJson(countryName);
        const weatherArray = await getWeatherArray();
        addAirportLayer(airportGeoJson, weatherArray);

        getRestCountries(alpha);
    }
  
    function error() {
      status.textContent = 'Unable to retrieve location';
    }
  
    if(!navigator.geolocation) {
      status.textContent = 'Geolocation is not supported by your browser';
    } else {
      status.textContent = 'Locating…';
      navigator.geolocation.getCurrentPosition(success, error);
    }
  
}

geoInit();

// **************************************************************************************** //

// *********************** Map clicked **************************************************** //

map.on('click', async function(e){
    let coord = e.latlng;
    let latitude = coord.lat;
    let longitude = coord.lng;
    
    const openCage = await getOpenCage(latitude, longitude);

    const countryName = openCage['data']['results'][0]['components']['country'];
    const alpha = openCage['data']['results'][0]['components']['ISO_3166-1_alpha-2'];

    updatePane(alpha);

    const airportGeoJson =  await getAirportGeoJson(countryName);
    const weatherArray = await getWeatherArray();
    addAirportLayer(airportGeoJson, weatherArray);
    
    getRestCountries(alpha);
});

// **************************************************************************************** //

// *********************** Get country name for country select option ********************* // 

const getCountryName = selAlpha => {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "php/getCountryName.php",
            type: 'POST',
            dataType: "json",
        success: function(result) {
            result.data.forEach(function(country) {
                if(country.alpha2 === selAlpha) {
                    countryName = country.name;
                    resolve(countryName);
                }
            });
        }
        }).error(function() {reject(error);});
    });
}

// **************************************************************************************** //

// *********************** Country select ************************************************* //
$('#countryList').change(async function() {

    const selAlpha = $('#countryList').val();
    const nameOfCountry = await getCountryName(selAlpha);

    updatePane(selAlpha);

    const airportGeoJson =  await getAirportGeoJson(nameOfCountry);
    const weatherArray = await getWeatherArray();

    addAirportLayer(airportGeoJson, weatherArray);
    getRestCountries(selAlpha);
});
// **************************************************************************************** //