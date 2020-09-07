window.Maps = ( function(){
  var _init = false;
  var app = {};
  app.marker = [];
  var mapContainer = false;
  var mapVisible = false;
  var settings = {
    mapContainerSelector: '.js-map',
    mapDefaultZoom: 13,
    mapDefaultCenter: [60.394517, 5.3429066],
    markerWindowVariableName: 'MapsMarkerData',
    markerImagePath: '/typo3conf/ext/t3xp_sitepackage/Resources/Public/1_General/Assets/Images/marker-default.png',
    markerIconSize: [32, 32],
    markerIconAnchor: [16, 32],
    markerFitBounds: true,
    provider: false,
    providerConfiguration: {},
    lazyLoadMap: false,
    showInfoWindow: false,
    markerHasOnClick: false,
    hideMapIfNoMarkerAvailable: false,
    hideMapClass: 'd-none',
    markerInfoWindowBodyFilter: false,
    markerOnClickCallback: false,
  };

  app.init = function( options ) {
    if(_init){return;}
    _init = true;
    // extend settings by options
    settings = Object.assign(settings, options);

    mapContainer = $$( settings.mapContainerSelector );
    if( mapContainer.length > 0 ) {

      if( typeof window[settings.markerWindowVariableName] === 'undefined' ) {
        console.error('Maps: window.'+settings.markerWindowVariableName+' does not exist. No marker data found. Exiting.')
        return;
      }

      if( settings.provider === false || typeof settings.provider === 'undefined' ) {
        console.error('Maps: You must define a valid maps provider via settings.provider. Exiting.');
        return;
      }

      app.marker = window[settings.markerWindowVariableName];
      if( app.marker.length > 0 ) {
        settings.provider.init( settings.providerConfiguration );
        if( settings.lazyLoadMap === false ) {
          // automatically trigger further initialization
          // if we have no external libraries to load
          // otherwise wait for provider to call
          // remoteLibrariesHaveLoaded()
          if( !settings.provider.hasRemoteLibraryToLoad() ) {
            app.remoteLibrariesHaveLoaded();
          }
        }
      }
      else if( settings.hideMapIfNoMarkerAvailable ){
        addClass( mapContainer, settings.hideMapClass );
      }
    }
  };

  app.remoteLibrariesHaveLoaded = function(){
    settings.provider.initMap( mapContainer[0], settings );
    settings.provider.setMarker( app.marker, settings );
    mapVisible = true;
  };

  app.isMapVisible = function() {
    return mapVisible;
  }

  var $$ = function( selector ) {
    return document.querySelectorAll( selector );
  };

  var addClass = function( elements, className ) {
    if( elements instanceof Node ) {
      elements.classList.add( className );
    }
    else {
      for( var i = 0, len = elements.length; i < len; i++) {
        elements[i].classList.add( className );
      }
    }
  };

  var removeClass = function( elements, className ) {
    if( elements instanceof Node ) {
      elements.classList.remove( className );
    }
    else {
      for( var i = 0, len = elements.length; i < len; i++) {
        elements[i].classList.remove( className );
      }
    }
  };

  return app;
})();