/*
 * angular-hotkeys
 *
 * Automatic keyboard shortcuts for your angular apps
 *
 * (c) 2014 Wes Cruver
 * License: MIT
 */

(function() {

'use strict';

angular.module('cfp.hotkeys', []).provider('hotkeys', function() {

  this.$get = ['$window', '$rootScope', function ($window, $rootScope) {

    function wrapApply (callback) {
      // return mousetrap a function to call
      return function (event) {
        // this takes place outside angular, so we'll have to call
        // $apply() to make sure angular's digest happens
        $rootScope.$apply(function() {
          // call the original hotkey callback with the keyboard event
          callback(event);
        });
      };
    }

    return {
      add: function(hotkey, callback) {
        Mousetrap.bind(hotkey, wrapApply(callback));
      }
    };

  }];

});



})();
