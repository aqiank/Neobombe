"use strict";

const
	RotorI = 0,
	RotorII = 1,
	RotorIII = 2;

const
	ReflectorA = 0,
	ReflectorB = 1,
	ReflectorC = 2;

const rotorCharMap = [
	"EKMFLGDQVZNTOWYHXUSPAIBRCJ",
	"AJDKSIRUXBLHWTMCQGZNPYFVOE",
	"BDFHJLCPRTXVZNYEIWGAKMUSQO",
];

const reflectorCharMap = [
	"EJMZALYXVBWFCRQUONTSPIKHGD",
	"YRUHQSLDPXNGOKMIEBFZCWVJAT",
	"FVPJIAOYEDRZXWGCTKUQSBNMHL",
];

const notch = [
	"Q",
	"E",
	"V",
];

const 
	ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	NUM_ALPHABETS = 26;

function Plugboard(charMap) {
	charMap = typeof charMap == "undefined" ? ALPHABETS : charMap;
	return {
		charMap: charMap,
		processChar: function(ci, reflecting) {
			var c = this.charMap[ci];
			return {idx: ALPHABETS.indexOf(c), reflecting: reflecting};
		},
		step: function(n) {
			return n;
		},
	};
}

function Rotor(type) {
	type = typeof type == "undefined" ? RotorI : type;
	return {
		type: type,
		offset: 0,
		processChar: function(ci, reflecting) {
			if (reflecting) {
				var idx = (ci + this.offset) % NUM_ALPHABETS;
				var lc = ALPHABETS[idx];
				var ri = rotorCharMap[this.type].indexOf(lc);
				ri -= this.offset;
				if (ri < 0) {
					ri += NUM_ALPHABETS;
				} else {
					ri %= NUM_ALPHABETS;
				}
				return {idx: ri, reflecting: reflecting};
			} else {
				var idx = (ci + this.offset) % NUM_ALPHABETS;
				var rc = rotorCharMap[this.type][idx];
				var li = ALPHABETS.indexOf(rc);
				li -= this.offset;
				if (li < 0) {
					li += NUM_ALPHABETS;
				} else {
					li %= NUM_ALPHABETS;
				}
				return {idx: li, reflecting: reflecting};
			}
		},
		step: function(n) {
			var revs = this.countNotchRevs(n);
			this.offset = (this.offset + n) % NUM_ALPHABETS;
			return revs;
		},
		countNotchRevs: function(steps) {
			// Return 0 if it is determined that the notch won't be reached in the steps
			var nch = notch[this.type].charCodeAt(0) - 65;
			if (this.offset > nch && steps < nch + (NUM_ALPHABETS - nch)) {
				return 0;
			}
			return this.reallyCountNotchRevs(nch, NUM_ALPHABETS, steps);
		},
		reallyCountNotchRevs: function(notch, max, steps) {
			var revs = 0;
			steps -= notch - this.offset;
			if (steps > 0) {
				revs++;
			}
			revs += Math.floor(steps / max);
			return revs;
		},
	};
}

function Reflector(type) {
	type = typeof type == "undefined" ? ReflectorA : type;
	return {
		type: type,
		charMap: reflectorCharMap[type],
		processChar: function(ci, reflecting) {
			var c = reflectorCharMap[this.type][ci];
			return {idx: ALPHABETS.indexOf(c), reflecting: !reflecting};
		},
		step: function(n) {
			return n;
		},
	};
}

function Enigma(comps) {
	comps = typeof comps == "undefined" ? [] : comps;
	return {
		components: comps,
		connect: function(comps) {
			this.components.concat(comps);
		},
		encrypt: function(msg) {
			var text = this.sanitize(msg);
			var etext = "";
			for (let c of text) {
				etext = etext.concat(this.encryptChar(c.charCodeAt(0)));
			}
			return {encrypted: etext, original: text};
		},
		encryptChar: function(c) {
			this.step(1);

			var ci = c - 65;
			var reflecting = false;
			for (var i = 0; i < this.components.length; i++) {
				var ret = this.components[i].processChar(ci, reflecting);
				ci = ret.idx;
				reflecting = ret.reflecting;
				if (reflecting) {
					break;
				}
			}

			if (reflecting) {
				for (var i = this.components.length - 2; i >= 0; i--) {
					var ret = this.components[i].processChar(ci, reflecting);
					ci = ret.idx;
				}
			}

			return String.fromCharCode(ci + 65);
		},
		step: function(steps) {
			if (steps <= 0) {
				return;
			}

			for (var comp of this.components) {
				steps = comp.step(steps)
				if (steps <= 0) {
					break;
				}
			}
		},
		sanitize: function(s) {
			s = s.trim();
			s = s.toUpperCase();
			for (var i = 0; i < s.length; i++) {
				var cc = s[i].charCodeAt(0);
				if (cc < 65 || cc > 90) {
					s = s.slice(0, i) + s.slice(i + 1);
					i--;
				}
			}
			return s;
		},
	};
}

function StandardEnigma() {
	return new Enigma([
		new Plugboard(),
		new Rotor(RotorIII),
		new Rotor(RotorII),
		new Rotor(RotorI),
		new Reflector(ReflectorB),
	]);
}
