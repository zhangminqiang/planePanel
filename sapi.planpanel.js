; (function ($, Sapi) {
    var utility = Sapi.utility;
    
    var nodeDataProxy = function (options) {
        options = options || {};

        this.dialog = utility.getSingleton(function (inst) {
            var box = new Sapi.Control.PromptBox({
                title: "保存数据",
                $container: inst.$container,
                promptBoxClass: "thjk",
                size: "700px",
                complete: function ($container) {
                    inst.planView = new planPanel({
                        $container: inst.$container.children(".plan-view"),
                        data: inst.planPanelData
                    });
                },
                //isShowBtn: false,
                isShowTitle: false,
                onShow: function () {
                    inst.planView._renderDateLine();
                },
                btns: [{ name: "关闭", autoClose: true }]
            });

            return box;
        });

        this.$container = options.$container;

        if(!this.$container || this.$container.length === 0){
            this.$container  = $("<div style='display:none;padding:0 20px 10px;'><h4 class='node-title'></h4><div class='plan-view'></div></div>");
            $(document.body).append(this.$container);
        }

        this.planView = null;
        // 第一次打开
        this.isFirstOpen = true;
        this.$nodeTitle = this.$container.children(".node-title");
        this.$planView = this.$container.children(".plan-view");

        this.show(options);
    }

    nodeDataProxy.prototype = {
        show: function (options) {
            options = options || {};
            this.nodeId = options.nodeId;
            this.nodeName = options.nodeName;
            this.versionId = options.versionId;
            this.year = options.year;
            this.month = options.month;

            this._setTitle();
            this._loadingData();
        },
        _setTitle: function () {
            this.$nodeTitle.text(this.nodeName || "");
        },
        _getQueryParam: function () {
            var that = this;
            return {
                versionId: that.versionId,
                nodeId: that.nodeId,
                year: that.year,
                month: that.month
            };
        },
        _convertData:function(data){
            data = data || [];
            var planPanelData = [];
            // [{ title: "基坑支护工程", member: [{ categroy: "plan", start: "", end: "" }] }]
            for (var i = 0, len = data.length; i < len; i++) {
                var obj = {
                    title: data[i]["nodeName"], member: [{
                        categroy: "plan",
                        start: data[i]["planBeginDate"],
                        end: data[i]["planCompleteDate"]
                    }]
                };

                if(data[i]["actualBeginDate"]){
                    if (data[i]["actualCompleteDate"]) {
                        if (utility.parseDate(data[i]["planCompleteDate"]) < utility.parseDate(data[i]["actualCompleteDate"])) {
                            obj["member"].push({
                                categroy: "delay",
                                start: data[i]["actualBeginDate"],
                                end: data[i]["actualCompleteDate"]
                            });
                        } else {
                            obj["member"].push({
                                categroy: "onTime",
                                start: data[i]["actualBeginDate"],
                                end: data[i]["actualCompleteDate"]
                            });
                        }
                    } else {
                        obj["member"].push({
                            categroy: "running",
                            start: data[i]["actualBeginDate"],
                            end: data[i]["actualCompleteDate"]
                        });
                    }
                }

                planPanelData.push(obj);
            }

            this.planPanelData = planPanelData;
        },
        _loadingData: function () {
            var that = this;
            Sapi.DB.getThjkProgressChildNodesByNodeId(this._getQueryParam(), function (success, msg, data) {
                if (success) {
                    if (data && data.length === 0) {
                        utility.thjkAlert("操作提示", "“"+ that.nodeName + "”没有子节点。");
                        return;
                    }
                    that._convertData(data);
                    that._show();
                } else {
                    utility.thjkAlert("操作提示", msg);
                }
            });
        },
        _show: function () {
            var that = this;

            if (!this.isFirstOpen) {
                this.planView.refresh({ data: that.planPanelData });
            }
            else {
                this.isFirstOpen = false;
            }

            this.dialog(this).show();
        }
    };

    Sapi.expand("Module", { "PlanPanelProxy": nodeDataProxy });

    /**
     * 计划进度展示
     * 作者：张敏强
     */
    function planPanel(options) {
        options = options || {};

        this.$container = options.$container;
        if (!this.$container || !this.$container.length)
        {
            throw "传入容器对象为空";
        }

        if (this.$container.data("planPanel")) {
            return;
        }

        this.$container.addClass("plan-panel")
            .data("planPanel", this);

        /**
         * 分类 图形色块分类及刻度线（当前日期、计划完成日期）
         * {
         *      plan: {
         *          name:"基坑支护工程", color:"#68b6ea"
         *      }
         * }
         */
        this.categroy = options.categroy || {
            plan: { name: "计划进度", color: "#68b6ea" }, //计划
            onTime: { name: "实际进度(未延期)", color: "#7edf89" }, // 按期
            running: { name: "正在进行中", color: "#c4c9cd" }, // 进行中
            now: { name: "当前日期", color: "#3995d3", role: "line" },
            delay: { name: "实际进度(延期)", color: "#f06c7f" }, // 延期
            maxDate: { name: "计划完成日期", color: "#f06c7f", role:"line" }
        };

        /**
         * 数据源：
         * [{
         *      title 分组标题
         *      member 分组成员，成员categroy所属分类，
         *      start开始时间（字符串形式），end结束时间（字符串形式）
         *      后期添加属性 start_time 开始时间（日期形式）   end_time 结束时间（日期形式）
         * }]
         * [{title:"基坑支护工程", member:[{categroy:"plan", start:"", end: "", start_time:date, end_time:date }] }]
         */
        this.data = options.data || [];
        this._reSet();

        this._render();
    }

    planPanel.prototype = {
        _render: function () {
            var obj, now = utility.getNow(), html = [], plan=[];

            for (var i = 0, len = this.data.length; i < len; i++) {
                obj = this.data[i];
                
                if (obj["member"]) {
                    for (var j = 0, jLen = obj["member"].length; j < jLen; j++) {
                        obj["member"][j]["start_time"] = utility.parseDate(obj["member"][j]["start"]) || now;
                        // 结束日期加一天
                        obj["member"][j]["end_time"] = obj["member"][j]["end"] ?
                            utility.getDateByDaysApart(utility.parseDate(obj["member"][j]["end"]), 1) : now;

                        this._setMinDate(obj["member"][j]["start_time"]);
                        this._setMaxDate(obj["member"][j]["end_time"]);

                        if (obj["member"][j]["categroy"] === "plan") {
                            this._setMaxPlanDate(obj["member"][j]["end_time"]);
                        }
                    }
                }

                plan.push(this._getPlanHtml(obj, i));
            }

            html.push(this._getPlanTable().replace("{{plan}}", plan.join(""))
                .replace("{{scale}}", this._getScaleHtml()));
            html.push(this._getCategroyHtml());

            this.$container.empty().append($(html.join('')));
            this._renderData();
            this._renderDateLine();
        },
        _renderDateLine: function () {
            var $table = this.$container.children(".plan-table"), 
                $tfoot = $table.find("tfoot"),
                height = $table.height() - $tfoot.height(),
                that = this, now = utility.getNow();

            $tfoot.find(".maxdate-line").css({
                top: -height,
                height: height,
                display: "block",
                left: that._getDatePeriodWidth(that.minDate, that.maxPlanDate) + "%"
            });

            if (this.minScale <= now && now <= this.maxScale) {
                $tfoot.find(".now-line").css({
                    top: -height,
                    height: height,
                    display: "block",
                    left: that._getDatePeriodWidth(that.minDate, now) + "%"
                });
            }
        },
        _renderData: function () {
            var planPeriod = '<div class="plan-period" title="{{title}}" style="background-color:{{color}};left:{{left}};"></div>';
            var arr = [];
            var $trs = this.$container.find("table>tbody>tr"), $planPeriod;

            for (var i = 0, len = this.data.length; i < len; i++) {
                var obj = this.data[i];

                for (var j = 0, jLen = obj["member"].length; j < jLen; j++) {
                    $planPeriod = $(planPeriod.replace('{{color}}', this._getPlanPeriodColor(obj["member"][j]))
                        .replace('{{left}}', this._getDatePeriodWidth(this.minScale, obj["member"][j]["start_time"]) + "%")
                        .replace('{{title}}', obj["member"][j]["start"] + "至" + (obj["member"][j]["end"] || "今")));

                    $trs.eq(i).find(".plan-period-wrap").append($planPeriod);
                    $planPeriod.animate({ width: this._getDatePeriodWidth(obj["member"][j]["start_time"], obj["member"][j]["end_time"]) + "%" }, 500);
                }
            }
        },
        _getDatePeriodWidth: function (date1, date2) {
            return ((utility.getDatePeriod(date1, date2) / (10*this.scaleSpan)) * 100).toFixed(2);
        },
        _getPlanPeriodColor: function (member) {
            var categroy = this.categroy[member["categroy"]];
            if (categroy) {
                return categroy["color"];
            }

            return "";
        },
        _setMinDate:function(date){
            if (this.minDate) {
                if (date < this.minDate) {
                    this.minDate = date;
                }
            } else {
                this.minDate = date;
            }
        },
        _setMaxDate: function (date) {
            if (this.maxDate) {
                if (this.maxDate < date) {
                    this.maxDate = date;
                }
            } else {
                this.maxDate = date;
            }
        },
        _setMaxPlanDate: function (date) {
            if (this.maxPlanDate) {
                if (this.maxPlanDate < date) {
                    this.maxPlanDate = date;
                }
            } else {
                this.maxPlanDate = date;
            }
        },
        _getPlanTable: function () {
            var html = ['<table class="plan-table">',
                            '<colgroup>',
                                '<col style="width:120px"/>',
                                '<col />',
                            '</colgroup>',
                            '{{plan}}',
                            '{{scale}}',
                        '</table>'].join("");
            return html;
        },
        _getPlanHtml: function (data, index) {
            var html = ['<tr data-index="{{index}}">',
                            '<td class="td-plan-name">',
                                '<div class="plan-name">{{title}}</div>',
                            '</td>',
                            '<td  class="td-plan-period">',
                                '<div class="plan-period-wrap">',
                                '</div>',
                            '</td>',
                        '</tr>'].join("");

            return html.replace(/\{\{([a-zA-Z]*)\}\}/g, function (macth, word) {
                switch (word) {
                    case "index":
                        return index;
                    default:
                        return data[word];
                }
            });
        },
        _getCategroyHtml: function () {
            var html = ['<div class="category-wrap">'],
                categroy = '<div><span style="background-color:{{color}}">{{line}}</span>{{name}}</div>', that = this;

            for(var prop in this.categroy)
            {
                html.push(categroy.replace(/\{\{([a-zA-Z]*)\}\}/g, function (match, word) {
                    switch (word) {
                        case "line":
                            return that.categroy[prop]["role"] ? ('<span style="border-left:1px dashed ' + that.categroy[prop]["color"] + '"></span>') : '';
                        case "color":
                            return that.categroy[prop]["role"] ? "transparent" : that.categroy[prop][word];
                        default:
                            return that.categroy[prop][word];
                    }
                }))
            }

            html.push('</div>');

            return html.join("");
        },
        _generateScale: function () {
            /**
             * 以10个刻度为准, 最小刻度为1天
             */
            if (!this.minDate) {
                this.minScale = utility.parseDate(utility.fomartDateString(utility.getNow(), "yyyy-MM-dd"));
                this.maxScale = utility.getDateByDaysApart(this.minScale, 10);
                this.scaleSpan = 1;
                return;
            }

            var days = utility.getDatePeriod(this.minDate, this.maxDate);
            this.minScale = this.minDate;
            this.maxScale = this.maxDate;

            if (days < 10) {
                this.maxScale = utility.getDateByDaysApart(this.minDate, 10);
                this.scaleSpan = 1;
            } else {
                this.scaleSpan = Math.ceil(days / 10);
                this.maxScale = utility.getDateByDaysApart(this.minDate, this.scaleSpan * 10);
            }
        },
        _getScaleHtml: function () {
            var html = ['<tfoot>',
                            '<tr>',
                                '<td></td>',
                                '<td class="pl10 pr10">',
                                    '<div class="scale-wrap clearfix">',
                                        '{{scales}}',
                                    '</div>',
                                '</td>',
                            '</tr>',
                        '</tfoot>'].join(""),
                scale = ['<span class="scale">',
                             '<i class="scale-marker"></i>',
                             '<i class="scale-text">{{scaleDate}}</i>',
                             '{{lastScale}}',
                         '</span>'].join(""),
                lastScale = ['<i class="scale-marker last-marker"></i>',
                              '<i class="scale-text-last">{{scaleDate}}</i>'].join(""),
                date, i = 0, scaleHtml = [], that = this;

            this._generateScale();

            date = this.minScale;
            while (i < 10) {
                scaleHtml.push(scale.replace(/\{\{([a-zA-Z]*)\}\}/g, function (match, word) {
                    switch (word) {
                        case "scaleDate":
                            return utility.fomartDateString(date, "MM-dd");
                        case "lastScale":
                            return i === 9 ? lastScale.replace("{{scaleDate}}", utility.fomartDateString(utility.getDateByDaysApart(date, that.scaleSpan), "MM-dd")) : '';
                    }
                }));

                i = i + 1;
                date = utility.getDateByDaysApart(date, this.scaleSpan);
            }

            scaleHtml.push('<div class="date-line maxdate-line"></div><div class="date-line now-line"></div>')


            return html.replace("{{scales}}", scaleHtml.join(""));
        },
        _reSet: function () {
            // 最小日期
            this.minDate = null;
            // 最大日期
            this.maxDate = null;
            // 计划日期的最大时间
            this.maxPlanDate = null;
            // 最小刻度
            this.minScale = null;
            // 最大刻度
            this.maxScale = null;
            // 刻度间距
            this.scaleSpan = null;
        },
        refresh: function (options) {
            options = options || {};
            if (options.categroy) {
                this.categroy = options.categroy;
            }
            if (options.data) {
                this.data = options.data;
            }
            this._reSet();
            this._render();
        }
    };

    Sapi.expand("Control", { "PlanPanel": planPanel });
})(jQuery, Sapi);