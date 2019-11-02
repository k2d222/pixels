export class PixelGrid {

  sizeX; sizeY;
  pixels;

  constructor(sizeX, sizeY) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.pixels = [];

    for (var i = 0; i < sizeX; i++) {
      this.pixels[i] = [];
      for (var j = 0; j < sizeY; j++) {
        this.pixels[i][j] = [];
        for (var k = 0; k < 3; k++) { // RGB
          this.pixels[i][j][k] = Math.floor( Math.random() * 256 );
        }
      }
    }
  }
}

PixelGrid.prototype.getPixelColor = function(x, y) {
  if(x >= this.pixels.length || y >= this.pixels[0].length || x < 0 || y < 0) {
    return 'rgb(255, 255, 255)';
  }
  else {
    let color = this.pixels[x][y];
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
}




export class CanvasManager {

  dragLastX; dragLastY;
  posX; posY;
  scale; scaleMin; scaleMax;
  canvas; $canvas; ctx;
  grid;

  constructor(grid, canvas) {
    this.grid = grid;
    this.canvas = canvas;
    this.$canvas = $(canvas);
    this.ctx = canvas.getContext('2d');

    this.posX = this.posY = 0;
    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 10;

    let $canvas = $(canvas);

    $canvas.on('mousedown', (e) => {
      $canvas.on('mousemove', (e) => this._drag(e));
      this._dragStart(e);
    })
    $canvas.on('mouseup', () => {
      $canvas.off('mousemove');
    });

    $canvas.on('wheel', (e) => this._zoom(e));

    this.draw();
  }

}

CanvasManager.prototype._zoom = function(e) {
  let delta = e.originalEvent.deltaY  * .01 * this.scale;

  if(this.scale + delta > this.maxScale) delta = this.maxScale - this.scale;
  if(this.scale + delta < this.minScale) delta = this.minScale - this.scale;

  let x = e.originalEvent.x / this.$canvas.width() * this.canvas.width;
  let y = e.originalEvent.y / this.$canvas.height() * this.canvas.height;

  let centerX = x / this.scale + this.posX; // centre d'homotétie
  let centerY = y / this.scale + this.posY;

  this.scale += delta;

  let canvasW = this.canvas.width;
  let canvasH = this.canvas.height;

  let w = canvasW / this.scale;
  let h = canvasH / this.scale;

  this.posX = centerX - e.originalEvent.x / this.$canvas.width() * this.canvas.width / this.scale;
  this.posY = centerY - e.originalEvent.y / this.$canvas.height() * this.canvas.height / this.scale;

  this.draw();
}

CanvasManager.prototype._dragStart = function(e) {
  this.dragLastX = e.originalEvent.x / this.$canvas.width() * this.canvas.width;
  this.dragLastY = e.originalEvent.y / this.$canvas.height() * this.canvas.height;
}

CanvasManager.prototype._drag = function(e) {
  let deltaX = e.originalEvent.x / this.$canvas.width() * this.canvas.width - this.dragLastX;
  let deltaY = e.originalEvent.y / this.$canvas.height() * this.canvas.height - this.dragLastY;

  this.dragLastX = e.originalEvent.x / this.$canvas.width() * this.canvas.width;
  this.dragLastY = e.originalEvent.y / this.$canvas.height() * this.canvas.height;

  this.posX -= deltaX / this.scale;
  this.posY -= deltaY / this.scale;

  this.draw();
}

CanvasManager.prototype.draw = function() {
  let canvasW = this.canvas.width;
  let canvasH = this.canvas.height;

  let firstX = Math.floor(this.posX);
  let firstY = Math.floor(this.posY);
  let lastX  = Math.ceil(this.posX + canvasW / this.scale);
  let lastY  = Math.ceil(this.posY + canvasH / this.scale);

  let visibleCountX = lastX - firstX;
  let visibleCountY = lastY - firstY;

  for (let i = 0; i < visibleCountX; i++) {
    for (let j = 0; j < visibleCountY; j++) {

      this.ctx.fillStyle = this.grid.getPixelColor(firstX + i, firstY + j);

      let pixelX = (firstX + i - this.posX) * this.scale;
      let pixelY = (firstY + j - this.posY) * this.scale
      this.ctx.fillRect(pixelX, pixelY, this.scale, this.scale);
    }
  }
}
