// **************** Initialize Leaflet, OpenWeather overlay and OSM base layer ************ //
// OpenWeatherMaps overlay options
const clouds = L.tileLayer('https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=63df060eaace2012a0cb1f7cc925ad64', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
});

const precipitation = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=63df060eaace2012a0cb1f7cc925ad64', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
});

const pressure = L.tileLayer('https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=63df060eaace2012a0cb1f7cc925ad64', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
});

const temp = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=63df060eaace2012a0cb1f7cc925ad64', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
});

const wind = L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=63df060eaace2012a0cb1f7cc925ad64', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
});

const weatherMaps = {
    "Clouds": clouds,
    "Precipitation": precipitation,
    "Pressure": pressure,
    "Temperature": temp,
    "Wind": wind
};

// Add osm as base layer
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
});

const baseMap = {
    "OSM": osm
}

const map = L.map('map', { 
    zoomControl: false,
    layers: osm
},).fitWorld();

L.control.layers(baseMap, weatherMaps, {hideSingleBase: true}).addTo(map);

// Locate current users position
map.locate({setView: true, maxZoom: 5});

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
        button.innerHTML = '<i data-toggle="modal" data-target="#staticBackdrop" class="fas fa-info-circle"></i>';
        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.on(button, 'click', this._click);

        container.title = "Open Menu";

        return container;
    },
    _click : function () {

    }
});

new L.HamburgerControl().addTo(map);

$('.infobtn').css({ 'font-size' : '5rem'});

// **************************************************************************************** //

// ********************** loader ********************************************************** //

let active = true;

