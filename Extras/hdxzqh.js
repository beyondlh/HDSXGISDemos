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
            templateString : template,
            selectedCity   : "",//当前选中的城市
            selectedPattern: null,
            constructor    : function () {
            },
            postCreate     : function () {
                this.inherited(arguments);
                var table         = "<table style='border-collapse:collapse;border-spacing:0;' cellpadding='0' cellspacing='0'><tbody class='myxzqhtbody'></tbody></table>";
                var myTable       = domConstruct.toDom(table);
                var tbodyToInsert = query("tbody.myxzqhtbody", myTable)[0];
                domConstruct.place(myTable, this.mytable, "last");
                domStyle.set(myTable, "position", "relative");
                //城市模板
                var tema         = "<a href='javascript:void(0)'></a>";
                var templateCity = domConstruct.toDom(tema);
                array.forEach(myData, function (item, index) {
                    var temProvince        = "<tr>" +
                        "<td class='sel-city-td-letter'>" +
                        "<div>CITYSPELL</div>" +
                        "</td>" +
                        "<td class='sel-city-td-sf'>" +
                        "<a href='javascript:void(0)'>ProvinceName:</a>" +
                        "</td>" +
                        "<td class='mycityesClass'>" +
                        "</td>" +
                        "</tr>" +
                        "<tr>" +
                        "<td colspan='3'>" +
                        "<div class='sel-city-tr-splitline'>CITYSPELL</div></td>"
                        + "</tr>";
                    var temProvinceReplace = temProvince.replace("CITYSPELL", item.spel).replace("ProvinceName", item.provinceName);
                    var temProvinceDom     = domConstruct.toDom(temProvinceReplace);
                    domConstruct.place(temProvinceDom, tbodyToInsert, "last");
                    var cityToInsertDom    = query("td.mycityesClass", myTable)[index];
                    array.forEach(item.citys, function (city) {
                        var templateCityTemp       = lang.clone(templateCity);
                        templateCityTemp.innerHTML = city.name;
                        domConstruct.place(templateCityTemp, cityToInsertDom, "last");
                    });
                });

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
                debugger;
                domClass.remove(this.byRegionDom, "sel-city-btnl-sel");
                domClass.remove(this.byProvinceDom, "sel-city-btnl-sel");
                domClass.remove(this.byCityDom, "sel-city-btnl-sel");
                domClass.add(event.target, "sel-city-btnl-sel");

            }

        });
    });