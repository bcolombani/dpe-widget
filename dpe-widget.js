/**
 * @class Widget for energy consumption / greenhouse gaz emition
 * @constructor
 * @param {HTMLElement} el the element that will contain the widget
 * @param {string} measureType 'ce' or 'dpe'
 * @param {string} propertyType for example 'logement'
 * @param {integer} initialValue initial value of the widget
 * @param {object} [options] may contain 'boundInputId', 'inputName' and 'readOnly'
 * @returns {DpeWidget}
 */
var DpeWidget = function(el, measureType, propertyType, initialValue, options) {
    options = options || {};
    this.$el = $(el);
    this.$el.data("DpeWidget", this);

    this.measureType = measureType || "ce";
    this.params = DpeWidget.params[measureType];

    /** @expose */
    var viewData = {
        /** @expose */
        measureType: measureType,
        /** @expose */
        propertyType: propertyType,
        /** @expose */
        values: this.params,
        /** @expose */
        inputId: options.inputId,
        /** @expose */
        inputName: options.inputName
    };
    var template = _.template(DpeWidget.template) ;
    this.$el.html(template(viewData));

    this.handle = this.$el.find(".dpe-selector");
    this.editValue = this.$el.find(".dpe-selector-input");
    
    if(options.readOnly !== true ) {
        this.handle.draggable({axis: "y"}).on("drag dragstop", $.proxy(this.onDrag, this));
        this.handle.css( 'cursor', 'move' );
        this.editValue.on("change", $.proxy(this.onValueEdited, this));
    } else {
        this.handle.css( 'cursor', 'auto' );
        this.editValue.attr('readonly', true);
    }    

    this.sticks = [];
    for (var stickIndex = 0; stickIndex < this.params.length; stickIndex++) {
        this.sticks[stickIndex] = this.$el.find(".dpe-" + measureType + "-stick-" + this.params[stickIndex].letter);
    }

    this.propertyCaption = this.$el.find(".dpe-caption-property");

    var middleStick = this.params[Math.round(this.params.length / 2) - 1];
    initialValue = (initialValue !== null && initialValue !== undefined) ? initialValue : (middleStick.max + middleStick.min) / 2;
    this.val(initialValue);

    if (options.boundInputId) this.bindToInput(options.boundInputId);
};

DpeWidget.params = {
    /** @expose */
    ce: [
        {min: 0, max: 50, /** @expose */ letter: 'A'},
        {min: 51, max: 90, letter: 'B'},
        {min: 91, max: 150, letter: 'C'},
        {min: 151, max: 230, letter: 'D'},
        {min: 231, max: 330, letter: 'E'},
        {min: 331, max: 450, letter: 'F'},
        {min: 451, max: 590, letter: 'G'}
    ],
    /** @expose */
    ges: [
        {min: 0, max: 5, letter: 'A'},
        {min: 6, max: 10, letter: 'B'},
        {min: 11, max: 20, letter: 'C'},
        {min: 21, max: 35, letter: 'D'},
        {min: 36, max: 55, letter: 'E'},
        {min: 56, max: 80, letter: 'F'},
        {min: 81, max: 110, letter: 'G'}
    ]
};

DpeWidget.template = ' \
<div class="dpe-input"> \
<div class="dpe-stick-container"> \
<span class="dpe-caption"> \
<% if(measureType === "ce") { %> \
<%= (propertyType.charAt(0).toUpperCase() + propertyType.substring(1)) %> &eacute;conome \
<% } else { %> \
Faible &eacute;mission de GES \
<% } %> \
</span> \
<% _.each(values, function(value, index) { %> \
<div class="dpe-<%= measureType %>-stick dpe-<%= measureType %>-stick-<%= value.letter %>"> \
<span class="dpe-<%= measureType %>-stick-range"> \
<% if(index === 0) { %> \
&#8804; <%= value.max %> \
<% } else if(index === (values.length-1)) { %> \
&gt; <%= value.min - 1 %> \
<% } else { %> \
<%= value.min %> &agrave <%= value.max %> \
<% } %> \
</span> \
<span class="dpe-<%= measureType %>-stick-letter"><%= value.letter %></span> \
</div> \
<% }) %> \
<span class="dpe-caption"> \
<% if(measureType === "ce") { %> \
<%= (propertyType.charAt(0).toUpperCase() + propertyType.substring(1)) %> &eacute;nergivore \
<% } else { %> \
Forte &eacute;mission de GES \
<% } %> \
</span> \
</div> \
<div class="dpe-selector-container"> \
<div class="dpe-caption dpe-caption-property">Ce <%= propertyType %></div> \
<div class="dpe-selector"> \
<div class="dpe-selector-value"> \
<input <%= (inputId) ? "id=\'" + inputId + "\'" : "" %> <%= (inputName) ? "name=\'" + inputName + "\'" : "" %> class="dpe-selector-input" type="text"></input> \
</div> \
<div class="dpe-selector-unit"> \
<% if(measureType === "ce" ) { %>kWh<sub>EP</sub>/m<sup>2</sup>.an<% } else { %>kg<sub>eqCO2</sub>/m<sup>2</sup>.an<% } %> \
</div> \
</div> \
</div> \
</div>';