function loader() {

    if(active) {
        document.getElementById("loader").style.display = "none";
        active = false; 
    } else {
        document.getElementById("loader").style.display = "inline";
        active = true;
    }

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

// ********************** Custom Markers ************************************************** //

const LeafIcon = L.Icon.extend({
    options: {
        iconSize:     [32, 47],
        iconAnchor:   [22, 47],
        popupAnchor:  [-6, -45]
    }
});

let airportIcon = new LeafIcon({iconUrl: 'img/airport.png'});
let cityIcon = new LeafIcon({iconUrl: 'img/city.png'});
let landmarkIcon = new LeafIcon({iconUrl: 'img/landmark.png'});

L.icon = function (options) {
    return new L.Icon(options);
};

// **************************************************************************************** //

// ********************** Cluster Markers ************************************************* //

let markers;
let markersLayer = false;

function clusterMarkers(airportLayer, cityLayer, landmarkLayer) {

    if (markersLayer) {
        map.removeLayer(markers);
    }

    markersLayer = true;

    markers = L.markerClusterGroup();

    markers.addLayer(airportLayer);
    markers.addLayer(cityLayer);
    markers.addLayer(landmarkLayer);

    map.addLayer(markers);
}

// **************************************************************************************** //

// ******************** Calling getData *************************************************** //

let init = true;
const getData = async (lat, lng) => {

    return new Promise((resolve, reject) => {
        $.ajax({
            url: "php/getData.php",
            type: 'POST',
            dataType: 'json',
            data: {
                lat: lat,
                lng: lng,
                init: init
            },
            success: function(result) {
                if (result.status.name == "ok") {   
                    init = false;  
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

// ******************** Create the dropdown menu  ***************************************** //

function createCountryList(dropdown, countryCode) {
    
    let html = "<option value='' disabled >Select Country</option>";

    for(let key in dropdown) {
        if(dropdown[key]['iso'] === countryCode) {
            html += "<option value=" + dropdown[key]['iso']  + " selected >" + dropdown[key]['name'] + "</option>";
        } else {
            html += "<option value=" + dropdown[key]['iso']  + ">" + dropdown[key]['name'] + "</option>";
        }
    }
    document.getElementById("countryList").innerHTML = html;
    
}

// **************************************************************************************** //

// ********************** worldBorders and event handling   ******************************* //

function style() {
    return {
        fillColor: '#45A292',
        opacity: 0,
        fillOpacity: 0
    };
}

function highlightFeature(e) {
    let layer = e.target;

    layer.setStyle({
        fillOpacity: 0.7
    });

}

function highlightClick(e) {
    let layer = e.target;

    layer.setStyle({
        fillColor: '#45A292',
        fillOpacity: 0.5
    });

}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: highlightClick,
    });
}

function worldBorders(borders) {

    geojson = L.geoJson(borders, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);

}

// **************************************************************************************** //

// ********************** updatePane of selected country  ********************************* //

let countryBorders;
let updateCount = 0;

function polystyle() {
    return {
        fillColor: '#66FCF1 ',
        weight: 2,
        opacity: 1,
        color: '#0B0C10',  
        fillOpacity: 0.2
    };
}

function updatePane(borders, countryCode) {

    if(updateCount !== 0) {
        countryBorders.clearLayers();
    } else {
        worldBorders(borders);
    }

    $(borders.features).each(function(key, country) {
        if (country.properties.iso_a2 === countryCode) {
            countryBorders = new L.geoJson(country, {
                style: polystyle
            });
            countryBorders.addTo(map);
        } 
    });

    map.fitBounds(countryBorders.getBounds(), {padding: [100, 100]});
    updateCount = 1;
    
}

// **************************************************************************************** //

// ******************** Retrieve the airport data and create airport geoJson ************** //

let latArray = [];
let lngArray = [];

const createAirportGeoJson = (airports) => {

    let jsonFeatures = [];
    
    airports.forEach(function(point){

        let lat = point.lat;
        let lon = point.lon;

        let feature = {
            type: 'Feature',
            properties: point,
            geometry: {
                type: 'Point',
                coordinates: [lon,lat]
            }
        };

        jsonFeatures.push(feature);
    });

    const geoJson = { type: 'FeatureCollection', features: jsonFeatures };
    return geoJson;

}

// **************************************************************************************** //

// ******************** Create weather array ********************************************** //

const createWeatherArray = weather => {

    let weatherArray = [];
    let weatherObj = {};

    for(let i = 0; i < weather.length; i++) {
      
        let desc = weather[i]['weather'][0]['description'];
        let temp = weather[i]['main']['temp'];
        let pressure = weather[i]['main']['pressure'];
        let humidity = weather[i]['main']['humidity'];
        let wind = weather[i]['wind']['speed'];

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

// ********* Add markers and popup content for the aiport layer  ************************** //

const createAirportLayer = (geoJson, weatherArray) => {

    let arrayCount = 0;
    
    airportLayer = new L.geoJson(geoJson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: airportIcon});
        },
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
    });

    return airportLayer;

}

// **************************************************************************************** //

// ******************** Retrieve the city data and create city geoJson ***************** //

const createCitiesGeoJson = cities => {

    let jsonFeatures = [];
    let lng;
    let lat;

    cities.forEach(function(point){

        lng = point.lng;
        lat = point.lat;

        let feature = {
            type: 'Feature',
            properties: point,
            geometry: {
                type: 'Point',
                coordinates: [lng,lat]
            }
        };

        jsonFeatures.push(feature); 

    });

    const geoJson = { type: 'FeatureCollection', features: jsonFeatures };
    return geoJson;
        
}

// **************************************************************************************** //

// *********************** createCityInfoArray ******************************************** //

const createCityInfoArray = (cityInfo, countryCode, citiesName) => {

    let cityInfoObj = {};
    let cityInfoArray = [];

    for(let i = 0; i < cityInfo.length; i++) {

        let cityName;
        let summary;
        let wikipediaUrl;
        let landmarks = [];
        
        let jump = false;
        
        if(cityInfo[i] !== null) {

            for(key in cityInfo[i]) {
                if(key === 'status') {
                    jump = true;
                }
            }

            if(jump) {
                jump = false;
                continue;
            }

            for(let j = 0; j < cityInfo[i].geonames.length; j++) {
                if(cityInfo[i].geonames[j].title === citiesName[i]) {
                    cityName = cityInfo[i].geonames[j].title;
                    summary = cityInfo[i].geonames[j].summary;
                    wikipediaUrl = cityInfo[i].geonames[j].wikipediaUrl;
                }
    
                if(cityInfo[i].geonames[j].feature === 'landmark' && landmarks.length < 3 && cityInfo[i].geonames[j].countryCode === countryCode) {
                    landmarks.push(cityInfo[i].geonames[j].title);
                }
            }
    
            cityInfoObj = {
                city: cityName,
                summary: summary,
                wikipediaUrl, wikipediaUrl,
                landmark1: landmarks[0],
                landmark2: landmarks[1],
                landmarks3: landmarks[2]
            }
    
            cityInfoArray.push(cityInfoObj);    
        }

    }

    return cityInfoArray;

}

// **************************************************************************************** //

// ********* Add markers and popup content for the city and cityInfo data  ***************** //

const createCityLayer = (geoJson, cityInfoArray) => {

    let arrayCount = 0;
    
    cityLayer = new L.geoJson(geoJson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: cityIcon});
        },
        onEachFeature: function (feature, layer) {
            let popupContent = [];
            let cityArray = [];
            let addAttractionsArray = [];
      
            for (let key in feature.properties) {
                if(key === 'population') {
                    cityArray.push(key + ": " + feature.properties[key]);
                } else if (key === 'name') {
                    cityArray.unshift(key + ": " + feature.properties[key]);
                }  
            }

            let count = 0;
            let summary;
            let link;
            console.log(cityInfoArray);
            for (let key in cityInfoArray[arrayCount]) {
                if(cityInfoArray[arrayCount][key] === undefined) {
                    continue;
                }
                if(key === 'summary' || key === 'wikipediaUrl') {
                    if(key === 'summary') {
                        console.log(cityInfoArray[arrayCount][key]);
                        summary = cityInfoArray[arrayCount][key].slice(0, -5);
                        count++;
                    }
                    if(key === 'wikipediaUrl') {
                        link = 'https://' + cityInfoArray[arrayCount][key];
                        count++;
                    }
                    if(count === 2) {
                        addAttractionsArray.push("Summary: " + summary + "<a href=" + link + " target='_blank'>(...)</a>");
                    }
                }
                if(key.includes('landmark')) {
                        addAttractionsArray.push("Landmark: " + cityInfoArray[arrayCount][key]);
                }
            }

            popupContent = cityArray.concat(addAttractionsArray);
  
            popupContent.unshift('<h1>City</h1>');
            layer.bindPopup(popupContent.join("<p>"));

            arrayCount++
        }
    });

    return cityLayer;

}

