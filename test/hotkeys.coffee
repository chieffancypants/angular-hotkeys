
describe 'Angular Hotkeys', ->

  hotkeys = scope = $rootScope = $rootElement = $window = null

  beforeEach ->
    module 'cfp.hotkeys'

    result = null
    inject (_$rootElement_, _$rootScope_, _hotkeys_) ->
      hotkeys = _hotkeys_
      $rootElement = _$rootElement_
      $rootScope = _$rootScope_
      scope = $rootScope.$new()

  it 'should insert the help menu into the dom', ->
    children = angular.element($rootElement).children()
    expect(children.hasClass('cfp-hotkeys-container')).toBe true

  it 'add(args)', ->
    hotkeys.add 'w', 'description here', ->
    expect(hotkeys.get('w').description).toBe 'description here'
    expect(hotkeys.get('x')).toBe false

  it 'add(object)', ->
    callback = false
    hotkeys.add
      combo: 'w'
      description: 'description'
      callback: () ->
        callback = true

    expect(hotkeys.get('w').description).toBe 'description'

    # Test callback:
    expect(callback).toBe false
    KeyEvent.simulate('w'.charCodeAt(0), 90)
    expect(callback).toBe true

  it 'description should be optional', ->
    # func argument style:
    hotkeys.add 'w', ->
    expect(hotkeys.get('w').description).toBe '$$undefined$$'

    # object style:
    hotkeys.add
      combo: 'e'
      callback: ->

  it 'del()', ->
    hotkeys.add 'w', ->
    expect(hotkeys.get('w').description).toBe '$$undefined$$'
    hotkeys.del 'w'
    expect(hotkeys.get('w')).toBe false

  it 'should toggle help when ? is pressed', ->
    expect(angular.element($rootElement).children().hasClass('in')).toBe false
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(angular.element($rootElement).children().hasClass('in')).toBe true

  it 'should bind esc when the cheatsheet is shown', ->
    expect(hotkeys.get('esc')).toBe false
    expect(angular.element($rootElement).children().hasClass('in')).toBe false
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(angular.element($rootElement).children().hasClass('in')).toBe true
    expect(hotkeys.get('esc').combo).toBe 'esc'
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(hotkeys.get('esc')).toBe false

  it 'should remember previously bound ESC when cheatsheet is shown', ->
    expect(hotkeys.get('esc')).toBe false

    # bind something to escape:
    hotkeys.add 'esc', 'temp', () ->
    expect(hotkeys.get('esc').description).toBe 'temp'

    # show the cheat-sheet which will overwrite the esc key:
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(hotkeys.get('esc').description).not.toBe 'temp'

    # hide the cheat sheet to verify the previous esc binding is back
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(hotkeys.get('esc').description).toBe 'temp'


  it 'should (un)bind based on route changes', ->
    # fake a route change:
    expect(hotkeys.get('w e s')).toBe false
    $rootScope.$broadcast('$routeChangeSuccess', { hotkeys: [['w e s', 'Do something Amazing!', 'callme("ishmael")']] });
    expect(hotkeys.get('w e s').combo).toBe 'w e s'

    # ensure hotkey is unbound when the route changes
    $rootScope.$broadcast('$routeChangeSuccess', {});
    expect(hotkeys.get('w e s')).toBe false

  it 'should callback when the hotkey is pressed', ->
    executed = false

    hotkeys.add 'w', ->
      executed = true

    KeyEvent.simulate('w'.charCodeAt(0), 90)
    expect(executed).toBe true

  it 'should callback according to action', ->
    keypressA = false;
    keypressB = false;

    hotkeys.add 'a', ->
      keypressA = true
    , 'keyup'

    hotkeys.add 'b', ->
      keypressB = true

    KeyEvent.simulate('a'.charCodeAt(0), 90)
    KeyEvent.simulate('b'.charCodeAt(0), 90)
    expect(keypressA).toBe false
    expect(keypressB).toBe true
    expect(hotkeys.get('a').action).toBe 'keyup'

  it 'should run routes-defined hotkey callbacks when scope is available', ->
    executed = false
    passedArg = null

    $rootScope.callme = (arg) ->
      executed = true
      passedArg = arg

    $rootScope.$broadcast '$routeChangeSuccess',
      hotkeys: [['w', 'Do something Amazing!', 'callme("ishmael")']]
      scope: $rootScope

    expect(executed).toBe false
    KeyEvent.simulate('w'.charCodeAt(0), 90)
    expect(executed).toBe true
    expect(passedArg).toBe 'ishmael'



describe 'hotkey directive', ->

  el = scope = hotkeys = $compile = $document = null

  beforeEach ->
    module('cfp.hotkeys')
    inject ($rootScope, _$compile_, _$document_, _hotkeys_) ->
      hotkeys = _hotkeys_
      $compile = _$compile_
      # el = angular.element()
      scope = $rootScope.$new()
      el = $compile('<div hotkey="{dir: callme}"></div>')(scope)
      scope.$digest()

  it 'should allow hotkey binding via directive', ->
    expect(hotkeys.get('dir').combo).toBe 'dir'

  it 'should unbind the hotkey when the directive is destroyed', ->




describe 'Platform specific things', ->
  beforeEach ->
    windowMock =
      navigator:
        platform: 'Macintosh'

    module 'cfp.hotkeys'

  it 'should display mac key combos', ->
    module ($provide) ->
      $provide.value '$window',
        navigator:
          platform: 'Macintosh'
      return

    inject (hotkeys) ->
      hotkeys.add 'mod+e', 'description'
      expect(hotkeys.get('mod+e').format()[0]).toBe '⌘ + e'

  it 'should display win/linux key combos', ->
    module ($provide) ->
      $provide.value '$window',
        navigator:
          platform: 'Linux x86_64'
      return

    inject (hotkeys) ->
      hotkeys.add 'mod+e', 'description'
      expect(hotkeys.get('mod+e').format()[0]).toBe 'ctrl + e'


describe 'Configuration options', ->

  it 'should disable the cheatsheet when configured', ->
    module 'cfp.hotkeys', (hotkeysProvider) ->
      hotkeysProvider.includeCheatSheet = false
      return
    inject ($rootElement, hotkeys) ->
      children = angular.element($rootElement).children()
      expect(children.length).toBe 0

  it 'should enable the cheatsheet when configured', ->
    module 'cfp.hotkeys', (hotkeysProvider) ->
      hotkeysProvider.includeCheatSheet = true
      return
    inject ($rootElement, hotkeys) ->
      children = angular.element($rootElement).children()
      expect(children.length).toBe 1

  it 'should accept an alternate template to inject', ->
    module 'cfp.hotkeys', (hotkeysProvider) ->
      hotkeysProvider.template = '<div class="little-teapot">boo</div>'
      return
    inject ($rootElement, hotkeys) ->
      children = angular.element($rootElement).children()
      expect(children.hasClass('little-teapot')).toBe true
