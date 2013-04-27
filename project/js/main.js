
var isNode = typeof process !== 'undefined';

if (isNode) {
	var net = require('net');
	var dgram = require('dgram');
	var dns = require('dns');

	var gui = require('nw.gui');
	var nwin = gui.Window.get();
	gui.Window.get().showDevTools();
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

reqjs.requirejs(['network', 'utils', 'SpriteEngine', 'anims'], function (network, utils, SpriteEngine, anims) {
	'use strict';

	//var compressed = new Zlib.Deflate(stringToBytesFaster("Hello, World!")).compress();
	//console.log(new Zlib.Inflate(compressed).decompress());

	var stats = new Stats();
	stats.domElement.style.position = 'absolute';

	var gameContainer = document.getElementById('game');

	var glowctx = new GLOW.Context({
		width: 640,
		height: 480,
		antialias: false,
		depth: false,
		clear: {
			alpha: 1
		}
	});
	
	glowctx.GL.disable(GL.DEPTH_TEST);
	glowctx.GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
	glowctx.GL.enable(GL.BLEND);
	glowctx.GL.disable(GL.CULL_FACE);
	//glowctx.GL.cullFace(GL.FRONT);

	glowctx.domElement.id = 'gamecanvas';
	gameContainer.appendChild(stats.domElement);
	gameContainer.appendChild(glowctx.domElement);

	var spriteEngine = new SpriteEngine(glowctx);
	console.log(spriteEngine);

	window.addEventListener('resize', function () {
		resize();
	}, false);
	resize();

	function resize() {
		glowctx.setupViewport({width: window.innerWidth, height: window.innerHeight});
		glowctx.resize(window.innerWidth, window.innerHeight);
		spriteEngine.resize(glowctx.width, glowctx.height);
	}

	var paletteView = new Uint8Array(256*4);
	

	utils.getFileBuffer('game/defaultPalette.pal', function (buffer) {
		var lines = utils.arrayToString(new Uint8Array(buffer)).split("\n");
		lines.forEach(function (line, i) {
			paletteView.set(new Uint8Array(line.split(" ").concat(i===0?0:255)), i*4);
		});

		spriteEngine.palettes.tileset.data.set(paletteView, 0);
		spriteEngine.palettes.tileset.updateTexture();
		
	});


	var spriteLayer = new spriteEngine.Layer();
	var spriteMultiply = 5;
	spriteLayer.allocateSprites(839*spriteMultiply);

	var downloadProgressNode = document.createElement('progress');
	downloadProgressNode.id = "animsDownloadProgress";
	document.body.appendChild(downloadProgressNode);
	downloadProgressNode.value = 0;

	anims.on('downloadProgress', function (ratio) {
		downloadProgressNode.value = ratio*0.7;
	});
	anims.once('downloaded', function () {

		var totalAnimCount  = 0;
		var loadedAnimCount = 0;
		var st = performance.now();
		//downloadProgressNode.value = 1;

		for (var i = 0; i < anims.sets.length; i++) {
			anims.loadSet(i, function (set) {
				var setId = anims.sets.indexOf(set);
				for (var i = 0; i < anims.sets[setId].animations.length; i++) {
					totalAnimCount++;
					anims.loadAnimation(setId, i, function (anim) {
						var animId = anims.sets[setId].animations.indexOf(anim);

						if (true) {
							for (var j = 0; j < spriteMultiply; j++) {
								var sprite = new spriteEngine.Layer.Sprite({
									x: 0,
									y: 0,

									setId: setId,
									animId: animId,
									frameId: 0,

									scale: 1
								});
								spriteLayer.addSprite(sprite);
							}
						}

						loadedAnimCount++; 

						//for (var i = 0; i < anim.frames.length; i++) {
						//	totalPixelCount += anim.frames[i].width*anim.frames[i].height;
						//}
						//totalFrameCount += anim.frames.length;
						downloadProgressNode.value = 0.7+0.29*(loadedAnimCount/totalAnimCount);

						if (totalAnimCount === loadedAnimCount) {
							console.log(loadedAnimCount);

							anims.once('spritesheet', function () {
								downloadProgressNode.value = 1;
								console.log("Sprites extracted and built spritesheet in (ms):", performance.now()-st);
								console.log(anims.spritesheet);
								downloadProgressNode.parentNode.removeChild(downloadProgressNode);
								startTime = performance.now();
								render();
								
							});

							anims.buildSpriteSheet();
						}
					});
				}
			});

			
		}

	});

	anims.init();

	/*var st = performance.now();
	var totalAnimCount = 0;
	var totalFrameCount = 0;
	var totalPixelCount = 0;
	var loadedAnimCount = 0;

	for (var i = 0; i < anims.sets.length; i++) {
		loadSet(i, function (set) {
			var setId = anims.sets.indexOf(set);
			for (var i = 0; i < anims.sets[setId].animations.length; i++) {
				totalAnimCount++;
				loadAnimation(setId, i, function (anim) {
					loadedAnimCount++;

					//for (var i = 0; i < anim.frames.length; i++) {
					//	totalPixelCount += anim.frames[i].width*anim.frames[i].height;
					//}
					//totalFrameCount += anim.frames.length;
					downloadProgressNode.value = 0.7+0.29*(loadedAnimCount/totalAnimCount);

					if (totalAnimCount === loadedAnimCount) {

						buildSpriteSheet(function () {
							downloadProgressNode.value = 1;
							console.log("Sprites extracted and built spritesheet in (ms):", performance.now()-st);
							console.log(anims.spritesheet);
							downloadProgressNode.parentNode.removeChild(downloadProgressNode);
							anims.onload();
						});
						
					}
				});
			}
		});
	}*/
	
	/*loadSet(44, function (set) {
		loadAnimation(44, 1, function (anim) {
			//loadAnimation(55, 1, function (anim) {
				buildSpriteSheet(function () {
					downloadProgressNode.parentNode.removeChild(downloadProgressNode);
					console.log(anims.spritesheet);
					anims.onload();
				});
			//});
		});
	});*/

	/*setInterval(function () {
		console.log(totalFrameCount);
	}, 100);*/

	
	

	//anims.onload = function () {

		/*var canvas = document.createElement('canvas');
		canvas.width = anims.spritesheet.info.width;
		canvas.height = anims.spritesheet.info.height;
		var ctx = canvas.getContext('2d');
		var imgdata = ctx.createImageData(anims.spritesheet.info.bufferWidth, anims.spritesheet.info.bufferHeight);
		var data = imgdata.data;
		for (var i = 0; i < data.length/4; i++) {
			var index = anims.spritesheet.pixelBuffer[i];
			if (index > 0) {
				data[i*4+0] = index;
				data[i*4+1] = index;
				data[i*4+2] = index;
				data[i*4+3] = 255;
			}
		}
		ctx.putImageData(imgdata, 0, 0);
		imgdata = null;
		data = null;
		ctx = null;
		var img = new Image();
		document.body.appendChild(img);
		canvas.toBlob(function (blob) {
			img.src = window.URL.createObjectURL(blob);
			
			
		});
		canvas = null;*/

		

		
		/*var sprite = anims.spritesheet.info.textures[i];
		var frame = anims.sets[sprite.setId].animations[sprite.animId].frames[sprite.frameId];

		setFrame(vertices, uvs, i, frame, 50, i*50);*/
		//setFrame(vertices, uvs, 0, {x: 0, y: 0, width: anims.spritesheet.info.width, height: anims.spritesheet.info.height}, 0, 0)
		

		

		

		//setFrame(vertices, uvs, 0, {x: 0, y: 0, width: anims.spritesheet.info.width, height: anims.spritesheet.info.height, hotspotX: 0, hotspotY: 0}, 0, 0);

		/*window.addEventListener('resize', function () {
			glowctx.cache.uniformByLocation[sprites.uniforms.u_resolution.locationNumber] = null;

			animShader.data.u_resolution.set(glowctx.width, glowctx.height);
		}, false);*/
		var mouseX = 0;
		var mouseY = 0;
		window.addEventListener('mousemove', function (e) {

			mouseX = e.pageX-glowctx.width/2;
			mouseY = e.pageY-glowctx.height/2;

			spriteLayer.setOffset(mouseX/1.5, mouseY/1.5);
			
		}, false);

		var startTime = performance.now();
		var lastdelta = 0;

		var gameTicks = 0;


		function render() {
			var delta = (performance.now()-startTime)/1000;
			stats.begin();
			glowctx.clear();
			var fps = 1/(delta-lastdelta);
			

			/*if (spriteLayer.sprites.length < spriteLayer.maxSpriteCount) {
				
				var setId = 55;
				var animId = (delta|0) % anims.sets[setId].animations.length;
				var anim = anims.sets[setId].animations[animId];
				for (var i = 0; i < 20; i++) {
					
					var sprite = new spriteEngine.Layer.Sprite({
						x: Math.cos(delta*2.5)*200+100+mouseX,
						y: Math.sin(delta*2+i/10)*200+i*20+100+mouseY,

						setId: setId,
						animId: animId,
						frameId: (delta*anim.fps|0) % anim.frames.length
					});
					spriteLayer.addSprite(sprite);
				}
			}*/
			
			
			/*for(var i = 0; i < spriteLayer.sprites.length; i++) {
				var sprite = spriteLayer.sprites[i];
				if (!sprite) continue;
				var anim = anims.sets[sprite.setId].animations[sprite.animId];
				sprite.x = 500+Math.cos(delta+sprite.animId)*100;
				//sprite.y = 200+sprite.setId*10;
				sprite.scale = 1+Math.sin(delta+sprite.animId/anims.sets[sprite.setId].animations.length)*0.2;
				sprite.frameId = (delta*anim.fps|0) % anim.frames.length;
				//spriteLayer.updateSprite(sprite);
			}*/

			var setCount = 20;
			var animCount = 0;

			for (var i = 0; i < spriteLayer.sprites.length; i++) {
				if (!spriteLayer.sprites[i]) continue;
				var sprite = spriteLayer.sprites[i];
				var set = anims.sets[sprite.setId];
				var anim = set.animations[sprite.animId];

				var frameId = (delta*anim.fps|0) % anim.frames.length;
				var speed = (spriteMultiply-(i/800))/8+1;

				var animSpace = (sprite.animId/set.animations.length)*Math.PI*2+i/10;

				var drawx = Math.min(delta/4, 1)*Math.cos(delta*(1/4)*speed+animSpace-mouseX/500+(sprite.setId/70)+(i%spriteMultiply))*((i%spriteMultiply)*200+300+sprite.setId/10)+glowctx.width/2;
				var drawy = Math.min(delta/4, 1)*Math.sin(delta*(1/3)*speed+animSpace-mouseY/500+(sprite.setId/100))*((i%spriteMultiply)*200+300+sprite.setId/10)+glowctx.height/2;
				var rotation = (delta*(sprite.setId/2+15))/40+sprite.animId*(Math.PI/4)+(i%spriteMultiply);
				var scale = 1+Math.sin(delta*2*(i/1000))*0.3;

				sprite.x = drawx;
				sprite.y = drawy;
				sprite.rotation = rotation;
				sprite.frameId = frameId;
				sprite.scale = scale;
			}

			

			spriteLayer.updateAll();
			

			spriteLayer.draw();


			/*

			
			
			sprites.attributes.a_position.bufferData();
			sprites.attributes.a_texCoord.bufferData();

			
			sprites.draw();*/


			stats.end();
			gameTicks++;
			lastdelta = delta;
			requestAnimFrame(render, glowctx.domElement);
		}
		//render();
	//}



});