// **************************************************************************************** //

// ******************** Retrieve the landmarks data and create landmarks geoJson ********** //

const createLandmarksGeoJson = (landmarks, countryCode) => {

    let jsonFeatures = [];
    let lng;
    let lat;

    landmarks.forEach(function(point){

        if(point['businesses'] !== undefined) {

            for(let i = 0; i < point['businesses'].length; i++) {

                if(point['businesses'][i]['location']['country'] === countryCode) {
                    
                    lat = point['businesses'][i]['coordinates']['latitude'];
                    lng = point['businesses'][i]['coordinates']['longitude'];
            
                    let feature = {
                        type: 'Feature',
                        properties: point['businesses'][i],
                        geometry: {
                            type: 'Point',
                            coordinates: [lng,lat]
                        }
                    };
            
                    jsonFeatures.push(feature);

                }
                
            }
        }

    });

    const geoJson = { type: 'FeatureCollection', features: jsonFeatures };
    return geoJson;
        
}

// **************************************************************************************** //

// ********* Star ratings for landmarks popup content  ************************************ //

const starRatings = rating => {
    if (rating === 0) {
        return "";
    } else if(rating === 0.5) {
        return "<i class='fas fa-star-half'></i>";
    } else if(rating === 1) {
        return "<i class='fas fa-star'></i>";
    } else if(rating === 1.5) {
        return "<i class='fas fa-star'></i><i class='fas fa-star-half'></i>";
    } else if(rating === 2) {
        return "<i class='fas fa-star'></i><i class='fas fa-star'></i>";
    } else if(rating === 2.5) {
        return "<i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star-half'></i>";
    } else if(rating === 3) {
        return "<i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i>";
    } else if(rating === 3.5) {
        return "<i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star-half'></i>";
    } else if(rating === 4) {
        return "<i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i>";
    } else if(rating === 4.5) {
        return "<i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star-half'></i>";
    } else if(rating === 5) {
        return "<i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i><i class='fas fa-star'></i>";
    }

}

// **************************************************************************************** //

// ********* Add markers and popup content for the landmarks ****************************** //

const createLandmarkLayer = geoJson => {
    
    landmarkLayer = new L.geoJson(geoJson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: landmarkIcon});
        },
        onEachFeature: function (feature, layer) {
            let popupContent = [];
            popupContent.push(feature.properties['name']);
            popupContent.push("<img class='popupimg' src='" + feature.properties['image_url'] + "'/>");
            popupContent.push("Category: " + feature.properties['categories'][0]['title']);
            const rating = starRatings(feature.properties['rating']);
            popupContent.push("Rating: " + rating);
            popupContent.push("Review Count: " + feature.properties['review_count']);
            popupContent.push("Address: ");
            popupContent.push(feature.properties['location']['display_address'][0]);
            popupContent.push(feature.properties['location']['display_address'][1]);

            popupContent.unshift('<h1>Landmark</h1>');

            layer.bindPopup(popupContent.join("<p>"));

        }
    });

    return landmarkLayer;

}

// **************************************************************************************** //

// ********************** Update sidebar  ************************************************* //

