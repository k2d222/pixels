import { RGBColor } from './rgbcolor.js'

const palettes = {
  seb: [
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
  ],
  sweetie: [
    'black',
    'white',
    '#1a1c2c',
    '#5d275d',
    '#b13e53',
    '#ef7d57',
    '#ffcd75',
    '#a7f070',
    '#38b764',
    '#257179',
    '#29366f',
    '#3b5dc9',
    '#41a6f6',
    '#73eff7',
    '#f4f4f4',
    '#94b0c2',
    '#566c86',
    '#333c57',
  ],
  default: [
    '#e4a672',
    '#b86f50',
    '#743f39',
    '#3f2832',
    '#9e2835',
    '#e53b44',
    '#fb922b',
    '#ffe762',
    '#63c64d',
    '#327345',
    '#193d3f',
    '#4f6781',
    '#afbfd2',
    '#ffffff',
    '#2ce8f4',
    '#0484d1',
  ]
}


export class PixelInterface {
  constructor() {
    if (!!PixelInterface.instance) {
      return PixelInterface.instance;
    }
    PixelInterface.instance = this;
    this.$interface = $('#interface');
    this.createPalette('default');
    return this;
  }
}

PixelInterface.prototype.createPalette = function(palette) {
  const colors = palettes[palette];
  for (let color of colors) {
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
