reqjs.define("G_Struc", function (G_Struc) {
	'use strict';
	
	//all player related structures, for MPG
	function TPlayer() {

		// type int unless specified
	//the beginning is the same as all other game structures, to keep things consistent. many of these variables (like
	//state aren't used for this.
		G_Struc.include(this);

		this.name = "";			// char[20]
		this.smax = 0;			//maxspeed
		this.skid = 0;
		this.push = 0;
		this.lastpush = 0;		// Word32
		this.pushobject = 0;
		this.run = 0;
		this.rundash = 0;
		this.lastrun = 0;
		this.dive = 0;
		this.lastdive = 0;		// Word32
		this.helicopter = false;//flag
		this.fly = 0;			//1:normal,-1=airboard,2 and higher: copter
		this.lookvp = 0;		//how long looking up
		this.lastlookvp = 0;	// Word32
		this.lookvpamt = 0;		//how much pixels to look up
		this.hang = 0;
		this.vine = 0;			//hanging from vine (==eventnum)
		this.oldxpos = 0;
		this.oldypos = 0;
		this.oldxspeed = 0;
		this.oldyspeed = 0;
		this.lastjump = 0;
		this.specialjump = 0;
		this.specialmove = 0;
		this.jumpspeed = 0;		//jumpspeed
		this.downattack = 0;
		this.lastdownattack = 0;//0 when doing attack, counting up after landing
		this.spring = 0;
		this.lastspring = 0;
		this.rolling = 0;
		this.ledge = 0;
		this.climbledge = 0;
		this.ledgewiggle = 0;
		this.warparea = 0;
		this.warpcounter = 0;
		this.warpfall = 0;
		this.warpxpos = 0;
		this.warpypos = 0;
		this.warprandomizer = 0;
		this.goup = false;   	//flags, dont need to be DWORDS
		this.godown = false;	//"
		this.goleft = false;	//"
		this.goright = false;	//"
		this.gofardown = 0;
	    this.slope = 0;
		this.oldeventposx = 0;
		this.oldeventposy = 0;
		this.lastevent = 0;
		this.vdir = 0;			//which way the player wants to go...
		this.hdir = 0;
		this.idletime = 0;
		this.idleanim = 0;
		this.idletrail = 0;
		this.idleextra = 0;
		this.bird = 0;
		this.fire = false;		//flag
		this.firespeed = 0;
		this.firehold = false;	//flag: says if firekey is still pressed
		this.lastfire = 0;
		this.firetype = 0;
		this.firedirection = 0; //updownleftrightetc
		this.autofire = 0;
		this.fireangle = 0;
		this.airboard = 0;
		this.loopsample = 0;
		this.shieldsample = 0;
		this.rushsample = 0;
		this.hpole = 0;
		this.vpole = 0;
		this.polespeed = 0;
		this.lastpolepos = 0;
		this.event = 0;			//event behind player (Word32)
		this.lastselect = 0;
		this.fixanim = false;	//flag if current anim can be changed
		this.animspeed = 0;
		this.phasecnt = 0;
		this.stop = 0;			//freezes player (no gravity!)
		this.bemoved = 0;		//moved around by other obj
		this.sucked = 0;
		this.lastsuckpos = 0;
		this.lift = 0;			//lifting up another player?
		this.lives = 0;
		this.hit = 0;
		this.invincibility = false;
		this.flicker = false;
		this.time = 0;
		this.events = new Uint32Array(4);	//events that the player is hitting, for optimal precision (Word32)
		this.DisplayLastFrame = 0;
		//Tdisplay Display[MAXDISPLAYS];
		this.score = 0;
		this.lastscoredisplay = 0;
		this.food = 0;
		this.gem = new Uint16Array(5);
		this.lastgemcounter = 0;
		this.oldgem = new Uint16Array(5);
		this.ammo = new Uint16Array(10);
		this.gunpower = new Uint8Array(10);		// Word8
		this.berserk = 0;
		this.oldammo = new Uint16Array(10);
		this.oldgunpower = new Uint8Array(10);	// Word8
		this.shieldtype = 0;
		this.shield = 0;
		this.shieldx = 0;
		this.shieldy = 0;
		this.character = 0;		//jazz or spaz (anim ID!), Word32
		this.orgcharacter = 0;	// Word32
		this.morph = 0;
		this.frogmorph = 0;
	//platform/pushing related stuff
		this.platform = 0;		//object number of platform
		this.platformtype = 0;	//type
		this.touchsolidobject = 0;
		this.platform_relx = 0;	//relative x position of player to platform (for accuracy!)
		this.platform_rely = 0;
		this.movexspeed = 0;	//extra speed because player is standing on top of somewhere
		this.moveyspeed = 0;
		this.flare = 0;			//bit
		this.trail = 0;
		this.fastfeet = 0;
		this.stoned = 0;
		this.stonedLen = 0;
		this.rush = 0;
	    this.swim = 0;
		this.nogun = false;
		this.phasercount = 0;
		this.extracounter = 0;	//extra pickups counter
		this.Quake = 0;			//common quake value
		this.QuakeX = 0;
		this.QuakeY = 0;
		this.viewstartx = 0;
		this.viewstarty = 0;
		this.oldviewstartx = 0;
		this.oldviewstarty = 0;
		this.viewshiftx = 0;
		this.viewshifty = 0;
		this.viewskipaverage = 0;
		this.Lighting = 0;
		this.Ambient = 0;
		this.AmbientBack = 0;
		this.AmbientDefault = 0;
		this.ShiftPositionX = 0;
		this.DeathSequence = 0;
		this.fixstartx = 0;		//for bosses (stop scrolling left)
		this.fixscrollx = 0;	//for bosses (stop scrolling left)
		this.localplayer = 0;	//number (number of subwindow), Word
		this.subwinx = 0;
		this.subwiny = 0;
		this.orgwinx = 0;
		this.orgwiny = 0;
		this.lapcounter = 0;
		this.lastlapfinish = 0;
		this.laptimes = new Uint32Array(5);
		this.finished = false;
		this.camera = 0;
		this.camera_x = 0;
		this.camera_y = 0;
		this.bossactive = 0;
		this.bossnumber = 0;
		this.FadeCounter = 0;
	//NETWORK STUFF
		this.NameCounter = 0;	//counter of name (double names in game)
		this.color = new Uint32Array(4);	//256:256:256:256 color (Word32)
		this.LastReceivedGameCounter = 0;	// Word
		this.CreateUIDCounter = 0;			// Word
		this.Team = 0;
		this.Flag = 0;
		this.LastSent = 0;					// Word
		this.Client = 0;
		this.ClientPlayer = 0;
		this.Active = false;
		//Tmovepacket MOVE;
		this.Cheater = 0;
		this.ErrorX = 0;
		this.ErrorY = 0;
		this.ErrorStep = 0;
	}

	return TPlayer;

});