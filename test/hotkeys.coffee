
describe 'Angular Hotkeys', ->

  hotkeys = scope = $rootScope = $rootElement = null

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
      hotkey: 'w'
      description: 'description'
      callback: () ->
        callback = true

    expect(hotkeys.get('w').description).toBe 'description'

    # Test callback:
    expect(callback).toBe false
    KeyEvent.simulate('w'.charCodeAt(0), 90)
    expect(callback).toBe true

  it 'description should be optional', ->
    hotkeys.add 'w', ->
    expect(hotkeys.get('w').description).toBe '$$undefined$$'

  it 'del()', ->
    hotkeys.add 'w', ->
    expect(hotkeys.get('w').description).toBe '$$undefined$$'
    hotkeys.del 'w'
    expect(hotkeys.get('w')).toBe false

