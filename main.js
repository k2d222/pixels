import { PixelGrid, CanvasManager } from './canvas.js'
import { PixelInterface } from './interface.js'
import { Server } from './server.js'

$(document).ready(main);

function main() {

  let pixelInterface = new PixelInterface();

  let $canvas = $('canvas');
  let canvas = $canvas.get(0);

  canvas.width = $canvas.width();
  canvas.height = $canvas.height();


  let pixelGrid = new PixelGrid()
  let canvasMgr = new CanvasManager(pixelGrid, canvas);

  let server = new Server('pi.thissma.fr', 16400);
  server.on('grid', (grid) => {
    pixelGrid.load(grid);
    canvasMgr.draw();
  });
  server.on('pixel', (pix) => {
    pixelGrid.setPixelColor(pix[0], pix[1], pix[2], false);
    canvasMgr.draw();
  });
  server.on('users', (count) => {
    $('#users span').html(count);
  });
  pixelGrid.onChange( (pix) => {
    server.send('pixel', pix);
  })


  canvasMgr.scale = 10;
  canvasMgr.minScale = 2;
  canvasMgr.maxScale = 50;
  canvasMgr.draw();


  $(window).resize(function() {
    canvas.width = $canvas.width();
    canvas.height = $canvas.height();
    canvasMgr.draw();
  });

  let $mapButtons = $('#map-selector button');
  $mapButtons.click(function() {
    server.send('map', $('#map-selector button').index(this) );
  });

}




function createButtons() {
  let colors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [255, 0, 255],
    [0, 255, 255],
    [255, 255, 255],
    [0, 0, 0],
  ];

  let $container = $('#colors');

  for (let col of colors) {
    let background = `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
    let $btn = $('<button></button>');
    $btn.css('background', background);
    $($container).append($btn);
  }


  $('#colors button').click(function(e) {
    $('#colors button').removeClass('selected');
    $(e.target).addClass('selected');
  })
}
