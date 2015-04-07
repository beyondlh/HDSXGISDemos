define(["dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/on",
    "esri/Color",
    "esri/SpatialReference",
    "esri/geometry/Point",
    "esri/graphic",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    "esri/dijit/PopupTemplate",
    "esri/layers/GraphicsLayer",
    "esri/toolbars/draw",
    "esri/geometry/mathUtils",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/ScreenPoint"
], function (declare, arrayUtils, lang, on, esriColor, SpatialReference, esriPoint, Graphic,
             SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, esriFont, PopupTemplate, GraphicsLayer, Draw, esriMathUtils, webMercatorUtils, ScreenPoint) {
    var _circleCenter = null;//圆心
    var _clusterResolution = null;
    var _mouseDragStrat = null, _mouseDrag = null, _mouseDragEnd = null;
    var finGraphic = null, finTextGraphic = null, finTextSymbol = null;
    var HDSXDraw = declare([Draw], {
        currentDraw: null,
        destinyPoint: null,
        constructor: function (c, a) {


            finTextSymbol = new TextSymbol(
                "总长:",
                esriFont, new esriColor([0, 0, 0]));

            this.inherited(arguments);
            if (!this.map) {
                throw new Error("地图对象未初始化");
                return;
            }
            if (this.map.extent) {
                this._clusterResolution = this.map.extent.getWidth() / this.map.width;
            }
            on(this.map, "load", lang.hitch(this, function () {
                this._clusterResolution = this.map.extent.getWidth() / this.map.width;
            }));
            on(this.map, "extent-change", lang.hitch(this, function () {
                //console.info("Resolution改变");
                this._clusterResolution = this.map.extent.getWidth() / this.map.width;
            }));
        },

        activate: function (c, a) {
            this.inherited(arguments);
            this.currentDraw = c;
            if (c == "circle") {
                _mouseDragStrat = on(this.map, "mouse-drag-start", lang.hitch(this, function (mousEvt) {
                    this._circleCenter = mousEvt.mapPoint;
                    this.destinyPoint = new esriPoint(this._circleCenter.x, this._circleCenter.y, new SpatialReference({wkid: 4326}));
                    var symbol = this.getSymblo("point");

                    finTextGraphic = new Graphic(this._circleCenter, symbol);
                    finTextSymbol = new TextSymbol(
                        "总长:",
                        esriFont,
                        new esriColor([0, 0, 0])
                    );
                    finTextSymbol.setOffset(50, 0);
                    finGraphic = new Graphic(this._circleCenter, finTextSymbol);
                    finTextGraphic = new Graphic(this._circleCenter, symbol);
                    this.map.graphics.add(finGraphic);
                }));

                _mouseDrag = on(this.map, "mouse-drag", lang.hitch(this, function (msEvt) {
                    if (!this.currentDraw) {
                        return;
                    }
                    var p = msEvt.mapPoint;
                    var distance = (
                    Math.sqrt(
                        Math.pow((this._circleCenter.x - p.x), 2) + Math.pow((this._circleCenter.y - p.y), 2)
                    ) / this._clusterResolution
                    );

                    var dis = esriMathUtils.getLength(this._circleCenter, p);

                    var sc1 = this.map.toScreen(this._circleCenter);
                    sc1.setX(sc1.x + distance);
                    this.destinyPoint = this.map.toMap(sc1);
                    var symbol = this.getSymblo("point");
                    if (finGraphic) {
                        finGraphic.setGeometry(this.destinyPoint);
                        finTextSymbol.setText((dis * 100 * 1000).toFixed(2));
                        finGraphic.draw();
                    } else {
                        finGraphic = new Graphic(this.destinyPoint, symbol);
                        this.map.graphics.add(finGraphic);
                    }
                }));

                _mouseDragEnd = on(this.map, "mouse-drag-end", lang.hitch(this, function (msEvt) {
                    //if (!this.currentDraw) {
                    //    return;
                    //}
                    //var p = msEvt.mapPoint;
                    //var distance = (
                    //Math.sqrt(
                    //    Math.pow((this._circleCenter.x - p.x), 2) + Math.pow((this._circleCenter.y - p.y), 2)
                    //) / this._clusterResolution
                    //);
                    //var sc1 = this.map.toScreen(this._circleCenter);
                    //sc1.setX(sc1.x + distance);
                    //this.destinyPoint = this.map.toMap(sc1);
                    //var symbol = this.getSymblo("point");
                    //var graphic = new Graphic(this.destinyPoint, symbol);
                    //this.map.graphics.add(graphic);
                }));
            }
        },
        deactivate: function (a, c) {
            this.inherited(arguments);
            this.currentDraw = null;
            //if (_mouseDragStrat) {
            //    _mouseDragStrat.remove();
            //}
            //if (_mouseDrag) {
            //    _mouseDrag.remove();
            //}
            //if (_mouseDragEnd) {
            //    _mouseDragEnd.remove();
            //}

            _mouseDragStrat && _mouseDragStrat.remove();
            _mouseDrag && _mouseDrag.remove();
            _mouseDragEnd && _mouseDragEnd.remove();
        },
        getSymblo: function (geotype) {
            var symbol = null;
            switch (geotype) {
                case "point":
                    symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new esriColor([255, 0, 0]), 1), new esriColor([0, 255, 0, 0.25]));
                    break;
                case "polyline":
                    symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new esriColor([255, 0, 0]), 1);
                    break;
                case "polygon":
                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new esriColor([255, 0, 0]), 2), new esriColor([255, 255, 0, 0.25]));
                    break;
                case "extent":
                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new esriColor([255, 0, 0]), 2), new esriColor([255, 255, 0, 0.25]));
                    break;
                case "multipoint":
                    symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_DIAMOND, 20, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new esriColor([0, 0, 0]), 1), new esriColor([255, 255, 0, 0.5]));
                    break;
                case "text":
                    break;
            }
            return symbol;
        },

        finishDrawing: function () {
            this.inherited(arguments);
        },

        _drawEnd: function (c) {
            this.inherited(arguments);
        }
    });

    lang.mixin(HDSXDraw, {
        POINT: "point",
        MULTI_POINT: "multipoint",
        LINE: "line",
        EXTENT: "extent",
        POLYLINE: "polyline",
        POLYGON: "polygon",
        FREEHAND_POLYLINE: "freehandpolyline",
        FREEHAND_POLYGON: "freehandpolygon",
        ARROW: "arrow",
        LEFT_ARROW: "leftarrow",
        RIGHT_ARROW: "rightarrow",
        UP_ARROW: "uparrow",
        DOWN_ARROW: "downarrow",
        TRIANGLE: "triangle",
        CIRCLE: "circle",
        ELLIPSE: "ellipse",
        RECTANGLE: "rectangle"
    });


    //var disLable = declare([], function () {
    //
    //});


    return HDSXDraw;
});