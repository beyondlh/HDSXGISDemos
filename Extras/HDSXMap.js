define(["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "esri/map",
    "App/Extras/HDSXMapNavigation",
    "xstyle/css!./HDSXCSS.css"], function (declare, lang, on, map, HDSXMapNavigation) {
    return declare([map], {
        silderBar: null,
        constructor: function (a, c) {
            on(this, "load", lang.hitch(this, function (evt) {

            }));
        },
        _createSlider: function (a, c, b) {
            var _sliderBar = new HDSXMapNavigation({
                map: this
            });
            _sliderBar.placeAt(this.root);
            _sliderBar.startup();
        }
    });
});