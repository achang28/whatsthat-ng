angular.module('summary', ['common'])
  .run(['$filter','$q','$rootScope','Nav','Position','Profile','Item','supersonic'
      ,'User', function($filter,$q,$rootScope,Nav,Position,Profile,Item,supersonic,User) {
    angular.extend($rootScope, {
      qGeoPoint: $q.defer(),
      qItems: $q.defer()
    });

    Nav.initPreloadView("details");
    Nav.initPreloadView("modal");

    supersonic.device.ready.then( function() {
      console.log("ready for summary");
      Nav.startView("details");
      Nav.startView("modal");
    });
  }])
  .controller('SummaryCtrl', ['$filter','$firebase','$q','$rootScope','$scope'
                          ,'FB','Host','Nav','Position','Profile','Item','supersonic'
                          ,'User','UserData',function($filter,$firebase,$q,$rootScope
                          ,$scope,FB,Host,Nav,Position,Profile,Item,supersonic,User
                          ,UserData) {
    var buttons = new Array(2);
    var geoInitialized = false;
    var thisView = Nav.parseViewName(steroids.view.location);

    angular.extend($scope, {
      distances: null,
      employerImgFilepath: "",
      flashMsg: [],
      imgFilepathItem: Host.buildFilepath('items','avatar'),
      items: null,
      subViews: Nav._getSubViews(),
      userInfo: null
    });
    
    buttons[0] = Nav.initButtons('create', "add.png", "right", 0, Nav.setupButton);
    buttons[0].navBtn.onTap = function() {
      Nav.enterView("modal", Nav.modalOnTapOptions("create"));
    }

    buttons[1] = Nav.initButtons('profile', "user.png", "right", 1, Nav.setupButton);
    buttons[1].navBtn.onTap = function() {
      Nav.enterView("modal", Nav.modalOnTapOptions("profile"));
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

      $rootScope.qItems.promise.then(function(items) {
        var distanceDiff = 1000 * Position.calcDistance($rootScope.currentGeoPoint, newGeoPoint);  
        
        if (distanceDiff > 1) {
          Position._setGeoPoint($rootScope.currentGeoPoint = newGeoPoint);
          var locationParams = {
            sender: sender,
            content: { geoPoint: newGeoPoint }
          };

          supersonic.data.channel("locationData").publish(locationParams);
          Position.prepForDistances(items, newGeoPoint).then(function(resp) {
            $scope.distances = resp.rows[0].elements;
          }, function(errMessage) {
            console.log(errMessage);
          });
        }
      });
    });

    $scope.$watch("items.length", function(newLength, oldCnt) {
      if (newLength > 0) {
        var currentGeoPoint = Position.getGeoPoint();

        Position.prepForDistances($scope.items, currentGeoPoint).then(function(resp) {
          $scope.distances = resp.rows[0].elements;
        }, function(errMessage) {
          console.log(errMessage);
        });
      }
    });

    $rootScope.qUserInfo.promise.then(function(userInfo) {
      $scope.userInfo = userInfo;
      var items = Item._getItems();


      // get items
      if ( angular.isDefined(items) )
        $rootScope.qItems.resolve(items);
      else {
        Item.retrieveItems().then(function(fbItems) {
          $scope.items = fbItems;
          $rootScope.qItems.resolve(fbItems);
        });
      }
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
  }])