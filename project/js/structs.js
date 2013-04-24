reqjs.define(['Struct'], function (Struct) {
	'use strict';

	var structs = {

		// Jazz2 Animations Library
		J2A: {
			ALIB_Header: new Struct([
				{magic: '4'},						// char Magic[4] = "ALIB";     // Magic number
				{signature:  new Uint32Array(1)},	// long Unknown1 = 0x00BEBA00; // Little endian, unknown purpose
				{headerSize: new Uint32Array(1)},	// long HeaderSize;            // Equals 464 bytes for v1.23 Anims.j2a, (464-28)/4 = 109
				{version:    new Uint16Array(1)},	// short Version = 0x0200;     // Probably means v2.0
				{unknown2:   new Uint16Array(1)},	// short Unknown2 = 0x1808;    // Unknown purpose
				{filesize:   new Uint32Array(1)},	// long FileSize;              // Equals 8182764 bytes for v1.23 anims.j2a
				{checksum:   new Int32Array(1)},	// long CRC32;                 // Note: CRC buffer starts after the end of header
				{setCount:   new Uint32Array(1)},	// long SetCount;              // Number of sets in the Anims.j2a (109 in v1.23)
				// {setAddress: ???}				// long SetAddress[SetCount];  // Each set's starting address within the file
			]),
			ANIM_Header: new Struct([
				{magic: '4'},							// char Magic[4] = "ANIM";         // Magic number
				{animCount:        new Uint8Array(1)},	// unsigned char AnimationCount;   // Number of animations in set
				{sampleCount:      new Uint8Array(1)},	// unsigned char SampleCount;      // Number of sound samples in set
				{frameCount:       new Uint16Array(1)},	// short FrameCount;               // Total number of frames in set
				{priorSampleCount: new Uint32Array(1)},	// long PriorSampleCount;          // Total number of sound sample across all sets preceding this one
				{streamSize: [
					new Uint32Array(2),
					new Uint32Array(2),
					new Uint32Array(2),
					new Uint32Array(2)
				]}
			]),

			// AnimInfo is so simple so it's skipped here
				// short FrameCount;   // Number of frames for this particular animation
				// short FPS;          // Most likely frames per second
				// long Reserved;      // Used internally by Jazz2.exe

			FrameInfo: new Struct([
				{width:     new Uint16Array(1)},	// short Width;
				{height:    new Uint16Array(1)},	// short Height;
				{coldspotX: new Uint16Array(1)},	// short ColdspotX;    // Relative to hotspot
				{coldspotY: new Uint16Array(1)},	// short ColdspotY;    // Relative to hotspot
				{hotspotX:  new Int16Array(1)},		// short HotspotX;
				{hotspotY:  new Int16Array(1)},		// short HotspotY;
				{gunspotX:  new Uint16Array(1)},	// short GunspotX;     // Relative to hotspot
				{gunspotY:  new Uint16Array(1)},	// short GunspotY;     // Relative to hotspot
				{imageAddress: new Uint32Array(1)},	// long ImageAddress;  // Address in Data3 where image starts
				{maskAddress:  new Uint32Array(1)}	// long MaskAddress;   // Address in Data3 where mask starts
			])
		},


		// Jazz2 Tilesets
		J2T: {
			TILE_Header: new Struct([
				{copyright: '180'},
				{magic:     '4'},
				{signature: new Uint32Array(1)},
				{title:     '32'},
				{version:   new Uint16Array(1)},
				{fileSize:  new Uint32Array(1)},
				{checksum:  new Int32Array(1)},
				{streamSize: [
					new Uint32Array(2),
					new Uint32Array(2),
					new Uint32Array(2),
					new Uint32Array(2)
				]}
			])
		},


		// Jazz2 Levels
		J2L: {
			LEVL_Header: new Struct([
				{copyright: '180'},
				{magic:     '4'},
				{passwordHash: '3'},
				{homecooked: new Uint8Array(1)},
				{levelName: '32'},
				{version:   new Uint16Array(1)},
				{fileSize:  new Uint32Array(1)},
				{checksum:  new Int32Array(1)},
				{streamSize: [
					new Uint32Array(2),
					new Uint32Array(2),
					new Uint32Array(2),
					new Uint32Array(2)
				]}
			])
		}

	};

	return structs;
});