function Unit(index) {
	var enigma = StandardEnigma();
	enigma.step(index * Math.floor(NUM_COMBINATIONS / NUM_UNITS));
	return {
		enigma: enigma,
		step: function() {
			this.enigma.step(1);
		},
	};
}

/*
var bombe = new Bombe;

const NUM_UNITS = 36;
const NUM_COMBINATIONS = 26 * 26 * 26;

function Bombe() {
	var units = [];
	for (var i = 0; i < NUM_UNITS; i++) {
		units.push(new Unit(i));
	}
	return {
		text: "",
		units: units,
		processing: false,
		step: function() {
			for (var i = 0; i < this.units.length; i++) {
				this.units[i].step();
			}
		},
		encrypt: function(msg) {
			if (!this.processing) {
				return "";
			}
			var index = Math.floor(Math.random() * NUM_UNITS);
			var m = this.units[index].enigma;
			var e = m.encrypt(msg);
			console.log(e.encrypted, e.text);
			return e.encrypted;
		},
		decrypt: function(msg, orig) {
			if (this.processing) {
				for (var i = 0; i < this.units.length; i++) {
					var m = clone(this.units[i].enigma);
					this.text = m.encrypt(msg);
					if (this.onDecrypting) {
						this.onDecrypting(this.text);
					}
					if (this.text.indexOf(orig) >= 0) {
						if (this.onDecrypted) {
							this.onDecrypted(this.text);
						}
						return;
					}
				}
				this.step();
				setTimeout(this.decrypt.bind(this, msg, orig), 16);
			}
		},
		start: function() {
			this.processing = true;
		},
		stop: function() {
			this.processing = false;
		},
	};
}
*/
