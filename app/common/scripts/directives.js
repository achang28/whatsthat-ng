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