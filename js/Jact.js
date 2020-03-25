'use strict';

function Jact(initialState) {
  this.state = initialState || {};
  this.stateBindings = {};
  this.components = {};
}

Jact.prototype.setState = function(newState, callback, invisibleUpdate) {
  if(typeof newState != "object") {
      console.log("!!!ERROR new state must be an object. Currently: ", newState);
  }
  //console.log("Set state", newState);
  for(var idx in newState) {
    var obj = newState[idx];
    if(idx in this.state) {
      //console.log("Exists", idx);
      if(!invisibleUpdate && idx in this.stateBindings) {
        var selectors = this.stateBindings[idx];
        for(var sIdx in selectors) {
          //console.log(selectors[sIdx]);
          selectors[sIdx]["func"](obj, idx);
        }
      }
      this.state[idx] = newState[idx];
    } else {
      //console.log("New", idx);
      this.state[idx] = newState[idx];
    }
  }

  if(Utils.getCookie("debugbar") && this.debugbar) {
      var stateStr = this.stringifyOnce(this.state, null, 2);
      this.debugbar.find("#debugbar-body").text(stateStr);
  }
  if(callback) {
      return callback();
  }
}

Jact.prototype.activateDebugbar = function(path) {
    Utils.setCookie("debugbar", 11);
}

Jact.prototype.deactivateDebugbar = function(path) {
    Utils.deleteCookie("debugbar");
}

Jact.prototype.getState = function(path) {
  //console.log("State", this.state);
  if(!path) {
    return this.state;
  } else {
    return this.state[path];
  }
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
  if(typeof selectorArray == "string") {
    selectorArray = [selectorArray];
  }
  for(var idx in selectorArray) {
    var selector = selectorArray[idx];
    this.bindChange(stateIdx, function(newVal) { $(selector).html(newVal); });
  }
}

