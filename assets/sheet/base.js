/* Runtime for the sheet. component.js is the design canvas component, copied
   unchanged; this file stands in for the canvas base class it extends. */
(function () {
'use strict';
class DCLogic {
  constructor() { this.props = { inks: 'six', animate: true }; this.state = {}; }
  setState(s) { Object.assign(this.state, s); }
}