function updateModal(restCountries, currency, forecast, covid) {

    // country details
    $('#flag').attr('src', restCountries['flag']);
    $('#country').html(restCountries['name']);
    $('#nativeName').html(restCountries['nativeName']);
    $('#capital').html(restCountries['capital']);
    $('#nativeLang').html(restCountries['languages'][0]['name']);
    $('#demonym').html(restCountries['demonym']);
    $('#population').html(restCountries['population']);
    $('#region').html(restCountries['region']);
    $('#subregion').html(restCountries['subregion']);

    // currency
    const currencyCode = restCountries['currencies'][0]['code'];

    $('#currency').html(restCountries['currencies'][0]['name']);
    $('#currencyCode').html(restCountries['currencies'][0]['code']);
    $('#currencySymbol').html(restCountries['currencies'][0]['symbol']);
    $('#exchangeRate').html(currency['rates'][currencyCode]);

    // covid
    let covidDate = covid[0]['lastUpdate'];
    let year = covidDate.slice(0, 4);
    let month = covidDate.slice(5, 7);
    let day = covidDate.slice(8, 10);
    let time = covidDate.slice(11, 16);
    let lastUpdate = day + "/" + month + "/" + year + " " + time;

    $('#confirmed').html(covid[0]['confirmed']);
    $('#critical').html(covid[0]['critical']);
    $('#deaths').html(covid[0]['deaths']);
    $('#recovered').html(covid[0]['recovered']);
    $('#lastUpdate').html(lastUpdate);

    // weather forecast 
    const date1 = new Date(forecast['daily'][0]['dt'] * 1000);
    const date2 = new Date(forecast['daily'][1]['dt'] * 1000);
    const date3 = new Date(forecast['daily'][2]['dt'] * 1000);

    const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const day1 = date1.getDay();
    const day2 = date2.getDay();
    const day3 = date3.getDay();

    const icon1 = forecast['daily'][0]['weather'][0]['icon'];  
    const iconSrc1 = "http://openweathermap.org/img/wn/" + icon1 +"@2x.png";

    const icon2 = forecast['daily'][1]['weather'][0]['icon'];  
    const iconSrc2 = "http://openweathermap.org/img/wn/" + icon2 +"@2x.png";

    const icon3 = forecast['daily'][2]['weather'][0]['icon'];  
    const iconSrc3 = "http://openweathermap.org/img/wn/" + icon3 +"@2x.png";

    $('#weatherCapital').html(restCountries['capital']);

    $('#day1').html(week[day1]);
    $('#number1').html(date1.getDate());
    $('#maxTemp1').html(forecast['daily'][0]['temp']['max']);
    $('#minTemp1').html(forecast['daily'][0]['temp']['min']);
    $('#weatherIcon1').attr('src', iconSrc1);
    $('#weatherDesc1').html(forecast['daily'][0]['weather'][0]['description']);

    $('#day2').html(week[day2]);
    $('#number2').html(date2.getDate());
    $('#maxTemp2').html(forecast['daily'][1]['temp']['max']);
    $('#minTemp2').html(forecast['daily'][1]['temp']['min']);
    $('#weatherIcon2').attr('src', iconSrc2);
    $('#weatherDesc2').html(forecast['daily'][1]['weather'][0]['description']);

    $('#day3').html(week[day3]);
    $('#number3').html(date3.getDate());
    $('#maxTemp3').html(forecast['daily'][2]['temp']['max']);
    $('#minTemp3').html(forecast['daily'][2]['temp']['min']);
    $('#weatherIcon3').attr('src', iconSrc3);
    $('#weatherDesc3').html(forecast['daily'][2]['weather'][0]['description']);

}


// **************************************************************************************** //

// ********************** Intialise current location ************************************** //

let countryCoords;