Jact.prototype.bindAttr = function(stateIdx, selectorArray, boundAttr) {
  if(typeof selectorArray == "string") {
    selectorArray = [selectorArray];
  }
  for(var idx in selectorArray) {
    var selector = selectorArray[idx];
    this.bindChange(stateIdx, function(newVal) { $(selector).attr(boundAttr, newVal); });
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
Jact.prototype.loadComponent = function(componentName, statePrefix, callback, forceUpdate) {
  var _self = this;
  statePrefix = (statePrefix || "first") + "_";
  var version = true ? Math.random() : 3;
  if(!(componentName in _self.components)) {
    var response;
    $.ajax({
      type: "GET",
      url: "/jcomponents/" + componentName + "?v=" + version,
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

Jact.prototype.createComponent = function(componentName, componentHtml) {
    this.components[componentName] = componentHtml;
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
  if(component) {
    for(var idx in data) {
      // Remove non-alphanumeric for HTML attributes
      var friendlyIdx = idx.replace(/[^A-Za-z0-9]/g, "_");
      component.find("[data-html-"+friendlyIdx+"]").html(data[idx]);
      component.find("[data-val-"+friendlyIdx+"]").val(data[idx]);

      // Inject values if attributes are requested
      var attrName = "[data-attr-"+friendlyIdx+"]";
      var attr = component.find(attrName);
      // Fix so attribute can be on component or children (only available on children right now)
      if(attr.length > 0) {
        //console.log("Inject FOUND", "[data-attr-"+idx+"]");
        attr.each(function () {
          //console.log("BIND ATTR", componentName, idx, attr, data[idx]);
          $(this).attr(friendlyIdx, data[idx]);
        });
      }
    }
    component.find("[data-field]").each(function(idx, o) {
        var el = $(o);
        var field = el.attr("data-field");
        if(field in data)  {
            if(el.is("textarea") || el.is("pre") || el.is("div") || el.is("span")) {
              el.text(data[field]);
            } else {
              el.val(data[field]);
            }
        }
    });
    var ts = new Date().getTime();
    var rand = Math.floor(Math.random() * Math.floor(ts));
    component.attr("data-component-id", ts + "|" +  rand);
    component.addClass(componentName.replace(/\./g, "_"));
    // Bind state events to component instance
    // Add component to DOM
    return component.appendTo(selector);
  } else {
    return false;
  }
}

Jact.prototype.serializeComponent = function(componentEl, includeEmptyFields) {
    var items = $(componentEl).find("[data-field]");
    var modalData = {};
    items.each(function (idx, o) {
      var subel = $(o);
      var field = subel.attr("data-field");
      if(includeEmptyFields) {
          modalData[field] = "";
      }
      if(subel.val() && subel.val().length > 0) {
        modalData[field] = subel.val();
      } else if(subel.is("textarea")) {
        modalData[field] = subel.text();
      }

    });
    return modalData;
}

Jact.prototype.unserializeComponent = function(componentEl, modalData) {
    var items = $(componentEl).find("[data-field]");
    items.each(function (idx, o) {
      var subel = $(o);
      var field = subel.attr("data-field");
      if(field in modalData) {
        if(subel.is("textarea") || subel.is("pre") || subel.is("div") || subel.is("span")  || subel.is("h1")  || subel.is("h2")) {
          subel.html(modalData[field]);
        } else {
          subel.val(modalData[field]);
        }
      } else {
        // If no match, clear value
        subel.val("")
      }

    });
}

Jact.prototype.populateComponent = function(componentEl, data) {
    var items = $(componentEl).find("[data-field]");
    items.each(function (idx, o) {
      var subel = $(o);
      var field = subel.attr("data-field");
      console.log(subel, field);
      if(field in data) {
          if(subel.is("textarea")) {
            subel.text(data[field]);
          } else {
            subel.val(data[field]);
          }
      }

    });
}

Jact.prototype.clearComponent = function(componentEl) {
    var items = $(componentEl).find("[data-field]");
    items.each(function (idx, o) {
      var subel = $(o);
      var field = subel.attr("data-field");
      if(subel.is("textarea")) {
        subel.text("");
      } else {
        subel.val("");
      }

    });
}

Jact.prototype.empty = function(obj) {
  if(!obj) {
    return true;
  } else if(typeof obj == "string" && obj.length < 1) {
    return true;
  } else {
    return false;
  }
}

Jact.prototype.get = function(obj, path, defaultVal) {
    defaultVal = (defaultVal === undefined) ? "" : defaultVal;
  if(!obj) {
    return defaultVal;
  } else if(object[path] === undefined) {
    return defaultVal;
  } else {
    return object[path];
  }
}

Jact.prototype.addDebugbar = function(componentEl) {
    if(Utils.getCookie("debugbar")) {
        console.log("Adding debugbar");
        var db = $(componentEl).show();
        var debugbarHtml = '<div id="debugbar-container col-sm" onclick="this.expand = !this.expand;if(this.expand) { $(this).css(\'height\', \'\') } else { $(this).css(\'height\', \'100px\'); };return false;" style="height:100px;overflow:hidden;background:lightyellow;border:2px solid grey;padding:4px;font-size:12px;"> <div id="debugbar-title"> Debug </div> <pre id="debugbar-body"> </pre> </div>';
        db.html(debugbarHtml);
        this.debugbar = db;
    }
}

Jact.prototype.stringifyOnce= function(obj, replacer, indent) {
    var printedObjects = [];
    var printedObjectKeys = [];

    function printOnceReplacer(key, value){
        var printedObjIndex = false;
        printedObjects.forEach(function(obj, index){
            if(obj===value){
                printedObjIndex = index;
            }
        });

        if(printedObjIndex && typeof(value)=="object" && value){
            return "(see " + value.constructor.name.toLowerCase() + " with key " + printedObjectKeys[printedObjIndex] + ")";
        }else{
            var qualifiedKey = key || "(empty key)";
            printedObjects.push(value);
            printedObjectKeys.push(qualifiedKey);
            if(replacer){
                return replacer(key, value);
            }else{
                return value;
            }
        }
    }
    return JSON.stringify(obj, printOnceReplacer, indent);
}

window.j = new Jact();
