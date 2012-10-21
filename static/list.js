if(Meteor.isClient){

  var muniList = {

    init:function(){
      muniList.stops = MuniStops;
    },
    usePosition:function(position){
      var browserLoc = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
      var stop = muniList.lookupStop([position.coords.longitude, position.coords.latitude])
      console.log("LOClist", position);
      Session.set("stop", stop);
      Session.set("location", [position.coords.longitude, position.coords.latitude]);
    },
    afterRender:function(){

      $("ul.routelist li").on("click", function(ev){
        var route = $(ev.currentTarget).attr("data-route");
        var vehicle = $(ev.currentTarget).attr("data-vehicle");
        Session.set("route", route);
        Session.set("vehicle", vehicle);
        Router.navigate("/map", {trigger: true});

        muniList.routeDetails(route, Session.get("stop").id);
      });

      setSelected("list");
    },
    routeDetails:function(route, stopid){
      var url = "http://nextbusproxy.herokuapp.com/service/publicJSONFeed";
        // ?command=routeConfig&a=sf-muni&r=N&stopid=5197&callback=a
      $.ajax(url, {data:{command:"routeConfig", a:"sf-muni", r:route, stopid:stopid}, dataType:"json", success:function(data){
        data.route.direction1 = data.route.direction[0];
        Session.set("routeDetail", data.route);
        console.log(data);
      }})

    },
    lookupStop:function(coords){

      var current = new google.maps.LatLng(coords[1], coords[0]);
      var inbounds = [];

      var smallest = 10000;
      var closest;
      for(s in muniList.stops){
        var stop = muniList.stops[s];

        var stoploc = new google.maps.LatLng(stop.lat, stop.lng);
        var dist = google.maps.geometry.spherical.computeDistanceBetween(current, stoploc)
        if(dist < smallest){
          smallest = dist;
          closest = stop;
        }
      }
      return closest;
    }

  }

  Template.list.created = function() {

    Session.set("refreshTime", 0);

    var refresh = function() {

      var stop = Session.get("stop");
      if (!stop || !stop.id) {
        console.log("no stop, retry");
        Meteor.setTimeout(refresh, 500);
        return;
      }

      var refreshTime = Session.get("refreshTime");
      if (refreshTime === 0) {
        console.log("refreshing");
        Meteor.call('getPredictions', "1" + stop.id, function(err, res) {
          console.log(err, res);
          if (res.length > 0) {
            Session.set("routes", res);
          } else {
            // XXX:
            console.log("no data returned from API for route predictions!");
            // oops! no data from API
          }
          // XXX: this should be moved into if statement above!
          
          _.forEach(res, function(r){
            r.otherminsstr = r.othermins.join(", ");
          });

          res = _.sortBy(res, function(r){ return r.predictionsAvailable ? parseInt(r.minute1) : 1000 });
          Session.set("routes", res);
        });
        refreshTime = 30;
        Session.set("refreshTime", refreshTime);
      } else {
        Session.set("refreshTime", --refreshTime);
      }
      Meteor.setTimeout(refresh, 1000);
    }
    refresh();
  }
  Template.list.routes = function() {
    return Session.get("routes");
  }
  Template.list.refreshTime = function() {
    return Session.get("refreshTime");
  }
  Template.list.stop = function () {
    return Session.get("stop");
  };
  Template.list.events = {
    "click #secure-clicker": function() {
      if (Meteor.userLoaded()) {
        console.log("clicked!");
      } else {
        console.log("oops, can't do it!");
      }
    }
  }
  Template.list.rendered = muniList.afterRender;
  $(muniList.init);

}