function geoInit() {

    async function success(position) {
        let lat  = await position.coords.latitude;
        let lng =  await position.coords.longitude;

        const result = await getData(lat, lng);

        if(result.type === 'body_of_water') {
            loader();
            return null;
        }

        const countryCode = result['opencage']['results'][0]['components']['ISO_3166-1_alpha-2'];

        // Borders
        const borders = result.borders;
        updatePane(borders, countryCode);

        // Dropdown menu
        const dropdown = result.dropdown;
        createCountryList(dropdown, countryCode);

        // Countries capital coords 
        countryCoords = result.coords;

        // Airports and Weather 
        const airports = result.airports;
        const airportGeoJson =  createAirportGeoJson(airports);

        const weather = result.weather; 
        const weatherArray = createWeatherArray(weather);
        
        const airportLayer = createAirportLayer(airportGeoJson, weatherArray);

        // Cities and city details 
        const cities = result.cities;
        const citiesGeoJson =  createCitiesGeoJson(cities);

        let citiesName = [];
        for (key in citiesGeoJson.features) {
            citiesName.push(citiesGeoJson.features[key].properties.name);
        }
    
        const cityInfo = result.cityInfo;
        const cityInfoArray = createCityInfoArray(cityInfo, countryCode, citiesName);
    
        const cityLayer = createCityLayer(citiesGeoJson, cityInfoArray);

        // Landmarks
        const landmarks = result.landmarks;
        const landmarksGeoJson = createLandmarksGeoJson(landmarks, countryCode);

        const landmarkLayer = createLandmarkLayer(landmarksGeoJson);

        // Add cluster markers
        clusterMarkers(airportLayer, cityLayer, landmarkLayer);

        // Modal Information
        const rest = result.rest;
        const currency = result.currency;
        const covid = result.covid;
        const forecast = result.forecast;

        updateModal(rest, currency, forecast, covid);

        loader();
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

    loader();

    let coord = e.latlng;
    let lat = coord.lat;
    let lng = coord.lng;

    const result = await getData(lat, lng);
    console.log(result);

    if(result.type === 'body_of_water') {
        loader();
        return null;
    }

    const countryCode = result['opencage']['results'][0]['components']['ISO_3166-1_alpha-2'];

    // Borders
    const borders = result.borders;
    updatePane(borders, countryCode);

    // Airports and Weather 
    const airports = result.airports;
    const airportGeoJson =  createAirportGeoJson(airports);

    const weather = result.weather; 
    const weatherArray = createWeatherArray(weather);
    
    const airportLayer = createAirportLayer(airportGeoJson, weatherArray);

    // Cities and Landmarks 
    const cities = result.cities;
    const citiesGeoJson =  createCitiesGeoJson(cities);

    let citiesName = [];
    for (key in citiesGeoJson.features) {
        citiesName.push(citiesGeoJson.features[key].properties.name);
    }

    const cityInfo = result.cityInfo;
    const cityInfoArray = createCityInfoArray(cityInfo, countryCode, citiesName);

    const cityLayer = createCityLayer(citiesGeoJson, cityInfoArray);

    // Landmarks
    const landmarks = result.landmarks;
    const landmarksGeoJson = createLandmarksGeoJson(landmarks, countryCode);

    const landmarkLayer = createLandmarkLayer(landmarksGeoJson);

    // Add cluster markers
    clusterMarkers(airportLayer, cityLayer, landmarkLayer);
    
    // Modal Information
    const rest = result.rest;
    const currency = result.currency;
    const covid = result.covid;
    const forecast = result.forecast;

    updateModal(rest, currency, forecast, covid);

    loader();

});

// **************************************************************************************** //

// *********************** Country select ************************************************* //

$('#countryList').change(async function() {

    loader();

    const alpha = $('#countryList').val();
    let lat;
    let lng;
    
    for(let i = 0; i < countryCoords.length; i++) {
        if(countryCoords[i]['CountryCode'] === alpha) {
            lat = countryCoords[i]['CapitalLatitude'];
            lng = countryCoords[i]['CapitalLongitude'];
            break;
        }
    }

    const result = await getData(lat, lng);

    const countryCode = result['opencage']['results'][0]['components']['ISO_3166-1_alpha-2'];

    // Borders
    const borders = result.borders;
    updatePane(borders, countryCode);

    // Airports and Weather 
    const airports = result.airports;
    const airportGeoJson =  createAirportGeoJson(airports);

    const weather = result.weather; 
    const weatherArray = createWeatherArray(weather);
    
    const airportLayer = createAirportLayer(airportGeoJson, weatherArray);

    // Cities and Landmarks 
    const cities = result.cities;
    const citiesGeoJson =  createCitiesGeoJson(cities);

    let citiesName = [];
    for (key in citiesGeoJson.features) {
        citiesName.push(citiesGeoJson.features[key].properties.name);
    }

    const cityInfo = result.cityInfo;
    const cityInfoArray = createCityInfoArray(cityInfo, countryCode, citiesName);

    const cityLayer = createCityLayer(citiesGeoJson, cityInfoArray);

    // Landmarks
    const landmarks = result.landmarks;
    const landmarksGeoJson = createLandmarksGeoJson(landmarks, countryCode);

    const landmarkLayer = createLandmarkLayer(landmarksGeoJson);

    // Add cluster markers
    clusterMarkers(airportLayer, cityLayer, landmarkLayer);
    
    // Modal Information
    const rest = result.rest;
    const currency = result.currency;
    const covid = result.covid;
    const forecast = result.forecast;

    updateModal(rest, currency, forecast, covid);

    loader();

});

// **************************************************************************************** //