

angular.module('example', ['cfp.hotkeys'])
  .controller('ExampleCtrl', function ($scope, $http, $timeout, $window, hotkeys) {
    console.log(hotkeys);

    $scope.keypressed = false;

    var timer;

    $scope.displayKey = function (event, hotkey) {
      event.preventDefault();
      $scope.keypressed = hotkey.format();
      $timeout.cancel(timer);
      timer = $timeout(function(){
        $scope.keypressed = false;
      }, 1000);
    };

    $scope.displayKey2 = function (event, hotkey) {
      $scope.keypressed = hotkey.format();
      $timeout.cancel(timer);
      timer = $timeout(function(){
        $scope.keypressed = false;
      }, 1000);
    };

    $scope.toggleHelp = function() {
      console.log(hotkeys);
      hotkeys.toggleHelp();
    };

    hotkeys.add('mod+right', 'Triggered when pressing the right arrow on the keyboard', $scope.displayKey);
    hotkeys.add('mod+left', 'Press the left key!', $scope.displayKey);
    hotkeys.add('down', $scope.displayKey2);
    hotkeys.add('up', $scope.displayKey2);
    hotkeys.add('space', $scope.displayKey2);
    hotkeys.add('g g', 'Goto project\'s GitHub', function (event) {
      event.preventDefault();
      $window.location.href = 'https://github.com/chieffancypants/angular-hotkeys';
    });
    hotkeys.add('g c', 'Goto chieffancypants\'s account' , function (event) {
      event.preventDefault();
      $window.location.href = 'https://github.com/chieffancypants';
    });

  });
