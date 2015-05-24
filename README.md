# dpe-widget
Dynamic editable energy consumption / green house gaz emition for french real estate listings rendered in css

# Dependencies
Needs jquery (selectors), jquery-ui (dragable), underscore (template)

# Usage
Include dpe-widget.js and dpe-widget.css in your web project.

The wigdet is invoked as a jquery plugin on a DOM element with the following parameters :
* __measureType__ : 'ce' for an energy consumption diagram, 'ges' for a greenhouse gaz emition diagram
* __propertyType__ : free text, should be 'logement' or 'b&acirc;timent'
* __initialValue__ : set the initial value for the energy consumption or the greenhouse gaz emition
* __options__ may contain :
  * _boundInputId_ : give an input element id to bound the value of the widget to this element, it will be refreshed as the widget is modified
  * _inputName_ : if you want to use a custom name for the floating input of the widget
  * _readOnly_ : set to true to have a read-only widget

See example.html for usage