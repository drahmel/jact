'use strict';

function Jact() {
	this.state = {};
	this.stateBindings = {};
}

Jact.prototype.setState = function(newState) {
	console.log("Set state", newState);
	for(var idx in newState) {
		var obj = newState[idx];
		if(idx in this.state) {
			console.log("Exists", idx);
			if(idx in this.stateBindings) {
				var selectors = this.stateBindings[idx];
				for(var sIdx in selectors) {
					//console.log(selectors[sIdx]);
					selectors[sIdx]["func"](obj);
				}
			}
			this.state[idx] = newState[idx];
		} else {
			console.log("New", idx);
			this.state[idx] = newState[idx];
		}
	}
}

Jact.prototype.getState = function(path) {
	return this.state[path];
}

Jact.prototype.bindElement = function(stateIdx, func, name) {
	// If state var doesn't exist yet, create it as a string
	if(!(stateIdx in this.state)) {
		this.state[stateIdx] = "";
	}
	// If nothing is bound to the state, create an array for bindings
	if(!(stateIdx in this.stateBindings)) {
		this.stateBindings[stateIdx] = [];
	}
	// If a name wasn't supplied (for late unbinding), create a random one
	if(!name) {
		name = 'b:' + Math.floor(Math.random() * 100000);
	}
	this.stateBindings[stateIdx].push({name:name, func:func});
}