reqjs.define(function () {
	'use strict';
	
	return {
		include: function (obj) {
			//AiProcPtr ProcPtr;
			obj.xorg = 0;		// X Spawn position
			obj.yorg = 0;		// Y Spawn position
			obj.xpos = 0;		// X location
			obj.ypos = 0;		// Y location
			obj.xspeed = 0;		// x speed
			obj.yspeed = 0;		// y speed
			obj.xacc = 0;		// x acceleration
			obj.yacc = 0;		// y acceleration
			obj.counter = 0;	// increments each gametick (bullets)
			obj.curframe = 0;	// current frame (long)
			obj.age = 0;
			obj.creator = 0;	// Creator UID
			obj.curanim;		// short
			obj.loadanim;		// short
			obj.killanim;		// short
			obj.freeze = 0;		// Word8
			obj.lighttype = 0;	// Word8
			obj.phase = 0;		// char
			obj.nohit = 0;		// char
			obj.energy;			// Obj health (char)
			obj.light;			// char
			obj.objtype;		// Word8
			obj.state;			// Word8
			obj.points;			//or byte when divided by 100 (short)
			obj.load;			// Word8
			obj.direction;		//char:2 is enough (char)
			obj.justhit;		//Word8:3 is enough (Word8)
			obj.oldstate;		// Word8
		}
	};

});