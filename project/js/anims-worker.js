importScripts('lib/require.min.js', 'lib/inflate.min.js');

reqjs.require(['structs', 'utils'], function (structs, utils) {
	'use strict';

	function Set() {
		this.header = null;
		this.animInfo = { // these are typed arrays
			frameCount: null,
			fps: null,
			startingFame: null
		},
		this.animations      = [];
		this.frameInfoBuffer = null;
		this.imageDataView = null;
	}
	Set.prototype.simplify = function () {
		return {
			animCount: this.header.animCount
		};
	};

	function Anim() {
		this.frames = [];
		this.fps = 0;
		this.startFrame = 0;
		this.imageData = null;
		this.maskData  = null;
	}

	function Frame() {
		this.info = null;
		//this.imageDataLength = 0;
		//this.maskDataLength  = 0;
	}
	

	function nextHighestPowerOfTwo(x) {
		--x;
		for (var i = 1; i < 32; i <<= 1) {
			x = x | x >> i;
		}
		return x + 1;
	}

	var J2A = structs.J2A;

	var anims = {
		buffer: null,
		header: null,
		sets:   [],

		spritesheet: {
			maxWidth: 4096,
			maxHeight: 4096
		}
	};
	var actions = {};

	self.addEventListener('message', function (e) {
		actions[e.data.action].apply(null, e.data.params);
	}, false);
	

	actions.loadAnimFile = function (animsPath) {
		anims.buffer = null;
		anims.header = null;
		anims.sets = null;
		self.postMessage({downloadProgress: [0, 0, 0]});

		utils.getFileBuffer(animsPath, function (buffer) {
			if (buffer) {
				anims.buffer = buffer;
				anims.header = J2A.ALIB_Header.unpack(anims.buffer.slice(0, 28));
				anims.header.setAddress = new Uint32Array(anims.buffer, 28, anims.header.setCount);
				anims.sets = utils.filledArray(anims.header.setCount, null);

				self.postMessage({
					version: anims.header.version,
					setCount: anims.header.setCount
				});
			} else {
				self.postMessage(null);
			}
		}, function (e) {
			self.postMessage({downloadProgress: [e.loaded, e.total, e.loaded/e.total]});
		});
	};

	actions.loadSet = function (setId, skipCallback) {

		var set = anims.sets[setId];
		if (!set) {
			
			var setOffset = anims.header.setAddress[setId];

			var header = J2A.ANIM_Header.unpack(anims.buffer.slice(setOffset, setOffset+44));

			var offset = setOffset+44;
			var animInfoBuffer = new Uint8Array(new Zlib.Inflate(new Uint8Array(anims.buffer.slice(offset, offset+header.streamSize[0][0]))).decompress()).buffer;
			var animInfo16 = new Uint16Array(animInfoBuffer);
			var animInfo32 = new Uint32Array(animInfoBuffer);
			offset += header.streamSize[0][0];
			var frameInfoBuffer = new Uint8Array(new Zlib.Inflate(new Uint8Array(anims.buffer.slice(offset, offset+header.streamSize[1][0]))).decompress()).buffer;
			offset += header.streamSize[1][0];
			var imageDataView = new Uint8Array(new Zlib.Inflate(new Uint8Array(anims.buffer.slice(offset, offset+header.streamSize[2][0]))).decompress());
			offset += header.streamSize[2][0];
			// Skipping sampleData for now..

			var frameCount = new Uint16Array(header.animCount);
			var fps = new Uint16Array(header.animCount);
			var startingFrame = new Uint32Array(header.animCount);
			for (var i = 0; i < header.animCount; i++) {
				frameCount[i] = animInfo16[i*4];
				fps[i] = animInfo16[i*4+1];
				startingFrame[i] = animInfo32[i*2+1];
			}

			set = anims.sets[setId] = new Set();
			
			set.animInfo.frameCount = frameCount;
			set.animInfo.fps = fps;
			set.animInfo.startingFrame = startingFrame;
			set.animations = utils.filledArray(header.animCount, null);
			set.frameInfoBuffer = frameInfoBuffer;
			set.imageDataView = imageDataView;

			// We don't need these anymore
			delete header.streamSize;
			delete header.priorSampleCount;
			delete header.sampleCount;
			delete header.magic;

			set.header = header;
		}

		if (!skipCallback) {
			self.postMessage(set.simplify());
		}
		return set;
	};

	actions.loadAnimation = function (setId, animId) {
		var set = anims.sets[setId]; // If set is not loaded, it will load it

		var anim = set.animations[animId];
		if (!anim) { // Anim is already loaded

			anim = anims.sets[setId].animations[animId] = new Anim();

			var frameOffset = 0;
			for (var i = 0; i < animId; i++) {
				frameOffset += set.animInfo.frameCount[i]*24;
			}

			var frames = [];
			for (var i = 0; i < set.animInfo.frameCount[animId]; i++) {
				var frame = new Frame();
				frame.info = J2A.FrameInfo.unpack(set.frameInfoBuffer.slice(frameOffset+i*24, frameOffset+i*24+24));
				//frame.updateImageData(set.imageDataView);
				frames[i] = frame;
			}

			anim.frames = frames;
			anim.fps = set.animInfo.fps[animId];
			anim.startFrame = set.animInfo.startingFrame[animId];
		}

		self.postMessage(anim);
	};

	actions.unloadSet = function (setId) {
		var set = anims.sets[setId];
		if (set) {
			anims.sets[setId] = null;
			self.postMessage(anims);
		} else {
			self.postMessage(false);
		}
	};

	actions.unloadAnimation = function (setId, animId) {
		var set = anims.sets[setId];
		var anim = set[animId];
		if (anim) {
			set[animId] = null;

			var canRemoveSet = true;
			for (var i = 0; i < set.animations.length; i++) {
				if (set.animations[i]) {
					canRemoveSet = false;
					break;
				}
			}

			// Automatically unload set
			if (canRemoveSet) {
				actions.unloadSet(setId);
			}
			self.postMessage(true);
		} else {
			self.postMessage(false);
		}
	};

	actions.buildSpriteSheet = function () {

		function drawFrame(frame, offx, offy, imageDataView) {
			var imageOffset = frame.info.imageAddress+4;

			var frameh = frame.info.height;

			var cursorx = 0;
			var cursory = 0;
			
			//var byteCount = 0;
			while (cursory < frameh) {
				var codebyte = imageDataView[imageOffset++];
				//byteCount++;
				if (codebyte < 0x80) {
					cursorx += codebyte;
				} else if (codebyte === 0x80) {
					cursorx = 0;
					cursory++;
				} else {
					var l = codebyte - 0x80;
					for (var m = 0; m < l; m++) {
						var index = imageDataView[imageOffset++];
						if (index > 0) {
							pixelBuffer[cursorx+offx + (cursory+offy)*packedInfo.bufferWidth] = index;
						}
						cursorx++;
						//byteCount++;
					}
				}
			}
		}

		var imageInfos = [];

		var totalPixelCount = 0;
		var totalFrameCount = 0;
		var totalAnimCount  = 0;
		var totalSetCount   = 0;

		for (var s = 0; s < anims.sets.length; s++) {
			if (!anims.sets[s]) continue;
			var set = anims.sets[s];
			for (var a = 0; a < set.animations.length; a++) {
				if (!set.animations[a]) continue;
				var anim = set.animations[a];
				for (var f = 0; f < anim.frames.length; f++) {
					var frame = anim.frames[f];
					imageInfos.push({
						width: frame.info.width,
						height: frame.info.height,
						setId: s,
						animId: a,
						frameId: f
					});
					totalPixelCount += frame.width*frame.height;
				}
				totalFrameCount += anim.frames.length;
				totalAnimCount += 1;
			}
			totalSetCount += 1;
		}

		var packedInfo = utils.texturePacker.pack(imageInfos, {
			maxWidth: anims.spritesheet.maxWidth,
			maxHeight: anims.spritesheet.maxHeight
		});
		packedInfo.bufferWidth = /*packedInfo.width; /*/nextHighestPowerOfTwo(packedInfo.width);
		packedInfo.bufferHeight = /*packedInfo.height; /*/nextHighestPowerOfTwo(packedInfo.height);

		self.postMessage(packedInfo);

		var pixelBuffer = new Uint8Array(packedInfo.bufferWidth*packedInfo.bufferHeight);

		for (var i = 0; i < packedInfo.textures.length; i++) {
			var textureInfo = packedInfo.textures[i];
			var set = anims.sets[textureInfo.setId];
			var anim = set.animations[textureInfo.animId];
			var frame = anim.frames[textureInfo.frameId];
			drawFrame(frame, textureInfo.x, textureInfo.y, set.imageDataView);
		}

		self.postMessage(pixelBuffer.buffer, [pixelBuffer.buffer]);
	}
	

	self.postMessage('ready');
});

