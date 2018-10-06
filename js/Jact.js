'use strict';

function Jact(initialState) {
	this.state = initialState || {};
	this.stateBindings = {};
	this.components = {};
}

Jact.prototype.setState = function(newState) {
	//console.log("Set state", newState);
	for(var idx in newState) {
		var obj = newState[idx];
		if(idx in this.state) {
			//console.log("Exists", idx);
			if(idx in this.stateBindings) {
				var selectors = this.stateBindings[idx];
				for(var sIdx in selectors) {
					//console.log(selectors[sIdx]);
					selectors[sIdx]["func"](obj);
				}
			}
			this.state[idx] = newState[idx];
		} else {
			//console.log("New", idx);
			this.state[idx] = newState[idx];
		}
	}
}

Jact.prototype.getState = function(path) {
	return this.state[path];
}

Jact.prototype.bindChange = function(stateIdx, func, name) {
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

Jact.prototype.bindHtml = function(stateIdx, selectorArray) {
	for(var idx in selectorArray) {
		var selector = selectorArray[idx];
		this.bindChange(stateIdx, function(newVal) { $(selector).html(newVal); });
	}
}

Jact.prototype.bindVal = function(stateIdx, selectorArray) {
	for(var idx in selectorArray) {
		var selector = selectorArray[idx];
		this.bindChange(stateIdx, function(newVal) { $(selector).val(newVal); });
	}
}

Jact.prototype.bindKeyUp = function(stateIdx, selectorArray) {
	for(var idx in selectorArray) {
		var selector = selectorArray[idx];
		$(selector).bind("keyup", function (event) {
			console.log(event, j.getState(stateIdx));
			var b = j.getState(stateIdx);
			if(event.keyCode != 8) {
				b += event.key;
			} else {
				b += "BS";
			}
			var obj = {};
			obj[stateIdx] = b;
			j.setState(obj);
			return false;
		});
	}
}

// Example usage: j.appendComponent("components/card", "#cards-container")
Jact.prototype.loadComponent = function(componentName, statePrefix, callback) {
	var _self = this;
	statePrefix = (statePrefix || "first") + "_";
	if(!(componentName in _self.components)) {
		var response;
		$.ajax({
			type: "GET",
			url: "/jcomponents/" + componentName,
			async: false,
			success : function(text) {
				response = text;
			}
		});
		_self.components[componentName] = response;

		// TODO: Scan for subcomponents and add them, too
	}
	// Get component HTML
	var componentHtml = _self.components[componentName];
	if(callback) {
		return callback(componentHtml);
	} else {
		return componentHtml;
	}
}

Jact.prototype.loadComponents = function(componentNames) {
	var components = [];
	for(var idx in componentNames) {
		components.push(this.loadComponent(componentNames[idx]));
	}
	return components;
};

// Example usage: j.appendComponent("components/card", "#cards-container")
Jact.prototype.addComponent = function(componentName, selector, statePrefix) {
	var componentHtml = this.loadComponent(componentName);
	// Bind state events to component instance
	// Add component to DOM
	return $(selector).html(componentHtml);
}

Jact.prototype.appendComponent = function(componentName, selector, data) {
	var component = $(this.loadComponent(componentName));
	for(var idx in data) {
		component.find("[data-html-"+idx+"]").html(data[idx]);

		// Inject values if attributes are requested
		var attrName = "[data-attr-"+idx+"]";
		var attr = component.find(attrName);
		// Fix so attribute can be on component or children (only available on children right now)
		if(attr.length > 0) {
			//console.log("Inject FOUND", "[data-attr-"+idx+"]");
			attr.each(function () {
				//console.log("BIND ATTR", componentName, idx, attr, data[idx]);
				$(this).attr(idx, data[idx]);
			});
		}
	}
	// Bind state events to component instance
	// Add component to DOM
	return component.appendTo(selector);
}