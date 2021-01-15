window.GoogleMapsMapProvider = (function () {
  var _init = false;
  var app = {};
  var map = false;
  var mapMarker = [];
  var hasRemoteLibraryToLoad = true;
  var remoteLibraryLoaded = false;
  var infowindow = false;
  var settings = {
    libraryUrl: 'https://maps.google.com/maps/api/js?key=',
    key: '',
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    disableDefaultUI: false,
  };

  app.init = function( options ) {
    if( _init ) {return; }
    _init = true;
    settings = Object.assign(settings, options);
    if( typeof window['GoogleMapsMapProviderKey'] !== 'undefined' ) {
      settings.key = window['GoogleMapsMapProviderKey'];
    }

    loadMapsRemoteLibrary();
  };

  app.hasRemoteLibraryToLoad = function(){
    return hasRemoteLibraryToLoad;
  };

  app.initMap = function( mapElement, mapSettings ) {

    // map standard settings
    mapSettings = {
      zoom: mapSettings.mapDefaultZoom,
      center: new google.maps.LatLng(mapSettings.mapDefaultCenter[0], mapSettings.mapDefaultCenter[0]),
      scrollwheel: false,
      draggable: !("ontouchend" in document),
      mapTypeControl: settings.mapTypeControl,
      streetViewControl: settings.streetViewControl,
      fullscreenControl: settings.fullscreenControl,
      disableDefaultUI: settings.disableDefaultUI,
    };

    map = new google.maps.Map( mapElement, mapSettings );
    // @todo add map styles

  };

  app.setMarker = function( marker, mapSettings ) {

    var defaultMarkerImage = new google.maps.MarkerImage(
      mapSettings.markerImagePath,
      new google.maps.Size(mapSettings.markerIconSize[0], mapSettings.markerIconSize[1]),
      new google.maps.Point(0,0),
      new google.maps.Point(mapSettings.markerIconAnchor[0], mapSettings.markerIconAnchor[1])
    );

    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < marker.length; i++)
    {
      var myLatLng = new google.maps.LatLng( marker[i].latitude, marker[i].longitude );
      mapMarker[i] = new google.maps.Marker({
        position: myLatLng,
        map: map,
        icon: defaultMarkerImage,
        animation: google.maps.Animation.DROP,
        // like markerData in leaflet map provider
        content: marker[i]
        // html: marker[i].infowindow
      });
      bounds.extend( myLatLng );

      infowindow = new google.maps.InfoWindow( {content: 'wird gelden...'} );

      if( mapSettings.markerHasOnClick || mapSettings.showInfoWindow ) {
        google.maps.event.addListener( mapMarker[i], 'click', function ()
        {
          if( mapSettings.markerHasOnClick ) {
            if( typeof mapSettings.markerOnClickCallback === 'function' ) {
              mapSettings.markerOnClickCallback( this );
            }
          }
          if( mapSettings.showInfoWindow ) {
            var infoWindowBody = '';
            if( typeof this.content.infowindow !== 'undefined' && this.content.infowindow !== '' ) {
              infoWindowBody = this.content.infowindow;
            }
            if( typeof mapSettings.markerInfoWindowBodyFilter === 'function' ) {
              infoWindowBody = mapSettings.markerInfoWindowBodyFilter( this, infoWindowBody );
            }
            if( infoWindowBody !== '' ) {
              // infowindow = new google.maps.InfoWindow( {content: this.content.infowindow} );
              infowindow.setContent( this.content.infowindow );
              infowindow.open( map, this );
            }
          }
        });
      }
    }

    if( mapSettings.mapUseFirstMarkerAsCenter === true ) {
      map.panTo(new google.maps.LatLng( marker[0].latitude, marker[0].longitude ));
    }
    if( mapSettings.markerFitBounds === true ) {
      map.fitBounds( bounds );
    }

  };

  app.showMarker = function(markerIndex, markerId) {
    // @todo Add show marker functionality
  };

  app.hideMarker = function(markerIndex, markerId) {
    // @todo Add hide marker functionality
  };

  var loadMapsRemoteLibrary = function() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = function( e ){
      remoteLibraryLoaded = true;
      // go back to maps controller module and trigger
      // further loading
      Maps.remoteLibrariesHaveLoaded();
    };
    script.src = settings.libraryUrl+settings.key;
    document.getElementsByTagName('head')[0].appendChild( script );
  };

  return app;
})();