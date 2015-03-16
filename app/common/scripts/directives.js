angular.module("Directives", [])
  .directive("author", function() {
    return {
      restrict: "EA",
      scope: {
        authorId: "@model",
        displayPref: "@pref"
      },
      template:
        '<i ng-show="displayPref == \'full name\'">by {{author.firstName}} {{author.lastName}}</i>'
        +'<i ng-show="displayPref == \'userId\'">by {{author.password}}</i>',
      controller: ['$scope','UserData', function($scope,UserData) {
        angular.extend($scope, {
          author: UserData.getUser($scope.authorId)
        });
      }]
    }
  })
  .directive("menu", function() {
    return {
      restrict: "EA",
      scope: true,
      template:
        // '<div class="item"><h1>'
        '<div class="item">' 
        // +'  <button ng-show="nightMode" class="button button-large button-outline button-light" ng-click="toggleMode(false)">'
        // +'    <i class="icon super-ios7-sunny-outline"></i>'
        // +'  </button>'
        // +'  <button ng-hide="nightMode" class="button button-large button-outline button-energized">'
        // +'    <i class="icon energized super-ios7-sunny"></i>'
        // +'  </button>'

        // +'  <button ng-hide="nightMode" class="button button-large button-outline button-light" ng-click="toggleMode(true)">'
        // +'    <i class="icon super-ios7-moon-outline"></i>'
        // +'  </button>'
        // +'  <button ng-show="nightMode" class="button button-large button-outline button-energized">'
        // +'    <i class="icon energized super-ios7-moon"></i>'
        // +'  </button></h1>'
        +'  Hello <b>{{userInfo.firstName}} {{userInfo.lastName}}</b>'
        +'</div>'
        +'<div class="list">'
        +'  <a class="item item-icon-left" href="#" ng-click="goToView(\'summary\')">'
        +'    <i class="icon super-model-s"></i>Requests'
        +'    <span class="badge badge-balanced">25</span>'
        +'  </a>'
        +'  <a class="item item-icon-left" href="#">'
        +'    <i class="icon super-wand"></i>Admin'
        +'  </a>'
        +'  <a class="item item-icon-left" href="#">'
        +'    <i class="icon super-gear-b"></i>Settings'
        +'  </a>'
        +'  <a class="item item-avatar" href="#" ng-click="goToView(\'profile\')">'
        +'    <img ng-src="{{clientImgFilepath}}{{userInfo.filename}}" />Profile'
        +'  </a>'
        +'  <a class="item item-icon-right" href="#">'
        +'    <div ng-click="logout()">'
        +'      <i class="icon super-ios7-locked"></i>Logout'
        +'    </div>'
        +'  </a>'
        +'</div>',
      controller: ['$rootScope', '$scope', 'Host', 'Nav', 'Position', 'Profile'
                ,'supersonic','$mdBottomSheet', function($rootScope,$scope,Host
                , Nav,Position,Profile, supersonic, $mdBottomSheet) {
        var thisView = Nav.parseViewName(steroids.view.location);

        angular.extend($scope, {
          clientImgFilepath: Host.buildFilepath('users', 'avatar'),
          // nightMode: true,
          userInfo: null,
          goToView: function(viewName) {
            var options;

            if (viewName != "summary") {
              options = Nav.buildOnTapOptions("modalData", "modal", supersonic.ui.layers.push, {
                targetSubView: viewName,
                geoPoint: Position.getGeoPoint()
              });
              
              Nav.enterView("modal", options);
            } else {
              options = Nav.buildOnTapOptions("summaryData", "root", supersonic.ui.layers.popAll, {
                targetSubView: viewName,
                geoPoint: Position.getGeoPoint()
              });  

              Nav.enterView("summary", options);
            }
            
            $mdBottomSheet.hide();
          },
          logout: function() {
            Nav.logout();
          },
          test: function() {
            console.log($scope.user);
          }
          // toggleMode: function(status) {
          //   $scope.nightMode = status;
          //   document.body.className = $scope.nightMode ? "night" : "day";
          // }
        });

        $scope.userInfo = Profile._getParam("userInfo");
        // $scope.toggleMode($scope.nightMode);
      }]
    }
  })
  .directive('picProcessor', function() {
    return {
      restrict: 'EA',
      scope: {
        pic: "=model",
        title: '@'
      },
      template:
        '<div>'
        +'  <img ng-if="pic.file" ng-src="{{pic.file.localFilePath}}" />'
        +'  <img ng-show="!pic.file" src="/icons/image.png" ng-click="useCamera()" />'
        +'</div>'
        
        +'<div>'
        +'    <button class="icon button-icon button-large super-checkmark balanced"'
        +'       ng-show={{allowSwitchView}}'
        +'       ng-click="switchSubView()">'
        +'    </button>'

        +'    <button class="icon button-icon button-large super-ios7-camera energized"'
        +'       ng-click="useCamera()">'
        +'    </button>'

        +'    <button ng-show="pic.file"'
        +'       ng-click="removePic()"'
        +'       class="icon button-icon button-large super-ios7-trash assertive">'
        +'    </button>'
        +'    <button ng-show="!pic.file"'
        +'       class="icon button-icon button-large super-ios7-trash stable">'
        +'    </button>'
        +'</div>',
      controller: ['$http', '$scope', 'Host', 'Nav', 'Position', 'Profile', 'Item'
                  ,'supersonic', function($http, $scope, Host, Nav, Position, Profile
                  ,Item, supersonic) {
        angular.extend($scope, {
          capturePic: null,
          imgFilepath: Host.buildFilepath('items','base'),
          file: null,
          removePic: null
          // switchSubView: function() {
          //   supersonic.ui.navigationBar.show();
          //   Nav.switchSubView("main");
          // }
        });
        
        $scope.useCamera = function() {
          var userInfo = Profile._getParam("userInfo");
          var imgOptions = {
            destinationType: "fileURI",
            encodingType: "jpg",
            quality: 70,
            saveToPhotoAlbum: false,
            targetWidth: 280,
            targetHeight: 2100
          };

          $scope.pic.dbRecord = {
            created: moment( moment().toDate() ).format(),
            geoPoint: Position.getGeoPoint()
          }

          supersonic.media.camera.takePicture(imgOptions).then( function(imageURI){
            window.resolveLocalFileSystemURI(imageURI, function(file) {
              var targetDirURI = "file://" +steroids.app.absoluteUserFilesPath;
              var beg = imageURI.lastIndexOf('/') +1
                ,end = imageURI.lastIndexOf('.')
                ,fileExt = imageURI.substr(end +1);

              var fileName = imageURI.slice(beg,end) +"-" +$scope.picIndex +"." +fileExt;
              var fullFilePath = targetDirURI +"/" +fileName;
              // var fullFilePath = "file:///Users/macadmin/Desktop/test.png";

              window.resolveLocalFileSystemURI(targetDirURI, function(directory) {
                file.moveTo(directory, fileName, function(movedFile) {
                  var localFilePath = "/" +movedFile.name;
                  // var localFilePath = "/test.png";

                  $scope.pic.file = {
                    fileType: fileExt,
                    // fileType: "png",
                    localFilePath: localFilePath,
                    sourceFilename: fullFilePath
                  };

                  $scope.$apply();
                }, function(error) {
                   $scope.flashMessage = error;
                });
              }, function(error) {
                $scope.flashMessage = error;
              });
            }, function(errMessage) {
              $scope.flashMessage = errMessage;
            });
          }, function(err) {
            console.log(err);
          }, imgOptions);
        }

        $scope.removePic = function() {
          $scope.pic = Item.refreshPicParams();
        }
      }]
    }
  })
  .directive("user", function() {
    return {
      restrict: "EA",
      scope: {
        user: "=model"
      },
      template:
        '<i class="item-avatar-left">'
        +'  <img ng-src={{imgFilepathUser}}{{user.filename}} />'
        +'</i>'
        +'<span>'
        +'  <b>{{user.firstName}} {{user.lastName}}</b>'
        +'</span>',
      controller: ['$rootScope','$scope','Host',function($rootScope,$scope
                  ,Host) {
        var input = true;
        angular.extend($scope, {
          imgFilepathUser: Host.buildFilepath('users', 'avatar')
        });
      }]
    };
  })
  .controller('btmSheetCtrl', function($scope,$mdBottomSheet,Nav) {
    $scope.openModal = function() {
      $mdBottomSheet.hide();
      Nav.enterView("modal", Nav.modalOnTapOptions("create"));  
    }
  })