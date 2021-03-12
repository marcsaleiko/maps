function MapLocation(arg) {
  this.id = arg.id || '';
  this.latitude = arg.latitude || 0.0;
  this.longitude = arg.longitude || 0.0;
  this.iconUrl = arg.iconUrl || '';
  this.infowindow = arg.infowindow || 0.0;
  this.polyline = arg.polyline || [];
  this.polylineColor = arg.polylineColor || '';
  this.polylineHoverColor = arg.polylineHoverColor || '';
  this.supportPolylineColor = arg.supportPolylineColor || '';
  this.references = {
    marker: null,
    polyline: null,
    supportPolyline: null
  };
  this.flags = {
    applyDefaultPolylineColorOnHoverOut: true,
  };
};

window.Maps = ( function(){
  var _init = false;
  var app = {};
  app.marker = [];
  app.mapLocations = [];
  var mapContainer = false;
  var mapVisible = false;
  var active = false;
  var settings = {
    mapContainerSelector: '.js-map',
    mapDefaultZoom: 13,
    mapDefaultCenter: [60.394517, 5.3429066],
    mapUseFirstMarkerAsCenter: false,
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
    /**
     * Callback filter that takes "mapLocation" and "data" as argument and expects to return
     * the transformed mapLocation object
     */
    beforeMapLocationFilter: false,
    polylineWeight: 8,
    polylineColor: '#ff8030',
    drawSupportPolyline: true,
    supportPolylineWeight: 12,
    supportPolylineColor: '#ffffff',
    /**
     * Callback filter that has "polyline" as argument and expects a transformed
     * array that can be used to init a polyline in the provider as return value
     */
    beforePolylineRenderFilter: false,
    polylineHasOnLick: false,
    polylineHasOnMouseover: false,
    zoomToPolylineOnClick: false,
    polylineOnClickCallback: false,
    polylineFitBounds: true,
    afterShowCallback: false,
  };

  app.init = function( options ) {
    if(_init && active){return;}
    _init = true;

    // extend settings by options
    settings = Object.assign(settings, options);

    mapContainer = $$( settings.mapContainerSelector );
    if( mapContainer.length > 0 ) {

      // allow override of data- attributes
      settings = Object.assign(settings, getDataAttributes(mapContainer[0]));

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

        app.mapLocations = getMapLocations(app.marker);

        active = true;
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
    // @todo make map init function calls DRY
    // @see showMap()
    settings.provider.initMap( mapContainer[0], settings );
    app.mapLocations = settings.provider.setMarker( app.mapLocations, settings );
    app.mapLocations = settings.provider.setPolylines( app.mapLocations, settings );
    
    mapVisible = true;
    if( typeof settings.afterShowCallback === 'function' ) {
      settings.afterShowCallback()
    }
  };

  app.isMapVisible = function() {
    return mapVisible;
  };

  app.isActive = function() {
    return active;
  };

  app.showMap = function() {
    if( active && !mapVisible ) {
      settings.provider.initMap( mapContainer[0], settings );
      app.mapLocations = settings.provider.setMarker( app.mapLocations, settings );
      app.mapLocations = settings.provider.setPolylines( app.mapLocations, settings );

      mapVisible = true;
      if( typeof settings.afterShowCallback === 'function' ) {
        settings.afterShowCallback()
      }
    }
  };

  /**
   * Provide a source of visible Ids and hide all other map markers
   * accordingly
   * @param  {array} visibleIds set of Ids that should stay visible
   */
  app.updateMarkerVisibility = function( visibleIds )
  {
    if( active && mapVisible ) {
      // check whether a marker id (.content) is in the set of
      // visibleUIds and set them to visible
      for( var i = 0; i < app.marker.length; i++ )
      {
        if( visibleIds.indexOf( app.marker[i].id ) >= 0 ) {
          // should be visible
          settings.provider.showMarker(i, app.marker[i].id, settings);
        }
        else {
          // should be hidden
          settings.provider.hideMarker(i, app.marker[i].id, settings);
        }
      }
    }
  };


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

  var getDataAttributes = function(el) {
    var data = {};
    [].forEach.call(el.attributes, function(attr) {
      if (/^data-/.test(attr.name)) {
        var camelCaseName = attr.name.substr(5).replace(/-(.)/g, function ($0, $1) {
          return $1.toUpperCase();
        });
        if( attr.value === 'false' ) {
          data[camelCaseName] = false;
        } else if( attr.value === 'true' ) {
          data[camelCaseName] = true;
        } else {
          data[camelCaseName] = attr.value;
        }
      }
    });
    return data;
  };

  var getMapLocations = function( marker ) {
    var mapLocations = [];
    var hasBeforeMapLocationFilter = typeof settings.beforeMapLocationFilter === 'function';
    marker.forEach(function(item){
      var thisMapLocation = new MapLocation(item);
      if( hasBeforeMapLocationFilter ) {
        thisMapLocation = settings.beforeMapLocationFilter( thisMapLocation, item);
      }
      mapLocations.push( thisMapLocation );
    });
    return mapLocations;
  };

  return app;
})();