/*
 * angular-keyboard
 *
 * Automatic keyboard shortcuts for your angular apps
 *
 * (c) 2014 Wes Cruver
 * License: MIT
 */

(function() {

'use strict';

angular.module('cfp.keyboard', []).provider('cfpKeyboard', function() {

  this.$get = ['$window', function ($window) {

    var bindings = [];

    angular.element($window).on('keypress', function(e) {
      var str = String.fromCharCode(e.keyCode);

      if (bindings[str]) {
        bindings[str]();
      }
    });

    return {
      add: function(hotkey, callback) {
        bindings[hotkey] = callback;
      }
    };

  }];

});



})();
