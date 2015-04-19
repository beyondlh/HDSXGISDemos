define(["dojo/Evented", "dojo/parser", "dojo/on", "dojo/_base/declare",
    "dojo/dom-construct", "dojo/_base/array", "dojo/dom-style",
    "dojo/_base/lang", "dojo/dom-class", "dojo/dom-attr",
    "dojo/fx/Toggler", "dojo/fx", "dojox/fx", "dojo/Deferred",
    "esri/domUtils", "esri/InfoWindowBase",
    "xstyle/css!./HDSXInfoWindow.css"], function (Evented, parser, on,
                                                  declare, domConstruct, array, domStyle, lang, domClass, domAttr,
                                                  Toggler, coreFx, dojoxFx, Deferred, domUtils, InfoWindowBase) {
    var HDSXInfoWindow = declare([InfoWindowBase, Evented], {
        showScreenPoint: null,
        isContentShowing: true,
        showMapPoint: null,
        customIsPan: false,
        tempObj: {},
        constructor: function (parameters) {
            lang.mixin(this, parameters);
            domClass.add(this.domNode, "myInfoWindow");

            this._closeButton = domConstruct.create("div", {
                "class": "close",
                "title": "关闭"
            }, this.domNode);
            this._title = domConstruct.create("div", {
                "class": "title"
            }, this.domNode);

            //this._label = domConstruct.create("label", {
            //    "class": "titleLabel"
            //}, this._title);

            on(this._title, "dblclick", lang.hitch(this, function () {
                this.emit("titledblick", {});
            }));
            this._content = domConstruct.create("div", {
                "class": "content"
            }, this.domNode);
            this._arrow = domConstruct.create("img", {
                "class": "arrow"
            }, this.domNode);
            this._toggleButton = domConstruct.create("div", {
                "class": "toggleOpen",
                "title": "隐藏"
            }, this.domNode);
            var toggler = new Toggler({
                "node": this._content,
                showFunc: coreFx.wipeIn,
                hideFunc: coreFx.wipeOut
            });
            on(this._closeButton, "click", lang.hitch(this, function () {
                // hide the content when the info window is toggled close.
                this.hide();
                if (this.isContentShowing) {
                    toggler.hide();
                    this.isContentShowing = false;
                    domClass.remove(this._toggleButton);
                    domClass.add(this._toggleButton, "toggleOpen");
                }
            }));
            on(this._toggleButton, "click", lang.hitch(this, function () {
                // animate the content display
                if (this.isContentShowing) {
                    var height = domStyle.get(this._content, "height");
                    var padding = domStyle.get(this._content, "padding");
                    var top = domStyle.get(this.domNode, "top");
                    this.topmm = height + padding;
                    this.tempLeft = domStyle.get(this.domNode, "left");
                    this.tempWidth = domStyle.get(this.domNode, "width");
                    toggler.hide();
                    this.isContentShowing = false;
                    domClass.remove(this._toggleButton);
                    domClass.add(this._toggleButton, "toggleOpen");
                    domAttr.set(this._toggleButton, "title", "展开");
                    domStyle.set(this.domNode, "top", top + this.topmm + "px");
                    var self = this;
                    setTimeout(function () {
                        self.tempObj.x = self.showScreenPoint.x;
                        self.tempObj.y = self.showScreenPoint.y;
                        self.show(self.tempObj);
                    }, 300);
                } else {
                    toggler.show();
                    this.isContentShowing = true;
                    var top = domStyle.get(this.domNode, "top");
                    domClass.remove(this._toggleButton);
                    domClass.add(this._toggleButton, "toggleClose");
                    domAttr.set(this._toggleButton, "title", "隐藏");
                    domStyle.set(this.domNode, "top", top - this.topmm + "px");
                }
            }));
            // hide initial display
            domUtils.hide(this.domNode);
            this.isShowing = false;

        },
        setMap: function (map) {
            this.map = map;
            this.inherited(arguments);
            this.map.on("pan", lang.hitch(this, function (pan) {
                this.customIsPan = true;
                var movePoint = pan.delta;
                if (this.isShowing) {
                    if (this.showScreenPoint != null) {
                        this.tempObj.x = this.showScreenPoint.x + movePoint.x;
                        this.tempObj.y = this.showScreenPoint.y + movePoint.y;
                        this.show(this.tempObj);
                    }
                }
            }));
            this.map.on("pan-end", lang.hitch(this, function (panend) {
                this.customIsPan = false;
                var movedelta = panend.delta;
                if (this.isShowing) {
                    this.showScreenPoint.x = this.showScreenPoint.x
                    + movedelta.x;
                    this.showScreenPoint.y = this.showScreenPoint.y
                    + movedelta.y;
                }
            }));
            this.map.on("zoom-start", lang.hitch(this, function () {
                domUtils.hide(this.domNode);
                this.onHide();
            }));
            this.map.on("zoom-end", lang.hitch(this,
                function () {
                    if (this.isShowing) {
                        this.showScreenPoint = this.map
                            .toScreen(this.showMapPoint);
                        this.show(this.showScreenPoint);
                    }
                }));
        },
        setTitle: function (title) {
            this.place(title, this._title);
            //this.place(title, this._label);
        },

        setContent: function (content) {
            this.place(content, this._content);
        },
        show: function (location) {
            if (location.spatialReference) {
                this.showMapPoint = location;
                location = this.map.toScreen(location);
                this.showScreenPoint = location;
            } else {
                if (!this.showMapPoint) {
                    this.showMapPoint = this.map.toMap(location);
                }
                if (!this.showScreenPoint) {
                    this.showScreenPoint = location;
                }
            }
            domUtils.show(this.domNode);
            domStyle.set(this.domNode, "opacity", 0);
            var height = domStyle.get(this.domNode, "height");
            var width = domStyle.get(this.domNode, "width");
            var imgHeight = domStyle.get(this._arrow, "height");
            // Position 10x10 pixels away from the specified location
            if (this.isContentShowing) {
                domStyle.set(this.domNode, {
                    "left": (location.x - width / 2 + 18) + "px",
                    "top": (location.y - height - imgHeight - 15) + "px"// 31为array箭头的高度
                });
            } else {
                domStyle.set(this.domNode, {
                    "left": (location.x - width / 2 + 18) + "px",
                    "top": (location.y - height - imgHeight - 15) + "px"// 31为array箭头的高度
                });
            }
            var imgWidth = domStyle.get(this._arrow, "width");
            domStyle.set(this._arrow, "left", ((width - imgWidth) / 2) + "px");
            domStyle.set(this.domNode, "opacity", 1);
            this.isShowing = true;
            this.onShow();
        },
        hide: function () {
            domUtils.hide(this.domNode);
            this.isShowing = false;
            this.onHide();
            this.emit("hide", {});
        },
        resize: function (width, height) {
            domStyle.set(this._content, {
                "width": width + "px",
                "height": height + "px"
            });
            domStyle.set(this._title, {
                "width": width + "px"
            });

        },
        destroy: function () {
            this.isShowing = false;
            domConstruct.destroy(this.domNode);
            this._closeButton = this._title = this._content = null;
        }
    });
    return HDSXInfoWindow;
});
