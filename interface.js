import { RGBColor } from './rgbcolor.js'

export class PixelInterface {
  constructor() {
    if (!!PixelInterface.instance) {
      return PixelInterface.instance;
    }
    PixelInterface.instance = this;
    this.$interface = $('#interface');
    this._createButtons();
    return this;
  }
}

PixelInterface.prototype._createButtons = function() {

  let tabColor = [
    'black',
    'white',
    '#CD2525',
    '#710101',
    '#F08310',
    '#D7E133',
    '#8AF71A',
    '#57AB00',
    '#2E5605',
    '#06A372',
    '#0BABAF',
    '#1190E5',
    '#0B50B6',
    '#9D0BB6',
    '#E71DD1',
    '#530D0D',
    '#614300',
    '#808080',
  ];
  for (let color of tabColor) {
    let $button = $('<button></button>');
    $button.css('background-color', color);
    $button.data('color', color);
    $button.click(buttonClick);
    this.$interface.append($button);
  }
  $('#interface button').eq(0).addClass('selected');
}

function buttonClick(e) {
  $('#interface button').removeClass('selected');
  $(this).addClass('selected');
}

PixelInterface.prototype.getColor = function() { // returns as [r,g,b]
  let $button = $('#interface button.selected');
  let col = new RGBColor( $button.data('color') );
  return [col.r, col.g, col.b];
}
