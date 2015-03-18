angular.module('summary', ['common'])
  .run(['$filter','$q','$rootScope','Nav','Position','Profile','Item','supersonic'
      ,'User', function($filter,$q,$rootScope,Nav,Position,Profile,Item,supersonic,User) {
    angular.extend($rootScope, {
      qGeoPoint: $q.defer(),
      qItems: $q.defer()
    });

    // Nav.initPreloadView("details");
    Nav.initPreloadView("modal");

    supersonic.device.ready.then( function() {
      console.log("ready for summary");
      // Nav.startView("details");
    });
  }])
  .controller('SummaryCtrl', ['$filter','$firebase','$q','$rootScope','$scope'
                          ,'FB','Host','Nav','Position','Profile','Item','supersonic'
                          ,'User','UserData','$mdSidenav','$mdMedia','$templateCache',function($filter,$firebase,$q,$rootScope
                          ,$scope,FB,Host,Nav,Position,Profile,Item,supersonic,User
                          ,UserData,$mdSidenav,$mdMedia,$templateCache) {
    var buttons = new Array(2);
    var geoInitialized = false;
    var thisView = Nav.parseViewName(steroids.view.location);
    var x = false;

    angular.extend($scope, {
      distances: null,
      employerImgFilepath: "",
      flashMsg: [],
      imgFilepathItem: Host.buildFilepath('items','base'),
      items: null,
      subViews: Nav._getSubViews(),
      userInfo: null
      // openBottomSheet: function() {
      //   var options = {
      //     // scope: $scope,
      //     controller: "btmSheetCtrl",
      //     disableParentScroll: true,
      //     // template: $templateCache.get("menu.html")
      //     templateUrl: "menu.html"
      //   };

      //   $mdBottomSheet.show(options).then(function() {
      //     console.log('show was successful');
      //   }, function(y) {
      //     console.log('show went wrong');
      //   });
      // },
    });
    
    buttons[0] = Nav.initButtons('create', "add.png", "left", 0, Nav.setupButton);
    buttons[0].navBtn.onTap = function() {
      Nav.enterView("modal", Nav.modalOnTapOptions("create"));
    }

    buttons[1] = Nav.initButtons('exit', "exit.png", "right", 1, Nav.setupButton);
    buttons[1].navBtn.onTap = function() {
      // Nav.logout();
      // $scope.toggleSideMenu();
      $mdSidenav('right').toggle().then(function(){
        // $log.debug("toggle RIGHT is done");
        console.log("side nav closed");
      });

      $scope.$apply();
    }

    Nav.setButtons(buttons);

    var options = { enableHighAccuracy: true };
    var unwatch = supersonic.device.geolocation.watchPosition(options).onValue(function(position) {
      var coords = position.coords;
      var sender = Nav.parseViewName(steroids.view.location);      
      var newGeoPoint = {
        lat: coords.latitude,
        long: coords.longitude,
        latitude: coords.latitude,
        longitude: coords.longitude
      };

      Position._setGeoPoint($rootScope.currentGeoPoint = newGeoPoint);
    });

    unwatch();

    $rootScope.qUserInfo.promise.then(function(userInfo) {
      $scope.userInfo = userInfo;
      var items = Item._getItems();

      /********** G E T  I T E M S ************
      *********************************************************
      ********************************************************/
      if ( angular.isDefined(items) )
        $rootScope.qItems.resolve(items);
      else {
        Item.retrieveItems().then(function(fbItems) {
          $scope.items = fbItems;
          $rootScope.qItems.resolve(fbItems);
        });
      }
      /********************************************************
      *********************************************************
      ********************************************************/

      Nav.startView("modal");
    });

    $scope.openDetails = function(item) {
      var options = Nav.buildOnTapOptions("detailsData","pillar",supersonic.ui.layers.push,{
        itemId: item.$id,
        geoPoint: Position.getGeoPoint()
      });

      Nav.enterView("details", options);
    }

    steroids.view.navigationBar.show({
      title: "Items"
    });

    steroids.view.navigationBar.update({
      styleClass: "super-navbar",
      overrideBackButton: true,
      buttons: {
        left: _.pluck(_.where(buttons, {side: "left"}), "navBtn"),
        right: _.pluck(_.where(buttons, {side: "right"}), "navBtn")
      }
    });

    supersonic.device.network.whenOffline( function() {
      console.log("Device is offline!");
    });

    supersonic.device.network.whenOnline( function() {
      console.log("Device is ONLINE!");
    });
  }])