DpeWidget.prototype = {
    bindToInput: function(inputId) {
        var thisWidget = this;
        var boundInput = $('#' + inputId);
        if (boundInput.length) {
            boundInput.on('change', function() {
                var value = thisWidget.val(boundInput.val());
                boundInput.val(value);
                thisWidget.$el.trigger("dpechange", [this.value]);
            });
            this.$el.on('dpechange', function() {
                boundInput.val(thisWidget.val());
            });
            boundInput.val(this.value);
        }
    },
    onDrag: function(event, ui) {
        var cancelDrag = false;

        this.value = this.offsetToValue(ui.offset.top);

        if (this.value < this.params[0].min) {
            this.value = this.params[0].min;
            cancelDrag = true;
        } else if (this.value > this.params[this.params.length - 1].max) {
            this.value = this.params[this.params.length - 1].max;
            cancelDrag = true;
        }

        if (cancelDrag || event.type === "dragstop") {
            this.displayPointerAt(this.value);
            this.updateCaptionOffset();
        } else {
            this.updateCaptionOffset(ui.offset.top);
        }

        this.editValue.val(this.value);
        this.$el.trigger("dpechange", [this.value]);

        return !cancelDrag || event.type === "dragstop";
    },
    onValueEdited: function() {
        var newVal = this.parse(this.editValue.val());
        if (newVal !== false) {
            this.value = newVal;
            this.displayPointerAt(this.value);
            this.updateCaptionOffset();
            this.$el.trigger("dpechange", [this.value]);
        } else {
            this.editValue.val(this.value);
        }
    },
    displayPointerAt: function(value) {
        this.handle.offset({top: this.valueToOffset(value)});
    },
    valueToOffset: function(value) {
        var stickFound = false;
        var stickIndex;
        var valueRatioInStick;
        for (stickIndex in this.params) {
            if ((value <= this.params[stickIndex].max) && (value >= this.params[stickIndex].min)) {
                stickFound = true;
                break;
            }
        }
        if (stickFound) {
            valueRatioInStick = (value - this.params[stickIndex].min) / (this.params[stickIndex].max - this.params[stickIndex].min);
        } else {
            stickIndex = this.params.length - 1;
            valueRatioInStick = 1.0;
        }
        var pointerOffset = (this.sticks[stickIndex].offset().top + (this.sticks[stickIndex].outerHeight() - 2) * valueRatioInStick) - (this.handle.outerHeight() / 2 - 1);

        return pointerOffset;
    },
    offsetToValue: function(offset) {
        var value;
        var pointerOffsetInHandle = this.handle.outerHeight() / 2 - 1;
        var pointerOffset = offset + pointerOffsetInHandle;
        var min = this.sticks[0].offset().top;
        var max = this.sticks[this.sticks.length - 1].offset().top + this.sticks[this.sticks.length - 1].outerHeight() - 2;

        if (pointerOffset < min) {
            value = -1;
        } else if (pointerOffset > max) {
            value = this.params[this.params.length - 1].max + 1;
        } else {
            var pointedStickIndex = this.sticks.length - 1;
            for (var stickIndex = 1; stickIndex < this.sticks.length; stickIndex++) {
                if (this.sticks[stickIndex].offset().top > pointerOffset) {
                    pointedStickIndex = stickIndex - 1;
                    break;
                }
            }
            var pointedStickHeight = this.sticks[pointedStickIndex].outerHeight();
            var pointedStickOffset = this.sticks[pointedStickIndex].offset().top;
            var offsetRatioInStick = (pointerOffset - pointedStickOffset) / (pointedStickHeight - 2);
            if (offsetRatioInStick >= 1) {
                offsetRatioInStick = 1;
            }
            value = Math.round((this.params[pointedStickIndex].max - this.params[pointedStickIndex].min) * offsetRatioInStick + this.params[pointedStickIndex].min);
        }

        return value;
    },
    updateCaptionOffset: function() {
        var handleOffset = (arguments.length) ? arguments[0] : this.handle.offset().top;
        var min = this.sticks[0].offset().top;

        if (handleOffset < min) {
            this.propertyCaption.offset({top: handleOffset - this.propertyCaption.height()});
        } else {
            this.propertyCaption.css({top: 0});
        }
    },
    val: function() {
        if (arguments.length > 0) {
            var newValue = this.parse(arguments[0]);
            if (newValue !== false) {
                this.value = newValue;
                this.editValue.val(newValue);
                this.displayPointerAt(newValue);
                this.updateCaptionOffset();
            }
        }
        return this.value;
    },
    parse: function(inputValue) {
        var finalValue = (typeof inputValue === 'integer') ? inputValue : parseInt(inputValue, 10);
        if (isNaN(finalValue) || finalValue < 0) {
            finalValue = false;
        }
        return finalValue;
    }
};


(function($) {
    $.fn['dpeWidget'] = function(measureType, propertyType, initialValue, options) {
        return this.each(function() {
            (new DpeWidget(this, measureType, propertyType, initialValue, options));
        });
    };
})(jQuery);
