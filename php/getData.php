<?php

    $executionStartTime = microtime(true) / 1000;
    
    $url = 'https://api.opencagedata.com/geocode/v1/json?q=' . $_REQUEST['lat'] .'+' . $_REQUEST['lng'] . '&key=6f61d5f529294626a86159dd70c53f93';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL,$url);

    $result=curl_exec($ch);

    curl_close($ch);

    // open cage 
    $opencage = json_decode($result,true);	

    // countryName and alpha created
    $countryName = $opencage['results'][0]['components']['country'];
    $alpha = $opencage['results'][0]['components']['ISO_3166-1_alpha-2'];

    // borders
    $result = file_get_contents(__DIR__ . '/../data/countryBorders.geo.json');

    $borders = json_decode($result,true);

    // initialise
    $init = $_POST['init'];

    if($init === 'true') {
        // dropdown menu	
        $countries = $borders['features'];

        $dropdown = [];

        foreach($countries as $country) {
            $dropdown[] = (object) ["name" => $country['properties']['name'], "iso" => $country['properties']['iso_a2']];
        }

        function cmp($a, $b) {
            return strcmp($a->name, $b->name);
        }
        
        usort($dropdown, "cmp");

        $output['dropdown'] = $dropdown;
        
        // lat and lng coords for selected dropdown country
        $result = file_get_contents(__DIR__ . '/../data/countryCoords.json');

        $coords = json_decode($result,true);
    
    }

    // airports 
    $result = file_get_contents(__DIR__ . '/../data/airports.json');

    $airportsAll = json_decode($result,true);

    $airports = [];
    $latArray = [];
    $lngArray = [];

    foreach ($airportsAll as $country) {
        $lat = $country['lat'];
        $lng = $country['lon'];

        if($country['country'] === $countryName && $country['type'] === 'Airports' && $country['direct_flights'] > 50) {
            $airports[] = $country;
            $latArray[] = $lat;
            $lngArray[] = $lng;
        }
    }

    // weather
    $weatherurls = [];
    for($i = 0; $i < count($latArray); ++$i) {
        $weatherurl = 'http://api.openweathermap.org/data/2.5/weather?units=metric&lat=' . $latArray[$i] .'&lon=' . $lngArray[$i] .'&appid=63df060eaace2012a0cb1f7cc925ad64';

        $weatherurls[] = $weatherurl;
    }

    $urlCount = count($weatherurls);

    $curlArr = array();
    $master = curl_multi_init();

    for($i = 0; $i < $urlCount; $i++)
    {
        $url = $weatherurls[$i];
        $curlArr[$i] = curl_init($url);
        curl_setopt($curlArr[$i], CURLOPT_RETURNTRANSFER, true);
        curl_multi_add_handle($master, $curlArr[$i]);
    }

    do {
        curl_multi_exec($master, $running);
        curl_multi_select($master);
    } while ($running > 0);

    for($i = 0; $i < $urlCount; $i++)
    {
        $weatherResults[] = curl_multi_getcontent  ( $curlArr[$i]  );
    }
    
    $weather = [];
    for($i = 0; $i < $urlCount; $i++) {
        ${"variable$i"} = json_decode($weatherResults[$i], true);
        $weather[] = ${"variable$i"};
    }    

    // cities 
    $url = 'http://api.geonames.org/searchJSON?country=' . $alpha . '&maxRows=15&username=mushetf';
    
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

    curl_close($ch);

    $cities = json_decode($result,true);

    $citiesArray = [];

    foreach ($cities['geonames'] as $city) {
        if($city['fcodeName'] === 'capital of a political entity' || $city['fcodeName'] === 'seat of a first-order administrative division' || $city['fcodeName'] === 'seat of a second-order administrative division') {
            $citiesArray[] = $city;
        }
    }

    // tourism
    $tourismUrls = [];
    for($i = 0; $i < count($citiesArray); $i++) {
        $tourismUrl = 'http://api.geonames.org/wikipediaSearchJSON?formatted=true&q=' . $citiesArray[$i]['name'] . '&maxRows=20&username=mushetf&style=full';
        $tourismUrls[] = $tourismUrl;
    }

    $urlCount = count($tourismUrls);

    $curlArr = array();
    $master = curl_multi_init();

    for($i = 0; $i < $urlCount; $i++)
    {
        $url = $tourismUrls[$i];
        $curlArr[$i] = curl_init($url);
        curl_setopt($curlArr[$i], CURLOPT_RETURNTRANSFER, true);
        curl_multi_add_handle($master, $curlArr[$i]);
    }

    do {
        curl_multi_exec($master, $running);
        curl_multi_select($master);
    } while ($running > 0);

    for($i = 0; $i < $urlCount; $i++)
    {
        $tourismResults[] = curl_multi_getcontent  ( $curlArr[$i]  );
    }
    
    $tourism = [];
    for($i = 0; $i < $urlCount; $i++) {
        ${"variable$i"} = json_decode($tourismResults[$i], true);
        $tourism[] = ${"variable$i"};
    }    

    // restCountries 
    $url = 'https://restcountries.eu/rest/v2/alpha/' . $alpha;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

    $rest = json_decode($result,true);	
    
    // currency 
    $url = 'https://openexchangerates.org/api/latest.json?app_id=7b5e497f3d8c47d1bbe8176d285eb2df';

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

	$currency = json_decode($result,true);

    // output
	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
    $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
    $output['opencage'] = $opencage; 
    $output['borders'] = $borders;
    if($init === 'true') {
        $output['dropdown'] = $dropdown;
        $output['coords'] = $coords;
    }
    $output['airports'] = $airports;
    $output['weather'] = $weather;
    $output['cities'] = $citiesArray;
    $output['tourism'] = $tourism;
    $output['rest'] = $rest;
    $output['currency'] = $currency;
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>