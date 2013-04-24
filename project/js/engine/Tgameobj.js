reqjs.define("G_Struc", function (G_Struc) {
	'use strict';
	
	function Tgameobj() {

	//constant section of data (same for all game objects!)
		G_Struc.include(this);

	//varying section of data
		this.data = new Uint8Array(128-(18*4));	//filler (Word8)

	}

	return Tgameobj;
});