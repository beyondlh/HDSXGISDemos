/**
 * Created by LH on 2015/11/7.
 */
define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/query",
        "dojo/on",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!./hdsxzqhTemplate.html", "dojo/domReady!"],
    function (declare, lang, array, query, on, dom, domConstruct, domClass, domStyle, _WidgetBase, _TemplatedMixin, template) {
        return declare([_WidgetBase, _TemplatedMixin], {
            templateString             : template,
            selectedCity               : "",//当前选中的城市
            selectedPattern            : null,
            previousPorvinceFirstLetter: null,
            pingyinSpellsData          : ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "W", "X", "Y", "Z"],
            pingyinData                : [],
            matchCityes                : [],
            constructor                : function () {
            },
            postCreate                 : function () {
                this.inherited(arguments);
                var table         = "<table style='border-collapse:collapse;border-spacing:0;' cellpadding='0' cellspacing='0'><tbody class='myProvinceXZQHtbody'></tbody></table>";
                var myTable       = domConstruct.toDom(table);
                var tbodyToInsert = query("tbody.myProvinceXZQHtbody", myTable)[0];
                domConstruct.place(myTable, this.mytable, "last");
                domStyle.set(myTable, "position", "relative");
                //城市模板
                var tema         = "<a href='javascript:void(0)'></a>";
                var templateCity = domConstruct.toDom(tema);
                array.forEach(myData, lang.hitch(this, function (item, index) {
                    var provinceLetter = "<div>CITYSPELL</div>";
                    var temProvince    = "<tr>" +
                        "<td class='sel-city-td-letter'>" +
                        "<div>CITYSPELL</div>" +
                        "</td>" +
                        "<td class='sel-city-td-sf'>" +
                        "<a href='javascript:void(0)'>ProvinceName:</a>" +
                        "</td>" +
                        "<td class='myProvinceCityesClass'>" +
                        "</td>" +
                        "</tr>" +
                        "<tr>" +
                        "<td colspan='3'>" +
                        "<div class='sel-city-tr-splitline'>CITYSPELL</div></td>"
                        + "</tr>";
                    if (this.previousPorvinceFirstLetter === item.spel) {
                        temProvince = temProvince.replace(provinceLetter, "");
                    }
                    this.previousPorvinceFirstLetter = item.spel;
                    var temProvinceReplace           = temProvince.replace("CITYSPELL", item.spel).replace("ProvinceName", item.provinceName);
                    var temProvinceDom               = domConstruct.toDom(temProvinceReplace);
                    domConstruct.place(temProvinceDom, tbodyToInsert, "last");
                    var cityToInsertDom              = query("td.myProvinceCityesClass", myTable)[index];
                    array.forEach(item.citys, function (city) {
                        var templateCityTemp       = lang.clone(templateCity);
                        templateCityTemp.innerHTML = city.name;
                        domConstruct.place(templateCityTemp, cityToInsertDom, "last");
                    });
                }));

                on(myTable, "mousewheel", lang.hitch(this, function (e) {
                    //往上滚动，y值为负
                    var top  = domStyle.get(this.myScrollDom, "top");
                    if (top == 0 && e.deltaY > 0) {
                        domStyle.set(this.myScrollDom, "top", top + 16 + "px");
                    } else if (top == 0 && e.deltaY < 0) {
                        return;
                    } else if (top == 160 && e.deltaY < 0) {
                        domStyle.set(this.myScrollDom, "top", top - 16 + "px");
                    } else if (top == 160 && e.deltaY > 0) {
                        return;
                    } else {
                        if (e.deltaY < 0) {
                            domStyle.set(this.myScrollDom, "top", top - 16 + "px");
                        } else {
                            domStyle.set(this.myScrollDom, "top", top + 16 + "px");
                        }
                    }

                    this.checkStyle();
                    var top2 = domStyle.get(this.myScrollDom, "top");
                    domStyle.set(myTable, "top", -top2 + "px");
                }));
                on(this.myScroolbarDom, "click", lang.hitch(this, function (e) {
                    domStyle.set(this.myScrollDom, "top", e.layerY - 10 + "px");
                    this.checkStyle();
                }));
            },

            startup: function () {
                this.inherited(arguments);
            },

            checkStyle: function () {
                var top = domStyle.get(this.myScrollDom, "top");
                if (top < 0) {
                    domStyle.set(this.myScrollDom, "top", "0px");
                } else if (top > 160) {
                    domStyle.set(this.myScrollDom, "top", "160px");
                }
            },

            _selectPattern: function (event) {
                var className = "sel-city-btnl-sel";
                domClass.remove(this.byRegionDom, className);
                domClass.remove(this.byProvinceDom, className);
                domClass.remove(this.byCityDom, className);
                domClass.add(event.target, className);
                if (domClass.contains(this.byRegionDom, className)) {
                    this.selectType = "byRegion";
                } else if (domClass.contains(this.byProvinceDom, className)) {
                    this.selectType = "byProvince";
                } else {
                    this.selectType = "byCity";
                }
                this._showRightContent(this.selectType)
            },

            _showRightContent: function (type) {
                console.info("显示正确的内容", type);
                this.showByCitys();
            },
            showByRegion     : function () {

            },
            showByCitys      : function () {
                domConstruct.empty(this.mytable);
                if (this.pingyinData.length === 0) {
                    array.forEach(myData, lang.hitch(this, function (item) {
                        array.forEach(item.citys, lang.hitch(this, function (city) {
                            this.pingyinData.push(city);
                        }));

                    }));
                }
                var table         = "<table style='border-collapse:collapse;border-spacing:0;' cellpadding='0' cellspacing='0'><tbody class='myCitysXZQHtbody'></tbody></table>";
                var myTable       = domConstruct.toDom(table);
                var tbodyToInsert = query("tbody.myCitysXZQHtbody", myTable)[0];
                domConstruct.place(myTable, this.mytable, "last");
                domStyle.set(myTable, "position", "relative");
                //城市模板
                var tema         = "<a href='javascript:void(0)'></a>";
                var templateCity = domConstruct.toDom(tema);
                array.forEach(this.pingyinSpellsData, lang.hitch(this, function (item, index) {
                    var matchCityes = array.filter(this.pingyinData, lang.hitch(this, function (city) {
                        return item === city.pingyin.charAt(0).toUpperCase();
                    }));

                    var temProvince        = "<tr>" +
                        "<td class='sel-city-td-letter'>" +
                        "<div>CITYSPELL</div>" +
                        "</td>" +
                        "<td class='mycityesClass'>" +
                        "</td>" +
                        "</tr>" +
                        "<tr>" +
                        "<td colspan='3'>" +
                        "<div class='sel-city-tr-splitline'>CITYSPELL</div></td>"
                        + "</tr>";
                    var temProvinceReplace = temProvince.replace("CITYSPELL", item);
                    var temProvinceDom     = domConstruct.toDom(temProvinceReplace);
                    domConstruct.place(temProvinceDom, tbodyToInsert, "last");
                    var cityToInsertDom    = query("td.mycityesClass", myTable)[index];
                    array.forEach(matchCityes, lang.hitch(this, function (city) {
                        var templateCityTemp       = lang.clone(templateCity);
                        templateCityTemp.innerHTML = city.name;
                        domConstruct.place(templateCityTemp, cityToInsertDom, "last");
                    }));

                }));

            },
            showByProvince   : function () {

            }
        });
    });