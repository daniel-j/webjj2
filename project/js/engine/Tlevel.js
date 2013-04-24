reqjs.define(function () {
	'use strict';
	
	function Tlevel() {

		this.gravity = 0;
		this.waterlevel = 0;
		this.newwaterlevel = 0;
		this.blockwidth = 0, this.blockheight = 0; // Word
		this.pixelwidth = 0, this.pixelheight = 0;
		this.fixwidth = 0, this.fixheight = 0;
		this.finish = 0;		//this is general for all the players!
		this.finishcounter = 0;
		this.winner = 0;		//number of player that won!
		this.extra = 0;			//kills needed in BATTLE mode
		this.changecoins = 0;	//change coins when warped!
		this.type = 0;			// Word32
		this.Echo = 0;
		this.difficulty = 0;
		this.episode = 0;
		this.splitscreentype = 0;	// Word32
		this.Ambient = 0;
		this.AmbientDefault = 0;
		this.AmbientBack = 0;
		this.Lighting = 0;
		this.CRC = 0;			// Level checksum (Word32)
		this.tileCRC = 0;		// Tileset checksum (Word32)
		//char loadname[32];		/* Can't change, written to Macros */
		//char StartText[32];

	}

	return Tlevel;
});