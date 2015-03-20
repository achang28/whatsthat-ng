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
      // scope: true,
      template:
        // '<md-sidenav class="md-sidenav-right md-whiteframe-z2" md-component-id="right" md-is-locked-open="$mdMedia(\'gt-sm\')">'
        '<md-sidenav class="md-sidenav-left" md-component-id="left">'
        +'  <md-content class="md-padding">'
        +'    <div ng-click="goToView(\'summary\')" class="md-primary">Requests</div>'
        +'    <div class="md-primary">Assignments</div>'
        +'    <div class="md-primary">Exempt List</div>'
        +'    <div ng-click="goToView(\'profile\')" class="md-primary">Profile</div>'
        +'    <div ng-click="logout()" class="md-primary">Logout</div>'
        +'  </md-content>'
        +'</md-sidenav>',
      controller: ['$rootScope', '$scope', 'Host', 'Nav', 'Position', 'Profile'
                ,'supersonic','$mdSidenav', function($rootScope,$scope,Host
                , Nav,Position,Profile, supersonic,$mdSidenav) {
        var thisView = Nav.parseViewName(steroids.view.location);

        angular.extend($scope, {
          clientImgFilepath: Host.buildFilepath('users', 'avatar'),
          userInfo: null,
          goToView: function(viewName) {
            var options, targetView;
            
            if (viewName != "summary") {
              targetView = "modal";
              options = Nav.buildOnTapOptions("modalData", "modal", supersonic.ui.layers.push, {
                targetSubView: viewName,
                geoPoint: Position.getGeoPoint()
              });
            } else {
              targetView = "summary";
              options = Nav.buildOnTapOptions("summaryData", "root", supersonic.ui.layers.popAll, {
                targetSubView: viewName,
                geoPoint: Position.getGeoPoint()
              });
            }

            Nav.enterView(targetView, options);
            $mdSidenav("left").close();
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
  // .controller('btmSheetCtrl', function($scope,$mdBottomSheet,Nav) {
  //   $scope.openModal = function() {
  //     $mdBottomSheet.hide();
  //     Nav.enterView("modal", Nav.modalOnTapOptions("create"));  
  //   }
  // })