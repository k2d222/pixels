export class PixelInterface {
  constructor() {
    this.$interface = $('#interface');
    this._createButtons();
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
    $button.click(buttonClick);
    this.$interface.append($button);
  }
}

function buttonClick(e) {
  $('#interface button').removeClass('selected');
  $(this).addClass('selected');
}
