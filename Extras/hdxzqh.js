/**
 * Created by LH on 2015/11/7.
 */
define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/query",
        "dojo/on",
        "dojo/dom",
        "dojo/topic",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!./hdsxzqhTemplate.html", "dojo/domReady!"],
    function (declare, lang, array, query, on, dom, topic, domConstruct, domClass, domStyle, _WidgetBase, _TemplatedMixin, template) {
        return declare([_WidgetBase, _TemplatedMixin], {
            templateString             : template,
            scrollHeight               : 160,
            scrollStep                 : 16,
            selectedCity               : "",//当前选中的城市
            selectType                 : "",
            previousPorvinceFirstLetter: null,
            pingyinSpellsData          : ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "W", "X", "Y", "Z"],
            pingyinData                : [],
            matchCityes                : [],
            constructor                : function () {
            },
            postCreate                 : function () {
                this.inherited(arguments);
                this._selectPattern();
                this._scrollHandler();
                this._bindAutoComplete();
            },

            startup: function () {
                this.inherited(arguments);
            },

            checkStyle: function () {
                var top = domStyle.get(this.myScrollDom, "top");
                if (top < 0) {
                    domStyle.set(this.myScrollDom, "top", "0px");
                    topic.publish("scrollTopChanged", "");
                } else if (top > this.scrollHeight) {
                    domStyle.set(this.myScrollDom, "top", this.scrollHeight + "px");
                    topic.publish("scrollTopChanged", "");
                }
            },


            _bindAutoComplete: function () {
                if (this.pingyinData.length === 0) {
                    array.forEach(myData, lang.hitch(this, function (item) {
                        array.forEach(item.citys, lang.hitch(this, function (city) {
                            this.pingyinData.push(city);
                        }));
                    }));
                }

                var self = this;
                $(this.selCityCityWdselCityCityWd).autocomplete(this.pingyinData, {
                    max          : 10,    //列表里的条目数
                    minChars     : 1,    //自动完成激活之前填入的最小字符
                    width        : 62,     //提示的宽度，溢出隐藏
                    scrollHeight : 300,   //提示的高度，溢出显示滚动条
                    matchContains: true,    //包含匹配，就是data参数里的数据，是否只要包含文本框里的数据就显示
                    autoFill     : false,    //自动填充
                    formatItem   : function (row, i, max) {
                        return row.name;
                    },
                    formatMatch  : function (row, i, max) {
                        return row.name + row.pingyin;
                    },
                    formatResult : function (row) {
                        return row.name;
                    }
                }).result(function (event, row, formatted) {
                    self.selectedCity = row.name;
                    console.info("当前选中的城市为", self.selectedCity);
                });
            },

            _selectPattern: function (event) {
                domStyle.set(this.myScrollDom, "top", "0px");
                var className = "sel-city-btnl-sel";
                domClass.remove(this.byRegionDom, className);
                domClass.remove(this.byProvinceDom, className);
                domClass.remove(this.byCityDom, className);
                if (event && event.target) {
                    domClass.add(event.target, className);
                } else {
                    domClass.add(this.byProvinceDom, className);
                }

                if (domClass.contains(this.byRegionDom, className)) {
                    if (this.selectType !== "byRegion") {
                        this.showByRegion();
                    }
                } else if (domClass.contains(this.byProvinceDom, className)) {
                    if (this.selectType !== "byProvince") {
                        this.showByProvince();
                    }
                } else {
                    if (this.selectType !== "byCity") {
                        this.showByCitys();
                    }
                }

                this.bindSelect();

                var myTable = query("table", this.mytable)[0];
                if (this.mousewheelListener) {
                    this.mousewheelListener.remove();
                }
                this.mousewheelListener = on(myTable, "mousewheel", lang.hitch(this, function (e) {
                    //往上滚动，y值为负
                    var top = domStyle.get(this.myScrollDom, "top");
                    if (top == 0 && e.deltaY > 0) {
                        domStyle.set(this.myScrollDom, "top", top + this.scrollStep + "px");
                    } else if (top == 0 && e.deltaY < 0) {
                        return;
                    } else if (top == this.scrollHeight && e.deltaY < 0) {
                        domStyle.set(this.myScrollDom, "top", top - this.scrollStep + "px");
                    } else if (top == this.scrollHeight && e.deltaY > 0) {
                        return;
                    } else {
                        if (e.deltaY < 0) {
                            domStyle.set(this.myScrollDom, "top", top - this.scrollStep + "px");
                        } else {
                            domStyle.set(this.myScrollDom, "top", top + this.scrollStep + "px");
                        }
                    }
                    this.checkStyle();
                    topic.publish("scrollTopChanged", "");
                }));
                if (this.mouseClickScroolHandler) {
                    this.mouseClickScroolHandler.remove();
                }
                this.mouseClickScroolHandler = on(this.myScroolbarDom, "click", lang.hitch(this, function (e) {
                    domStyle.set(this.myScrollDom, "top", e.layerY - 10 + "px");
                    this.checkStyle();
                    topic.publish("scrollTopChanged", "");
                }));
            },


            _scrollHandler: function () {
                topic.subscribe("scrollTopChanged", lang.hitch(this, function () {
                    //显示的表格的高度
                    var hei     = domStyle.get(this.mytable, "height");
                    var myTable = query("table", this.mytable)[0];
                    //得到当前table的高度
                    var myTableHeight = domStyle.get(myTable, "height");
                    var bili          = (myTableHeight - hei) / this.scrollHeight;
                    var top2          = domStyle.get(this.myScrollDom, "top");
                    domStyle.set(myTable, "top", -top2 * bili + "px");
                }));
            },

            showByRegion: function () {
                domConstruct.empty(this.mytable);
                this.selectType = "byRegion";
            },

            showByCitys   : function () {
                domConstruct.empty(this.mytable);
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
                        "<td class='mycityesClass myForQureyUse'>" +
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
                this.selectType  = "byCity";
            },
            showByProvince: function () {
                domConstruct.empty(this.mytable);
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
                        "<td class='myProvinceCityesClass myForQureyUse'>" +
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
                this.selectType  = "byProvince";
            },

            bindSelect: function () {
                var interval = null;
                var cityDoms = query("td.myForQureyUse", this.myTable);
                if (cityDoms.length == 0) {
                    interval = setInterval(function () {
                        cityDoms = query("td.myForQureyUse", this.myTable);
                        if (cityDoms.length !== 0) {
                            topic.publish("myForQureyUseReady", cityDoms);
                            window.clearInterval(interval);
                        }
                    }, 500);
                } else {
                    topic.publish("myForQureyUseReady", cityDoms);
                }
                topic.subscribe("myForQureyUseReady", lang.hitch(this, function (objDom) {
                    if (this.cityClickListener) {
                        this.cityClickListener.remove();
                    }
                    this.cityClickListener = on(objDom, "click", lang.hitch(this, function (evt) {
                        if (evt.path[0].tagName === "A") {
                            this.selectedCity = evt.path[0].innerText;
                            console.info("当前选中的城市为:", this.selectedCity);
                        }
                    }));
                }));

            }
        });
    });