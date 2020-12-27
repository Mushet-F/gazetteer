<?php

    $executionStartTime = microtime(true) / 1000;
    
    // open cage 
    $url = 'https://api.opencagedata.com/geocode/v1/json?q=' . $_REQUEST['lat'] .'+' . $_REQUEST['lng'] . '&key=6f61d5f529294626a86159dd70c53f93';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL,$url);

    $result=curl_exec($ch);

    curl_close($ch);

    $opencage = json_decode($result,true);	

    $type = $opencage['results'][0]['components']['_type'];

    if($type === 'body_of_water') {

        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['opencage'] = $opencage; 
        $output['type'] = $type;

        header('Content-Type: application/json; charset=UTF-8');

        echo json_encode($output); 

    } else {

        // countryName and alpha created
        $countryName = $opencage['results'][0]['components']['country'];
        $alpha = $opencage['results'][0]['components']['ISO_3166-1_alpha-2'];

        // borders
        $result = file_get_contents(__DIR__ . '/../data/countryBorders.geo.json');

        $borders = json_decode($result,true);

        // dropdown menu
        function createDropdown($borders) {

            $countries = $borders['features'];

            $dropdown = [];

            foreach($countries as $country) {
                $dropdown[] = (object) ["name" => $country['properties']['name'], "iso" => $country['properties']['iso_a2']];
            }

            function cmp($a, $b) {
                return strcmp($a->name, $b->name);
            }
            
            usort($dropdown, "cmp");

            return $dropdown;

        }

        // dropdown only created once
        $init = $_POST['init'];

        if($init === 'true') {
            $dropdown = createDropdown($borders);
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

        // cityInfo
        $cityInfoUrls = [];
        for($i = 0; $i < count($citiesArray); $i++) {
            $cityInfoUrl = 'http://api.geonames.org/wikipediaSearchJSON?formatted=true&q=' . $citiesArray[$i]['name'] . '&maxRows=20&username=mushetf&style=full';
            $cityInfoUrls[] = $cityInfoUrl;
        }

        $urlCount = count($cityInfoUrls);

        $curlArr = array();
        $master = curl_multi_init();

        for($i = 0; $i < $urlCount; $i++)
        {
            $url = $cityInfoUrls[$i];
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
            $cityInfoResults[] = curl_multi_getcontent  ( $curlArr[$i]  );
        }
        
        $cityInfo = [];
        for($i = 0; $i < $urlCount; $i++) {
            ${"variable$i"} = json_decode($cityInfoResults[$i], true);
            $cityInfo[] = ${"variable$i"};
        }   
        
        // landmarks
        $landmarksCoordsArray = [];
        
        for($i = 0; $i < count($citiesArray); $i++) {

            $landmarksCoordsArray[] = (object) [
                "lat" => $citiesArray[$i]['lat'],
                "lng" => $citiesArray[$i]['lng']
            ];

        }

        $landmarksUrls = [];

        for($i = 0; $i < count($landmarksCoordsArray); $i++) {
            $landmarksCoords = [];
            foreach($landmarksCoordsArray[$i] as $coord) {
                $landmarksCoords[] = $coord;
            }
            $landmarkUrl = 'https://api.yelp.com/v3/businesses/search?latitude=' . $landmarksCoords[0] . '&longitude=' . $landmarksCoords[1] . '&limit=3&sort_by=review_count&categories=landmarks,museums,theater,stadiumsarenas';
            $landmarksUrls[] = $landmarkUrl;
        }

        $landmarksUrls1 = array_slice($landmarksUrls, 0, 4);  
        $landmarksUrls2 = array_slice($landmarksUrls, 4);  
        
        $landmarks = [];

        // two request to yelp to avoid request per second max limit
        function yelpApi($yelpUrls) {
            $postData = "grant_type=client_credentials&".
            "client_id=NuJ4aLs-WsWbFw9AfLSISQ".
            "client_secret=Z2EWA72rUsdK6FkK9ImqmZ5gTgEoI0HxRuBZiNtPpUaoGQUGDsO_2doUmnhpFQ2-ekjRqyPVV2PdR-AhJxQgHMpgsmVYOV9pBhEIgDbhLYCcrXUOKT_HvBJ-axNyX3Yx";

            $curlArr = array();
            $master = curl_multi_init();

            for($i = 0; $i < count($yelpUrls); $i++)
            {
                $url = $yelpUrls[$i];
                $curlArr[$i] = curl_init($url);
                curl_setopt($curlArr[$i],CURLOPT_URL, "https://api.yelp.com/oauth2/token");
                curl_setopt($curlArr[$i],CURLOPT_POST, TRUE);
                curl_setopt($curlArr[$i],CURLOPT_POSTFIELDS, $postData);
                curl_setopt($curlArr[$i], CURLOPT_RETURNTRANSFER, true);

                curl_setopt_array($curlArr[$i], array(
                    CURLOPT_URL => $url,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_ENCODING => "",
                    CURLOPT_MAXREDIRS => 10,
                    CURLOPT_TIMEOUT => 30,
                    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                    CURLOPT_CUSTOMREQUEST => "GET",
                    CURLOPT_HTTPHEADER => array(
                        "Authorization: Bearer Z2EWA72rUsdK6FkK9ImqmZ5gTgEoI0HxRuBZiNtPpUaoGQUGDsO_2doUmnhpFQ2-ekjRqyPVV2PdR-AhJxQgHMpgsmVYOV9pBhEIgDbhLYCcrXUOKT_HvBJ-axNyX3Yx"
                    ),
                ));

                curl_multi_add_handle($master, $curlArr[$i]);

            }

            do {
                curl_multi_exec($master, $running);
                curl_multi_select($master);
            } while ($running > 0);

            for($i = 0; $i < count($yelpUrls); $i++)
            {
                $landmarksResults[] = curl_multi_getcontent  ( $curlArr[$i]  );
            }
            
            for($i = 0; $i < count($yelpUrls); $i++) {
                ${"variable$i"} = json_decode($landmarksResults[$i], true);
                $landmarks[] = ${"variable$i"};
            }   
            return $landmarks;
        }

        // first yelp request (1 of 2)
        $landmarks1 = yelpApi($landmarksUrls1);

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
            $weatherurl = 'https://api.openweathermap.org/data/2.5/weather?units=metric&lat=' . $latArray[$i] .'&lon=' . $lngArray[$i] .'&appid=63df060eaace2012a0cb1f7cc925ad64';

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
        $url = 'https://openexchangerates.org/api/latest.json?app_id=67a1ccb4c62f423089214e054949aebc';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL,$url);

        $result=curl_exec($ch);

        curl_close($ch);

        $currency = json_decode($result,true);
        
        // lat and lng coords of country capitals
        $result = file_get_contents(__DIR__ . '/../data/countryCoords.json');

        $coords = json_decode($result,true);
        
        for($i = 0; $i < count($coords); $i++) {
            if($coords[$i]['CountryCode'] === $alpha) {
                $capLat = $coords[$i]['CapitalLatitude'];
                $capLng = $coords[$i]['CapitalLongitude'];
            }
        }

        // 3 day weather forecast of country capital
        $url = 'https://api.openweathermap.org/data/2.5/onecall?lat=' . $capLat . '&lon=' . $capLng . '&units=metric&exclude=current,minutely,hourly,alerts&appid=63df060eaace2012a0cb1f7cc925ad64';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL,$url);

        $result=curl_exec($ch);

        curl_close($ch);

        $forecast = json_decode($result,true);

        // covid 
        $url = 'https://covid19-api.com/country/code?code=' . $alpha . '&format=json';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL,$url);

        $result=curl_exec($ch);

        curl_close($ch);

        $covid = json_decode($result,true);

        // second yelp request (2 of 2)
        $landmarks2 = yelpApi($landmarksUrls2);

        $landmarks = array_merge($landmarks1, $landmarks2);

        // output
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
        $output['opencage'] = $opencage; 
        $output['type'] = $type;
        $output['borders'] = $borders;
        if($init === 'true') {
            $output['dropdown'] = $dropdown;
        }
        $output['airports'] = $airports;
        $output['weather'] = $weather;
        $output['cities'] = $citiesArray;
        $output['cityInfo'] = $cityInfo;
        $output['landmarks'] = $landmarks;
        $output['rest'] = $rest;
        $output['currency'] = $currency;
        $output['coords'] = $coords;
        $output['forecast'] = $forecast;
        $output['covid'] = $covid;
        
        header('Content-Type: application/json; charset=UTF-8');

        echo json_encode($output);
    
    }

?>