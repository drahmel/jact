# jact
jQuery React -- implementing the good parts of React into a compact jQuery library

I love React, but some projects it isn't the perfect fit. For example:

* When a small footprint is required -- Even compressed, React has a large base footprint. Most React apps are much larger than an equivalent jQuery style app.
* Compiler is overkill
* In-place tweaks are required
* Multiple 3rd Party libraries are used -- React doesn't play well with other libraries such as D3.js, Google Maps, or other libraries that make their own use of the DOM

I decided to create a simple and ultra-compact library that could give me some of the things I love about React within an easily deployable jQuery-compatible package.

# Project Objectives

* Create state like React

# What it won't do

* Replace for React
* Implement JSX

# Examples

```javascript
  <script src="js/Jact.js"></script>
  <script>
  var j = new Jact();
  j.bindElement("a", function(newVal) { $("#mainHeader").html(newVal); });
  j.bindElement("b", function(newVal) { $("#testIn").val(newVal); });
  j.setState({a:"Hello"});
  $("#testIn").bind("keyup", function (event) {
    console.log(event, j.getState("b"));
    var b = j.getState("b");
    if(event.keyCode != 8) {
      b += event.key;
    } else {
      b += "BS";
    }
    j.setState({b:b});
    return false;
  });
  </script>
```

