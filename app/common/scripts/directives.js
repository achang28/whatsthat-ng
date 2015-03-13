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
            quality: 60,
            saveToPhotoAlbum: false,
            targetWidth: 240,
            targetHeight: 180
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
      controller: ['$rootScope','$scope','Host',function($rootScope,$scope, Host) {
        angular.extend($scope, {
          imgFilepathUser: Host.buildFilepath('users', 'avatar'),
        });
      }]
    };
  })