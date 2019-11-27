import { PixelGrid, CanvasManager } from './canvas.js'
import { PixelInterface } from './interface.js'

$(document).ready(main);

const GRID_W = 100;
const GRID_H = 100;

function main() {

  let pixelInterface = new PixelInterface();

  let $canvas = $('canvas');
  let canvas = $canvas.get(0);

  canvas.width = $canvas.width();
  canvas.height = $canvas.height();


  let pixelGrid = new PixelGrid(GRID_W, GRID_H)
  let canvasMgr = new CanvasManager(pixelGrid, canvas);

  pixelGrid.loadData()
  .then(function() {
    canvasMgr.draw();
  });


  canvasMgr.scale = 10;
  canvasMgr.minScale = 2;
  canvasMgr.maxScale = 50;
  canvasMgr.draw();


  $(window).resize(function() {
    canvas.width = $canvas.width();
    canvas.height = $canvas.height();
    canvasMgr.draw();
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
