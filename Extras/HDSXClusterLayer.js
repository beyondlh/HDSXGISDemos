define(["dojo/_base/declare",
    "dojo/Evented",
    "dojo/_base/array", "dojo/_base/lang", "dojo/on", "esri/Color", "esri/SpatialReference",
    "esri/geometry/Point", "esri/graphic", "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/TextSymbol", "esri/geometry/mathUtils", "esri/dijit/PopupTemplate",
    "esri/layers/GraphicsLayer"
], function (declare, Evented, arrayUtils, lang, on, Color, SpatialReference, Point, Graphic, SimpleMarkerSymbol, TextSymbol, mathUtils, PopupTemplate, GraphicsLayer) {
    return declare([GraphicsLayer, Evented], {
        constructor: function (options) {
            // 选项:
            //   data:  Object[]
            //     数组类型对象，必需。对象包含属性名为x,y,和attributes的三个属性。x,y代表一个点的坐标.
            //   distance:  Number?
            //     可选. 由单个点变成聚合点集的最大像素值. 默认值是100.
            //   distance:  Number?
            //     Optional. The max number of pixels between points to group points in the same cluster. Default value is 50.
            //   unit : m,km
            //   可选 像素代表距离的单位，默认是m
            //   labelColor:  String?
            //     可选. cluster labels使用的颜色值，默认是#fff(白色).
            //   labelOffset:  String?
            //     Optional. 垂直方向上，聚合标注的偏移像素，默认是-5。IE下无效
            //   showSingles:  Boolean?
            //     可选. 当一个cluster graphic被点击，是否显示cluster graphic 代表的graphics.默认是true.
            //   singleSymbol:  MarkerSymbol?
            //     Marker Symbol (picture or simple). 可选. 代表一个点的Symbol. 默认的是一个灰色的小SimpleMarkerSymbol.
            //   singleTemplate:  PopupTemplate?
            //     PopupTemplate</a>. 可选. Popup template used to format attributes for graphics that represent single points. 默认显示所有属性  "attribute = value" (不推荐).
            //   maxSingles:  Number?
            //     可选. Threshold for whether or not to show graphics for points in a cluster. Default is 1000.
            //   spatialReference:  SpatialReference?
            //     可选. 图层中所有graphics的空间参考. 要和地图使用的空间参考一致. 默认是102100.

            this._clusterTolerance = options.distance || 100;
            this._singleSymbols = options.singleSymbols || null;
            this.clusterData = options.data || [];
            this._clusters = [];
            this._clusterLabelColor = options.labelColor || "#000";
            this._clusterLabelOffset = (options.hasOwnProperty("labelOffset")) ? options.labelOffset : -5;
            this._singles = [];
            this._showSingles = options.hasOwnProperty("showSingles") ? options.showSingles : true;
            var SMS = SimpleMarkerSymbol;
            if (options.singleSymbols && options.singleSymbols.defaultSymbol) {
                this._singleSym = options.singleSymbols.defaultSymbol;
            } else {
                this._singleSym = new SMS("circle", 6, null, new Color("#888"));
            }


            //this._singleTemplate = options.singleTemplate || new PopupTemplate({"title": "", "description": "{*}"});
            this._maxSingles = options.maxSingles || 1000;
            this._sr = options.spatialReference || new SpatialReference({"wkid": 102100});

            this._zoomEnd = null;

            on(this, "click", lang.hitch(this, function (obj) {
                var graphic = obj.graphic;
                graphic.isSelected = !graphic.isSelected;
            }));
        },


        _setMap: function (map, surface) {
            this._clusterResolution = map.extent.getWidth() / map.width;
            this._clusterGraphics();
            this._zoomEnd = on(map, "zoom-end", lang.hitch(this, function () {
                this._clusterResolution = this._map.extent.getWidth() / this._map.width;
                this.clear();
                this._clusterGraphics();
                arrayUtils.forEach(this.graphics, function (graphic) {
                    if (graphic.attributes.clusterCount === 1) {
                        var fea = this.clusterData[graphic.attributes.clusterId - 1];
                        if (fea && fea.attributes && fea.attributes.DeviceType) {
                            var symbol = this._getCustomSymbol(fea.attributes);
                            if (symbol && !graphic.isSelected) {
                                graphic.setSymbol(symbol);
                                graphic.draw();
                            }
                        } else {
                            debugger;
                        }
                    }
                }, this);
            }));
            var div = this.inherited(arguments);
            return div;
        },
        _unsetMap: function () {
            this.inherited(arguments);
            if (this._zoomEnd) {
                this._zoomEnd.remove();
            }
        },


        _getCustomSymbol: function (attributes) {
            var DeviceType = attributes.DeviceType;
            return this._singleSymbols[DeviceType];
        },


        add: function (p) {
            if (p.declaredClass) {
                this.inherited(arguments);
                return;
            }
            this.clusterData.push(p);
            var clustered = false;
            for (var i = 0; i < this._clusters.length; i++) {
                var c = this._clusters[i];
                if (this._clusterTest(p, c)) {
                    this._clusterAddPoint(p, c);
                    this._updateClusterGeometry(c);
                    this._updateLabel(c);
                    clustered = true;
                    break;
                }
            }

            if (!clustered) {
                this._clusterCreate(p);
                p.attributes.clusterCount = 1;
                this._showCluster(p);
            }
        },

        clear: function () {
            this.inherited(arguments);
            this._clusters.length = 0;
        },

        clearSingles: function (singles) {
            var s = singles || this._singles;
            arrayUtils.forEach(s, function (g) {
                this.remove(g);
            }, this);
            this._singles.length = 0;
        },

        onClick: function (e) {
            this.clearSingles(this._singles);

            var singles = [];
            for (var i = 0, il = this.clusterData.length; i < il; i++) {
                if (e.graphic.attributes.clusterId == this.clusterData[i].attributes.clusterId) {
                    singles.push(this.clusterData[i]);
                }
            }
            if (singles.length > this._maxSingles) {
                alert("聚合包含了超过" + this._maxSingles + " 个点. 请放大查看详细信息.");
                return;
            } else {
                e.stopPropagation();
                //this._map.infoWindow.show(e.graphic.geometry);
                this._addSingles(singles);
            }
            return singles;
        },

        _clusterGraphics: function () {
            for (var j = 0, jl = this.clusterData.length; j < jl; j++) {
                var point = this.clusterData[j];
                var clustered = false;
                var numClusters = this._clusters.length;
                for (var i = 0; i < this._clusters.length; i++) {
                    var c = this._clusters[i];
                    if (this._clusterTest(point, c)) {
                        this._clusterAddPoint(point, c);
                        clustered = true;
                        break;
                    }
                }

                if (!clustered) {
                    this._clusterCreate(point);
                }
            }
            this._showAllClusters();
        },

        _clusterTest: function (p, cluster) {
            var distance = (
            Math.sqrt(
                Math.pow((cluster.x - p.x), 2) + Math.pow((cluster.y - p.y), 2)
            ) / this._clusterResolution
            );
            //var distance = mathUtils.getLength(p, cluster) / this._clusterResolution;
            return (distance <= this._clusterTolerance);
        },

        _clusterAddPoint: function (p, cluster) {
            var count, x, y;
            count = cluster.attributes.clusterCount;
            x = (p.x + (cluster.x * count)) / (count + 1);
            y = (p.y + (cluster.y * count)) / (count + 1);
            cluster.x = x;
            cluster.y = y;

            if (p.x < cluster.attributes.extent[0]) {
                cluster.attributes.extent[0] = p.x;
            } else if (p.x > cluster.attributes.extent[2]) {
                cluster.attributes.extent[2] = p.x;
            }
            if (p.y < cluster.attributes.extent[1]) {
                cluster.attributes.extent[1] = p.y;
            } else if (p.y > cluster.attributes.extent[3]) {
                cluster.attributes.extent[3] = p.y;
            }

            cluster.attributes.clusterCount++;

            if (!p.hasOwnProperty("attributes")) {
                p.attributes = {};
            }
            p.attributes.clusterId = cluster.attributes.clusterId;
        },

        _clusterCreate: function (p) {
            var clusterId = this._clusters.length + 1;
            if (!p.attributes) {
                p.attributes = {};
            }
            p.attributes.clusterId = clusterId;
            var cluster = {
                "x": p.x,
                "y": p.y,
                "attributes": {
                    "clusterCount": 1,
                    "clusterId": clusterId,
                    "extent": [p.x, p.y, p.x, p.y]
                }
            };
            this._clusters.push(cluster);
        },

        _showAllClusters: function () {
            for (var i = 0, il = this._clusters.length; i < il; i++) {
                var c = this._clusters[i];
                this._showCluster(c);
            }
        },

        _showCluster: function (c) {
            var point = new Point(c.x, c.y, this._sr);
            //graphic的symbol通过classRender来控制
            var graphic = new Graphic(point, null, c.attributes);

            this.add(graphic);
            if (c.attributes.clusterCount == 1) {
                graphic._cusIsSingle = true;
                return;
            }


            var label = new TextSymbol(c.attributes.clusterCount)
                .setColor(new Color(this._clusterLabelColor))
                .setOffset(0, this._clusterLabelOffset);
            this.add(
                new Graphic(
                    point,
                    label,
                    c.attributes
                )
            );
        },

        _addSingles: function (singles) {
            arrayUtils.forEach(singles, function (p) {
                var g = new Graphic(
                    new Point(p.x, p.y, this._sr),
                    this._singleSym,
                    p.attributes
                    //this._singleTemplate
                );
                this._singles.push(g);
                if (this._showSingles) {
                    this.add(g);
                }
            }, this);
            //this._map.infoWindow.setFeatures(this._singles);
        },

        _updateClusterGeometry: function (c) {
            var cg = arrayUtils.filter(this.graphics, function (g) {
                return !g.symbol &&
                    g.attributes.clusterId == c.attributes.clusterId;
            });
            if (cg.length == 1) {
                cg[0].geometry.update(c.x, c.y);
            } else {
                console.log("没有找到聚合点: ", cg);
            }
        },

        _updateLabel: function (c) {
            var label = arrayUtils.filter(this.graphics, function (g) {
                return g.symbol &&
                    g.symbol.declaredClass == "esri.symbol.TextSymbol" &&
                    g.attributes.clusterId == c.attributes.clusterId;
            });
            if (label.length == 1) {
                this.remove(label[0]);
                var newLabel = new TextSymbol(c.attributes.clusterCount)
                    .setColor(new Color(this._clusterLabelColor))
                    .setOffset(0, this._clusterLabelOffset);
                this.add(
                    new Graphic(
                        new Point(c.x, c.y, this._sr),
                        newLabel,
                        c.attributes
                    )
                );
            } else {
                console.log("没有找到聚合label: ", label);
            }
        },

        setRenderer: function (a) {
            this.inherited(arguments);
        }
    });


    var mm = declare([], function () {
    });
});