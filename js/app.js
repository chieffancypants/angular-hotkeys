

angular.module('example', ['cfp.hotkeys'])
  .controller('ExampleCtrl', function ($scope, $http, $timeout, $window, hotkeys) {
    console.log(hotkeys);

    $scope.keypressed = false;

    $scope.displayKey = function (event) {
      event.preventDefault();
      $scope.keypressed = 'Yep!';
      console.log(event);
    };

    $scope.toggleHelp = function() {
      console.log(hotkeys);
      hotkeys.toggleHelp();
    };

    hotkeys.add('mod+right', 'Triggered when pressing the right arrow on the keyboard', $scope.displayKey);
    hotkeys.add('mod+left', 'Press the left key!', $scope.displayKey);
    hotkeys.add('g g', 'Goto project\'s GitHub', function (event) {
      event.preventDefault();
      $window.location.href = 'https://github.com/chieffancypants/angular-hotkeys';
    });
    hotkeys.add('g c', 'Goto chieffancypants\'s account' , function (event) {
      event.preventDefault();
      $window.location.href = 'https://github.com/chieffancypants';
    });

  });
