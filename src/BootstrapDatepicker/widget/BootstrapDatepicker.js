// BEGIN CODE BootstrapDatepicker.widget.BootstrapDatepicker
/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console */
/*mendix */
/*
    BootstrapDatepicker
    ========================

    @file         : BootstrapDatepicker.js
    @version      : 1.2.0
    @author       : Chris de Gelder
	@contributors : Roy van der Valk
    @date         : 05-04-2017
    @copyright    : Chris de Gelder
    @license      : Apache 2
	based on https://uxsolutions.github.io/bootstrap-datepicker/
*/
mxui.dom.addCss(require.toUrl("BootstrapDatepicker", "../css/datepicker.css"));
mxui.dom.addCss(require.toUrl("BootstrapDatepicker", "../css/datepicker3.css"));
// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
require({
    packages: [{ name: 'jquery', location: '../../widgets/BootstrapDatepicker/lib', main: 'jquery-1.11.2.min' },
	           { name: 'btdatepicker', location: '../../widgets/BootstrapDatepicker/lib', main: 'bootstrap-datepicker' },
	           { name: 'dpengb', location: '../../widgets/BootstrapDatepicker/lib/locales', main: 'bootstrap-datepicker.en-GB' },
	           { name: 'dpnl', location: '../../widgets/BootstrapDatepicker/lib/locales', main: 'bootstrap-datepicker.nl' },
	           { name: 'dpde', location: '../../widgets/BootstrapDatepicker/lib/locales', main: 'bootstrap-datepicker.de' },
	           { name: 'dpfr', location: '../../widgets/BootstrapDatepicker/lib/locales', main: 'bootstrap-datepicker.fr' }
			   ]
}, [
    'dojo/_base/declare', 
	'mxui/widget/_WidgetBase', 
	'dijit/_TemplatedMixin',
    'mxui/dom', 
	'dojo/dom', 
	'dojo/query', 
	'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/text',
	'dojo/_base/kernel',
    'jquery', 'dojo/text!BootstrapDatepicker/widget/template/BootstrapDatepicker.html', 'btdatepicker', 'dpengb', 'dpde', 'dpfr', 'dpnl', 'dpde'
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, lang, text, kernel, $, widgetTemplate, btdatepicker, dpengb, dpfr, dpnl, dpde) {
    'use strict';
    
    // Declare widget's prototype.
    return declare('BootstrapDatepicker.widget.BootstrapDatepicker', [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: [],
        _contextObj: null,
		selector: '',
		enabled: true,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
			var id = this.id + "_cal";
            var div = dom.create('div' , { 'id' : id } );
			this.domNode.appendChild(div);
			this.selector = '#' + id + ' input';
			if (this.displaytype=="range" && (this.dateattrto==null || this.dateattrto==undefined || this.dateattr==this.dateattrto)) {
				this.displaytype = "textinput";
				console.log("range without second date attribute provided: fallback to text input");
			}
			var ro = this.readonly?{ readonly : 'true'}:{};
			switch (this.displaytype) { 
				case "textinput": 
					this.selector = '#' + id + ' input';
					div.appendChild(dom.create('input', $.extend({ 'class': 'form-control', 'type': 'text'}, ro)));
					break;
				case "component": 
					this.selector = '#' + id + ' .input-group.date';
					var groupdiv = div.appendChild(dom.create('div', { 'class': 'input-group date' }));
					groupdiv.appendChild(dom.create('input', $.extend({ 'class': 'form-control', 'type': 'text'}, ro)));
					var span = dom.create('span', { 'class': 'input-group-addon' });
					groupdiv.appendChild(span);
					span.appendChild(dom.create('i', { 'class': 'glyphicon glyphicon-calendar' }));
					break;
				case "embedded": 
					this.selector = '#' + id + ' .embedded';
					div.appendChild(dom.create('div', { 'class': 'embedded' }));
					break;
				case "range": 
					this.selector = '#' + id + ' .input-daterange';
					var rangediv = div.appendChild(dom.create('div', { 'class': 'input-daterange input-group', 'id' : 'datepicker' }));
					rangediv.appendChild(dom.create('input', $.extend({ 'class': 'input-sm form-control', 'type': 'text', 'name': 'start', 'id': 'startTime' }, ro)));
					rangediv.appendChild(dom.create('span', { 'class': 'input-group-addon' }, this.totext||"To"));
					rangediv.appendChild(dom.create('input', $.extend({ 'class': 'input-sm form-control', 'type': 'text', 'name': 'end', 'id' : 'endTime' }, ro)));
					break;
			}
			var locale = this.getLocale();
			$(this.selector).datepicker({
				format: this.accuracy=="months"?"mm-yyyy":(this.accuracy=="years"?"yyyy":"dd-mm-yyyy"),
				startView: this.accuracy=="months"?1:(this.accuracy=="years"?2:0),
				minViewMode: this.accuracy=="months"?1:(this.accuracy=="years"?2:0),
				language: locale,
				calendarWeeks: this.calendarweeks,
				weekStart: this.weekstart,
				todayBtn: this.todaybutton==true?"Linked":false,
				clearBtn: this.clearbutton,
				autoclose: this.autoclose,
				daysOfWeekDisabled: this.daysofweekdisabled,
				todayHighlight: this.todayhighlight,
				startDate: this.limitstart,
				endDate: this.limitend,
				enableOnReadonly: false
			})     
			.on('changeDate', dojo.hitch(this, this.dateChanged));
        },
		getLocale: function() {
			if (kernel) {
				return kernel.locale;
			} 
			return mx.ui.getLocale();
		},
		dateChanged: function (ev) {
			var obj = this._contextObj;
			var d = new Date(ev.date);
			if (obj && ev.type=="changeDate" && ev.date && (!isNaN(d.getTime())) && (d.getYear()>0)) {
				ev.date.setHours(this.defaulthours);
				// second field for range?
				if(ev.target.attributes.name && ev.target.attributes.name.value=="end" && this.dateattrto) {
					//only call when date has changed
					if( obj.get(this.dateattrto).valueOf() != d.valueOf() ) {
						obj.set(this.dateattrto, ev.date);
						this._execMf(this.mfToExecute, obj.getGuid());
					}
				} else {
					//only call when date has changed
					if( obj.get(this.dateattr).valueOf() != d.valueOf() ) {
						obj.set(this.dateattr, ev.date);
						this._execMf(this.mfToExecute, obj.getGuid());
					}
				}
			}
		},
		
		_execMf: function (mf, guid, cb) {
			logger.debug(this.id + "._execMf");
			if (mf && guid) {
				mx.ui.action(mf, {
					progress: this.mfProgressBar,
					progressMsg: this.mfProgressMsg,
                    params: {
                        applyto: "selection",
                        guids: [guid]
                    },
					store: {
						caller: this.mxform
					},
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
				}, this);
			}
		},
		update: function (obj, callback) {

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(obj);
			
            if (callback) {
				callback();
			}
        },

        _updateRendering: function () {
            var obj = this._contextObj;
			var date1 = obj.get(this.dateattr);
			var enabled = true;
			if (this.editableattr) {
				enabled = obj.get(this.editableattr); 
			}
			if (enabled) {
				this.enable();
			} else {
				this.disable();
			}
			if (this.displaytype=="range" && this.dateattrto) {
				// undocumented feature to set start end: https://groups.google.com/forum/#!msg/bootstrap-datepicker/9q5n35QCpgg/sznmzU7-yaYJ
				if (date1) {
					$(this.selector).find('#startTime').datepicker('update', new Date(date1)); 
				}
				var date2 = obj.get(this.dateattrto);
				if (date2) {
					$(this.selector).find('#endTime').datepicker('update', new Date(obj.get(this.dateattrto))); 
				}
				$(this.selector).data('datepicker').updateDates();				
			} else {
				if (date1) {
					$(this.selector).datepicker('setDate', new Date(obj.get(this.dateattr)));
				}
			}
			this._clearValidations();
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
			if (!this.readonly) {
				this.enabled = true;
				$(this.selector).removeAttr("readonly");
				$(this.selector).add("readonly");
				domClass.remove(this.domNode, "btdatepicker-disabled");
			}
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
			this.enabled = false;
			$(this.selector).attr("readonly", "true");
			domClass.add(this.domNode, "btdatepicker-disabled");
			
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
			if(this._handles){
				this._handles.forEach(function (handle, i) {
					mx.data.unsubscribe(handle);
				});
			}
		},
		
		_handleValidation: function(validations) {
			this._clearValidations();
			
			var val = validations[0];
			var msg = val.getReasonByAttribute(this.dateattr);    

			if(this.readOnly){
				val.removeAttribute(this.dateattr);
			} else {                                
				if (msg) {
					this._addValidation(msg);
					val.removeAttribute(this.dateattr);
				}
			}
		},
		
		_clearValidations: function() {
			domConstruct.destroy(this._alertdiv);
		},
		
		_addValidation : function(msg) {
			this._alertdiv = domConstruct.create("div", { 
				'class' : 'alert alert-danger',
				innerHTML: msg });
			
			this.domNode.appendChild(this._alertdiv);
			
		},		
		
       _resetSubscriptions: function () {
			var objHandle = null, 
				attrHandle = null, 
				validationHandle = null,
				attrHandle2 = null;
			
			// Release handles on previous object, if any.
			if(this._handles){
				this._handles.forEach(function (handle, i) {
					mx.data.unsubscribe(handle);
				});
			}

            if (this._contextObj) {
				objHandle = this.subscribe({
					guid: this._contextObj.getGuid(),
					callback: lang.hitch(this,function(guid) {
						this._updateRendering();
					})
				});
				
                attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.dateattr,
					callback: lang.hitch(this,function(guid,attr,attrValue) {
						this._updateRendering();
					})
                });
				if (this.editableattr) {
					attrHandle2 = this.subscribe({
						guid: this._contextObj.getGuid(),
						attr: this.editableattr,
						callback: lang.hitch(this,function(guid,attr,attrValue) {
							this._updateRendering();
						})
					});		
				}
				
				validationHandle = mx.data.subscribe({
					guid     : this._contextObj.getGuid(),
					val      : true,
					callback : lang.hitch(this,this._handleValidation)
				});
			
				this._handles = [objHandle, attrHandle, validationHandle, attrHandle2];
            }
        }		

 
    });
});

// END CODE BootstrapDatepicker.widget.BootstrapDatepicker;
