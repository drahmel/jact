# Jact

## Implementing the good parts of React into a compact library that integrates with jQuery

I love React, but some projects it isn't the perfect fit. For example:

* Small JavaScript footprint -- Even compressed, React has a large base footprint (hundreds of K). Most React apps are much larger than an equivalent jQuery style app.
* Multiple 3rd Party libraries are used -- React doesn't play well with other libraries such as D3.js, Google Maps, or other libraries that make their own use of the DOM
* Compile is overkill -- Running a compiler for development requires a lot of resources compared to traditional JavaScript development
* In-place tweaks are required -- A traditional JavaScript app can be editied even on a NodeMCU-based web server

I decided to create a simple and ultra-compact (<2K) library that could give me some of the things I love about React within an easily deployable jQuery-compatible package.

# Project Objectives

* Create interactive "state" like React
* Allow changes in state values to update UI elements and other items
* Adopt the unidirectional data flow to minimize stale data

# What it won't do

* Replace React
* Implement a Virtual DOM
* Implement JSX

# Examples

Simply load the library into your page:

```javascript
<script src="js/Jact.js"></script>
```

Instantiate that object pass the initial state:

```javascript
<script>
var j = new Jact({name:"Joe"});
</script>
```

Then you can bind any handlers to changes in state:

```javascript
j.bindElement("name", function(newVal) { $("#mainHeader").html(newVal); });
```

Noticed that unlike React where you put the state changes in your render() function, for example, with Jact you simply use a closure to do whatever you want when the state changes. For example, you could have the state change update 4 different UI elements.

```javascript
j.bindElement("name", function(newVal) { $("#mainHeader").html(newVal); });
j.bindElement("name", function(newVal) { $("#welcomeMessage").html(newVal); });
j.bindElement("name", function(newVal) { $("#accountMenuTitle").html(newVal); });
```

Or:

```javascript
j.bindElement("name", function(newVal) {
    $("#mainHeader").html(newVal); });
    $("#welcomeMessage").html(newVal);
    $("#accountMenuTitle").html(newVal);
});
```

This is perfect for libraries like D3.js where changes in your data can call directly into your D3 object to propogate the changes to your graph.

Or you can use it for React-style handling of input boxes:

```javascript
$("#testIn").bind("keyup", function (event) {
    var name = j.getState("name");
    name += event.key;
    j.setState({name:name});
    return false;
});
```

