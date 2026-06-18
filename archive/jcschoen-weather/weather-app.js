function setAPI() {
  var api = document.getElementById('apikey').value;
  console.log(api);
  var today = new Date();
  var expDate = new Date(today.getTime() + 30 * 24 * 3600 * 1000);
  var apiCookie = "secretKey="+api+"; expires="+expDate.toGMTString();+"; path=/";
  console.log(apiCookie);
  document.cookie = apiCookie;
  alert(document.cookie);
}
function weather() {

  var location = document.getElementById("location");
  var apiKey = document.cookie;
  var tempApi = apiKey;
  var tempApi = apiKey.substring((apiKey.indexOf("=")+1),apiKey.length);
  var apiKey = tempApi;
  console.log(apiKey + ", " + tempApi);
  var url = 'https://api.forecast.io/forecast/';

  navigator.geolocation.getCurrentPosition(success, error);

  function success(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;

    location.innerHTML = 'Latitude is ' + latitude + '° Longitude is ' + longitude + '°';

    $.getJSON(url + apiKey + "/" + latitude + "," + longitude + "?callback=?", function(data) {
      $('#temp').html(data.currently.temperature + '° F');
      $('#minutely').html(data.minutely.summary);
    });
  }

  function error() {
    location.innerHTML = "Unable to retrieve your location";
  }

  location.innerHTML = "Locating...";
}
