if(Meteor.isClient) {

  var vecMarker = null;
  var userMarker = null;

  function watchVehicle() {
    var vehicle = Vehicles.findOne();

    if (!vehicle || !muniMap.userMarker) {
      Meteor.setTimeout(watchVehicle, 500);
      return;
    }
    console.log("vm", vecMarker);
    if (vecMarker === null) {
      console.log("a")
      vecMarker = new google.maps.Marker( {
        map: muniMap.map,
        position: new google.maps.LatLng(vehicle.lat, vehicle.lon),
        title: "Vehicle"
      });
    } else {
      // without this, marker does not get re-drawn on map
      vecMarker.setMap(muniMap.map);
      vecMarker.position = new google.maps.LatLng(vehicle.lat, vehicle.lon);
    }

    var bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(vehicle.lat, vehicle.lon));
    bounds.extend(new google.maps.LatLng(muniMap.userMarker.position.lat(), muniMap.userMarker.position.lng()));

    muniMap.map.fitBounds(bounds);
    Meteor.setTimeout(watchVehicle, 5000);
  }

  var muniMap = {
    firstRun:true,
    init:function(){
      //console.log($("#map").html()!=="")

      $(".routeinfo .back").on("click", function(){
        Router.navigate("/", {trigger: true});
      });
      $(".startcheckin").on("click", function(){

        var rd = Session.get("routeDetail");
        var color = rd.color.toString();
        while(color.length < 6){
          color = "0"+color;
        }
        var r = parseInt(color[0]+color[1], 16);
        var g = parseInt(color[2]+color[3], 16);
        var b = parseInt(color[4]+color[5], 16);
        
        $(".checkin").css("background", "rgba("+[r,g,b].join(",")+", 0.9)");
        $(".checkin").show();
      });

      setSelected("map");

      if($("#map").html()!=="")
        return;

      console.log("INIT!");
      var location = new google.maps.LatLng(37.765, -122.443);
      console.log("sess loc", Session.get("location"))
      if(Session.get("location"))
        location = new google.maps.LatLng(Session.get("location")[1], Session.get("location")[0]);

      var myOptions = {
        center: location,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI:true
      };
      muniMap.stops = MuniStops;
      console.log($("#map"));
      console.log("loC", location);
      muniMap.map = new google.maps.Map($("#map")[0], myOptions);
      muniMap.userMarker = new google.maps.Marker({
        position: location,
        title: "You",
        map:muniMap.map
      });

      muniMap.firstRun = false;
    },
    usePosition:function(position){
      if(muniMap.map){
        var browserLoc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        //muniMap.map.panTo(browserLoc);

        muniMap.userMarker.setPosition(browserLoc);
        userMarker = muniMap.userMarker;
        console.log("userMarker=");
        console.log(userMarker);
      }
    },
    afterRender:function(){


    }

  }

  Template.map.stop = function () {
    return Session.get("stop");
  };
  Template.map.route = function () {
    if(!Session.get("route"))
      return "N/A";
    return Session.get("route");
  };

  Template.map.routeDetails = function () {
    return Session.get("routeDetails");
  };

  Template.map.times = function () {
    routes =Session.get("routes");
    var route = _.find(Session.get("routes"), function(r){ return r.routeTag  == Session.get("route"); });
    times = [];
    if(!route)
      return "";
    _.forEach(route.minutes, function(r){
      times.push(r.value);
    });

    return times.join(", ");
  };



  Template.map.rendered = muniMap.init;
  Template.map.created = watchVehicle;

  $(function(){
    if(navigator.geolocation) {
      var wpid = navigator.geolocation.watchPosition(function(position){
        muniMap.usePosition(position);
        muniList.usePosition(position);
      }, function(e){
        console.log("error", e);
      }, {enableHighAccuracy:true, maximumAge:30000, timeout:27000});

    }
  });
}
