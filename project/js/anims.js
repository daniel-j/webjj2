reqjs.define(['utils'], function (utils) {
	'use strict';

	function Set(animCount) {
		this.animations = utils.filledArray(animCount || 0, null);
		this.imageDataBuffer = null;
	}

	function Anim() {
		this.frames = [];
		this.fps = 0;
		this.startFrame = 0;
	}

	function Frame(info) {
		this.width = info.width || 1;
		this.height = info.height || 1;
		this.coldspotX = info.coldspotX || 0;
		this.coldspotY = info.coldspotY || 0;
		this.hotspotX = info.hotspotX || 0;
		this.hotspotY = info.hotspotY || 0;
		this.gunspotX = info.gunspotX || 0;
		this.gunspotY = info.gunspotY || 0;
		this.imageAddress = info.imageAddress || 0;
		this.maskAddress = info.maskAddress || 0;
		this.x = 0;
		this.y = 0;
	}
	
	var animsPath = "../game/Anims.j2a";

	var anims = {
		version: 0,
		sets: [],

		spritesheet: {
			pixelBuffer: null,
			info: null
		}
	};
	var cbQueue = [];
	var downloadProgressCallback = null;
	var downloadProgressNode = document.createElement('meter');
	downloadProgressNode.id = "animsDownloadProgress";
	
	var worker = new Worker('js/anims-worker.js');

	worker.addEventListener('message', function (e) {
		var data = e.data;
		if (data && data.hasOwnProperty('debug')) {
			console.log("Anims worker:", data.debug);
			return;
		}

		if (data && data.hasOwnProperty('downloadProgress')) {
			handleDownloadProgress(data.downloadProgress);
			return;
		}

		var cb = cbQueue.shift();
		if (typeof cb === 'function') {
			cb(data);
		} else {
			throw "Anims: Unhandled worker callback for data "+data;
		}

	}, false);

	function addCallback(cb) {
		cbQueue.push(cb);
	}
	function workerAction(action, params, cb) {
		var obj = {action: action, params: params};
		worker.postMessage(obj);
		addCallback(cb);
	}

	function loadAnimFile(filename, cb, dlcb) {
		cb = cb || function () {};
		anims.version = 0;
		anims.sets = [];
		anims.spritesheet.pixelBuffer = null;
		anims.spritesheet.info = null;
		downloadProgressCallback = dlcb || null;
		//console.log("Loading animation library file...");
		document.body.appendChild(downloadProgressNode);
		downloadProgressNode.value = 0;
		workerAction('loadAnimFile', [animsPath], function (info) {
			if (info) {
				anims.version = info.version;
				anims.sets = utils.filledArray(info.setCount, null);
				cb(true);
			} else {

				cb(false);
			}
			
			downloadProgressCallback = null;
		});
	}

	function handleDownloadProgress(arr) {
		var loaded = arr[0];
		var total = arr[1];
		var ratio = arr[2];
		if (typeof downloadProgressCallback === 'function') {
			downloadProgressCallback(loaded, total, ratio);
		}
		downloadProgressNode.value = ratio*0.7;
	}

	function loadSet(setId, cb) {
		cb = cb || function () {};
		if (setId < 0 || setId >= anims.sets.length) {
			throw new RangeError("Anims: Invalid set id "+setId);
		}
		var set = anims.sets[setId];
		if (!set) {
			//console.log("Loading set "+setId+"...");
			workerAction('loadSet', [setId], function (info) {
				var set = anims.sets[setId] = new Set(info.animCount);
				cb(set);
			});
		} else {
			cb(set);
		}
	}

	function loadAnimation(setId, animId, cb) {
		cb = cb || function () {};
		if (setId < 0 || setId >= anims.sets.length) {
			throw "Anims: Invalid set id "+setId;
		}
		var set = anims.sets[setId];
		if (!set) {
			throw "Anims: Failed to load animation "+animId+" from unloaded set "+setId;
		}
		if (animId < 0 || animId >= set.animations.length) {
			throw "Anims: Invalid animation id "+animId+" of the set "+setId;
		}
		var anim = set.animations[animId];
		if (!anim) {
			//console.log("Loading animation "+animId+" in set "+setId+"...");
			workerAction('loadAnimation', [setId, animId], function (info) {
				var set = anims.sets[setId];
				var anim = set.animations[animId] = new Anim();
				//var imageDataView = new Uint8Array(set.imageDataBuffer);

				for (var i = 0; i < info.frames.length; i++) {
					var frame = anim.frames[i] = new Frame(info.frames[i].info);
					//frame.updateImageData(imageDataView);
				}

				anim.fps = info.fps;
				anim.startFrame = info.startFrame;
				
				cb(anim);
			});
		} else {
			cb(anim);
		}
	}

	function unloadSet(setId, cb) {
		cb = cb || function () {};
		var set = anims.sets[setId];
		if (!set) {
			throw "Anims: Failed to unload already unloaded set "+setId;
		}
		//console.log("Unloading set "+setId+"...");
		workerAction('unloadSet', [setId], function (ok) {

			anims.sets[setId] = null;
			
			cb(ok);
		});
	}

	function unloadAnimation(setId, animId, cb) {
		cb = cb || function () {};
		var set = anims.sets[setId];
		if (!set) {
			throw "Anims: Failed to unload animation "+animId+" from unloaded set "+setId;
		}
		var anim = set.animations[animId];
		if (!anim) {
			throw "Anims: Failed to unload already unloaded animation "+animId+" from set "+setId;
		}
		//console.log("Unoading animation "+animId+" from set "+setId+"...");
		workerAction('unloadAnimation', [setId, animId], function (ok) {
			var set = anims.sets[setId];
			set.animations[animId] = null;

			var canRemoveSet = true;
			for (var i = 0; i < set.animations.length; i++) {
				if (set.animations[i]) {
					canRemoveSet = false;
					break;
				}
			}

			if (canRemoveSet) {
				console.log("Removing empty set "+setId);
				anims.sets[setId] = null;
			}
			
			cb(ok);
		});
	}

	function buildSpriteSheet(cb) {
		var st = performance.now();
		cb = cb || function () {};
		anims.spritesheet.pixelBuffer = null;
		anims.spritesheet.info = null;
		var packedInfo = null;
		workerAction('buildSpriteSheet', [], function (info) {
			packedInfo = info;
			console.log("Got packedInfo");
			for (var i = 0; i < info.textures.length; i++) {
				var sprite = info.textures[i];
				var frame = anims.sets[sprite.setId].animations[sprite.animId].frames[sprite.frameId];
				frame.x = sprite.x;
				frame.y = sprite.y;
			}
		});
		addCallback(function (pixelBuffer) {
			console.log("Got pixel buffer");
			anims.spritesheet.pixelBuffer = new Uint8Array(pixelBuffer);
			anims.spritesheet.info = packedInfo;
			console.log("Built spritesheet in "+(performance.now()-st)+" ms");
			cb();
		});
		

		/*anims.spritesheet.bufferHeight      = Math.ceil(totalPixelCount/anims.spritesheet.bufferWidth);
		anims.spritesheet.pixelBuffer       = new Uint8Array(anims.spritesheet.bufferWidth*anims.spritesheet.bufferHeight);
		anims.spritesheet.frameOffsetBuffer = new Uint32Array(totalFrameCount);
		anims.spritesheet.animOffsetBuffer  = new Uint16Array(totalAnimCount);
		anims.spritesheet.setOffsetBuffer   = new Uint16Array(totalSetCount);*/

		/*var pixelOffset = 0;
		var frameOffset = 0;
		var animOffset  = 0;
		var setOffset   = 0;

		for (var s = 0; s < anims.sets.length; s++) {
			if (!anims.sets[s]) continue;
			var set = anims.sets[s];

			anims.spritesheet.setOffsetBuffer[setOffset] = animOffset;

			for (var a = 0; a < set.animations.length; a++) {
				if (!set.animations[a]) continue;
				var anim = set.animations[a];

				anims.spritesheet.animOffsetBuffer[animOffset] = frameOffset;

				for (var f = 0; f < anim.frames.length; f++) {
					var frame = anim.frames[f];
					anims.spritesheet.pixelBuffer.set(frame.imageData, pixelOffset);

					anims.spritesheet.frameOffsetBuffer[frameOffset] = pixelOffset;
					frameOffset += 1;
					pixelOffset += frame.imageData.length;
				}
				animOffset += 1;
			}
			setOffset += 1;
		}*/

		
	}

	// When the worker is ready
	addCallback(function () {
		
		loadAnimFile(animsPath, function (ok) {
			var st = performance.now();
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
			}
			
			/*loadSet(55, function (set) {
				loadAnimation(55, 0, function (anim) {
					loadAnimation(55, 1, function (anim) {
						buildSpriteSheet(function () {
							console.log(anims.spritesheet);
							anims.onload();
						});
					});
				});
			});*/

			/*setInterval(function () {
				console.log(totalFrameCount);
			}, 100);*/
			
		}, function (loaded, total, ratio) {
			//console.log("Progress:", ratio*100);
		});
	});

	return anims;
});