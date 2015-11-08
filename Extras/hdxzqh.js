/**
 * Created by LH on 2015/11/7.
 */
define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/query",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/text!./hdsxzqhTemplate.html", "dojo/domReady!"],
    function (declare, lang, array, query, dom, domConstruct, domClass, domStyle, _WidgetBase, _TemplatedMixin, template) {
        return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            constructor   : function () {
            },
            postCreate    : function () {
                this.inherited(arguments);
                var table         = "<table style='border-collapse:collapse;border-spacing:0;' cellpadding='0' cellspacing='0'><tbody class='myxzqhtbody'></tbody></table>";
                var myTable       = domConstruct.toDom(table);
                domConstruct.place(myTable, this.mytable, "last");
                var tbodyToInsert = query("tbody.myxzqhtbody", myTable)[0];

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
            },
            startup       : function () {
                this.inherited(arguments);
                var tbodyToInsert = query("tbody.myxzqhtbody")[0];
                if (tbodyToInsert) {
                    debugger;
                } else {
                    debugger;
                }
            }
        });
    });