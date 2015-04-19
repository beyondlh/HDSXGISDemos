//*仿照百度地图制作的地图导航，基于arcgis api for javascript使用*/
define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/window",
    "dojo/dom-style",
    "dojo/on",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/dnd/Moveable",
    "esri/config",
    "esri/geometry/mathUtils",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/ScreenPoint",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./HDSXMapNavigation.html",
    "xstyle/css!./HDSXCSS.css"
], function (declare, arrayUtils, lang, win, domStyle, on, topic, domClass, Moveable, esriConfig, esriMathUtils, webMercatorUtils, ScreenPoint, _WidgetBase, _TemplatedMixin, template) {
    var HDSXMapNavigation = declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        map: null,
        currentZoomLevel: null,
        maxZoomLevel: null,
        minZoomLevel: null,
        moveable: null,
        minTop: 1,
        maxTop: null,
        constructor: function (params) {
            esriConfig.defaults.map.panDuration = 150;
            this.map = params.map;
            var isEsriMap = this.map && this.map.declaredClass && this.map.declaredClass == "esri.Map";
            if (!isEsriMap) {
                throw new Error("请传入esri map对象");
            }
            this.maxZoomLevel = this.map.getMaxZoom();
        },

        postCreate: function () {
            this.inherited(arguments);

            on(this.mpPanContent, "mouseout", lang.hitch(this, function () {
                domStyle.set(this.mpPanContent, "backgroundPosition", "0px  0px")
            }));
            on(this.panUpContent, "mouseover", lang.hitch(this, function () {
                domStyle.set(this.mpPanContent, "backgroundPosition", "0px -44px");
            }));
            on(this.panRightContent, "mouseover", lang.hitch(this, function () {
                domStyle.set(this.mpPanContent, "backgroundPosition", "0px -88px");
            }));
            on(this.panDownContent, "mouseover", lang.hitch(this, function () {
                domStyle.set(this.mpPanContent, "backgroundPosition", "0px -132px");
            }));

            on(this.panLeftContent, "mouseover", lang.hitch(this, function () {
                domStyle.set(this.mpPanContent, "backgroundPosition", "0px -176px");
            }));
        },
        startup: function () {
            this.inherited(arguments);
            if (this.maxZoomLevel !== null && this.maxZoomLevel >= 0) {
                this.tileSilderBar();
            } else {
                this.createDyanmicZoomSilder();
            }

        },


        tileSilderBar: function () {

            this.maxZoomLevel = this.map.getMaxZoom();
            this.minZoomLevel = this.map.getMinZoom();
            this.currentZoomLevel = this.map.getZoom();
            on(this.map, "extent-change", lang.hitch(this, function (evtData) {
                if (evtData.levelChange) {
                    this.currentZoomLevel = this.map.getZoom();
                    var t = (this.maxZoomLevel - this.currentZoomLevel) * 6;
                    domStyle.set(this.SilderBarDiv, "top", t + "px");
                    domStyle.set(this.BMap_stdMpSliderBgBot, "top", t + "px");
                    domStyle.set(this.BMap_stdMpSliderBgBot, "height", this.maxTop - t + "px");
                }
            }));


            this.maxTop = (this.maxZoomLevel - this.minZoomLevel + 2) * 6;
            this.minZoomLevel = this.map.getMinZoom();
            domStyle.set(this.SilderBarDiv, "top", (this.maxZoomLevel - this.currentZoomLevel) * 6 + "px");
            var tt = (this.maxZoomLevel - this.currentZoomLevel + 2) * 6;
            domStyle.set(this.BMap_stdMpSliderBgBot, "top", tt + "px");

            domStyle.set(this.BMap_stdMpSliderBgBot, "height", this.maxTop - tt + "px");
            domStyle.set(this.BMap_stdMpSliderBgTop, "height", this.maxTop + "px");

            domStyle.set(this.BMap_stdMpZoomOut, "top", this.maxTop + 3 * 6 + "px");

            this.moveable = new HDSXDrag(this.SilderBarDiv, {
                minTop: this.minTop,
                maxTop: this.maxTop,
                levelDom: this.BMap_stdMpSliderBgBot
            });


            this.moveable.HDSXMoveEnd = lang.hitch(this, function (mover) {
                var top = domStyle.get(this.SilderBarDiv, "top");
                if (top == this.minTop) {
                    this.map.setZoom(this.maxZoomLevel);
                } else if (top == this.maxTop - 2 * 6) {
                    this.map.setZoom(this.minZoomLevel);
                } else {
                    var scale = (this.maxTop - top) / 6;
                    scale = parseInt(scale - 1);
                    this.map.setZoom(scale);
                }
            })
        },

        confirmLevel: function () {
            //确定滑动条的滑动级别数目
        },

        panUp: function () {
            this.map.panUp();
        },
        panLeft: function () {
            this.map.panLeft();
        },
        panRight: function () {
            this.map.panRight();
        },
        panDown: function () {
            this.map.panDown();
        },
        zoomIn: function () {
            if (this.currentZoomLevel !== null & this.currentZoomLevel !== -1) {
                this.map.setZoom(this.currentZoomLevel + 1);
            } else {
                this.map.setScale(this.map.getScale() / 1.5);
            }
        },
        zoomOut: function () {
            if (this.currentZoomLevel !== null & this.currentZoomLevel !== -1) {
                this.map.setZoom(this.currentZoomLevel - 1);
            } else {
                this.map.setScale(this.map.getScale() * 1.5);
            }
        },
        zoomToLevel: function (evtObj) {
            var y = evtObj.offsetY;
            var scale = (this.maxTop - y) / 6;
            scale = parseInt(scale - 1);
            this.map.setZoom(scale);
        },

        createDyanmicZoomSilder: function () {
            domStyle.set(this.SilderBarDiv, "display", "none");
            domStyle.set(this.BMap_stdMpZoomOut, "top", "18px");
            domStyle.set(this.BMap_stdMpSliderMask, "display", "none");
            domStyle.set(this.BMap_stdMpSliderBgTop, "display", "none");
            domStyle.set(this.BMap_stdMpSlider, "display", "none");
        }
    });


    var HDSXDrag = declare([Moveable], {
        params: null,
        levelDom: null,
        constructor: function (node, params) {
            this.params = params;
            this.levelDom = this.params.levelDom;
        },

        onMove: function (mover, leftTop/*=====, e =====*/) {
            this.onMoving(mover, leftTop);
            var s = mover.node.style;
            if (leftTop.t < this.params.minTop) {
                leftTop.isMaxLevel = true;
                return;
            }
            if (leftTop.t > this.params.maxTop - 2 * 6) {
                leftTop.isMinLevel = true;
                return;
            }
            leftTop.isMaxLevel = false;
            leftTop.isMinLevel = false;
            s.top = leftTop.t + "px";
            this.levelDom.style.top = leftTop.t + "px";
            this.levelDom.style.height = this.params.maxTop + 6 - leftTop.t + "px";
            this.onMoved(mover, leftTop);
        },
        HDSXMoveEnd: function (mover) {

        },
        onMoveStop: function (/*Mover*/ mover) {
            topic.publish("/dnd/move/stop", mover);
            domClass.remove(win.body(), "dojoMove");
            domClass.remove(this.node, "dojoMoveItem");
            this.HDSXMoveEnd(mover);
        }
    });
    return HDSXMapNavigation;
});