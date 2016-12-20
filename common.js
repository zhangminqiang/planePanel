;
/**
 * @module Sapi
 * @author zhangmq
 */
var Sapi = {};
(function (Sapi) {
    /**
     * 顶级命名空间，包含工具类方法（utility)、控件集合（Control)、$doc（document的jquery对象）、
     *  win(window对象)、$win(window的jquery对象）
     * @class Sapi
     * @static
     */
    Sapi = Sapi || {};

    /**
     * 根据字符串获取命名空间对象
     * @method namespace
     * @param namespace {string} 命名空间名称
     * @return {object} 返回指定Sapi属性下的对象或值
     * @example
     *    var utility = Sapi.namespace("utility");
     */
    Sapi.namespace = function (namespace) {
        namespace = namespace || "";

        var names = namespace.split("."), root = Sapi;

        if (names.length === 0) {
            return root;
        }

        for (var i = (names[0] === "Sapi" ? 1 : 0), len = names.length; i < len; i++) {
            root[names[i]] = root[names[i]] || {};

            root = root[names[i]];
        }

        return root;
    };

    /**
     * 扩展Sapi属性方法
     * @method expand
     * @param namespace {string} 指定需要添加属性的命名空间
     * @param obj {object} 属性集合对象，指定添加的属性和方法
     * @param cover {boolean} 是否覆盖已存在的属性，默认不覆盖，需覆盖可传true
     * @static
     * @example 
     *      function dataGrid(){
     * 
     *      }
     *      // 添加DataGrid构造函数到Control下
     *      Sapi.expand("Control", {"DataGrid":dataGrid});
     */
    Sapi.expand = function (namespace, obj, cover) {
        var root = Sapi.namespace(namespace);

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (root.hasOwnProperty(prop) && !cover) {
                    continue;
                }

                root[prop] = obj[prop];
            }
        }
    };

    /**
     * 共用方法类
     * @property utility
     * @type Object
     */
    Sapi.utility = null;

    /**
     * document的jquery对象
     * @property $doc
     * @type jQuery
     * @example
     *    
     *      var $doc = Sapi.$doc;
     */
    Sapi.$doc = $(document);

    /**
     * window对象
     * @property win
     * @type DOM
     */
    Sapi.win = window;

    /**
     * window对象的jQuery对象
     * @property win
     * @type DOM
     */
    Sapi.$win = $(Sapi.win);

    /**
     * 控件类，所有sapi控件都指定到Sapi.Control下
     * @property Control
     * @type Object
     * @example
     *  
     *      Sapi.expand("Control", {"DataGrid":dataGrid});
     */
    Sapi.Control = {};
})(Sapi);

/**
 * 工具类:通用方法
 * @class utility
 * @namespace Sapi
 */
(function (Sapi) {
    var utility = {};

    /**
     * 数字转千分位
     * @method toThousands 
     * @param num {string||number} 需转换的字符串或数字，如果字符串不能转换成数字，返回空字符串
     * @param fixed {number} 保留小数位数，可不传
     * @return String
     * @example
     *   实例1：传字符串
     *   Sapi.utility.toThousands("20000"); //20,000
     *   实例2：传字符串，限定小数位数
     *   Sapi.utility.toThousands("20000", 2); //20,000.00 
     *   实例3：传数字
     *   Sapi.utility.toThousands(20000); //20,000
     *   实例4：传数字，限定小数位数
     *   Sapi.utility.toThousands(20000, 2); //20,000.00 
     */
    utility.toThousands = function (num, fixed) {
        var result = "", decimals, integer, pointIndex, isMinus;
        if (utility.isString(num)) {
            num = num.replace(/,/g, "");
        }

        if (!utility.isNumeric(num)) { return ""; }
        isMinus = parseFloat(num) < 0;
        // 保留小数位
        if (fixed) {
            num = parseFloat(num).toFixed(fixed);
        }
        num = num.toString().replace("-", "")
        pointIndex = num.lastIndexOf('.');
        if (pointIndex !== -1) {
            decimals = num.substring(pointIndex + 1, num.length);
            integer = num.substring(0, pointIndex);
        } else {
            integer = num;
        }

        while (integer.length > 3) {
            result = ',' + integer.slice(-3) + result;
            integer = integer.slice(0, integer.length - 3);
        }

        if (integer) {
            result = integer + result;
        }

        if (pointIndex > 0) {
            result += "." + (decimals || "");
        }

        return (isMinus ? "-" : "") + result;
    };

    /**
     * 转为有效数字，目的是去掉千分位(,)
     * @method toNumber
     * @param num {string} 需转换数字或字符串
     * @return string
     * @throws new Error("数字转换失败")
     * @example
     *   var num = "20,000.00";
     *   num = Sapi.utility.toNumber(num);
     *   console.log(num); // "20000.00"
     */
    utility.toNumber = function (num) {
        try {
            num = num.replace(/,/g, "");

            if (utility.isNumeric(num)) {
                return num;
            }
        } catch (e) {
        }

        throw "数字转换失败";
    }

    /**
     * 字符串转日期 
     * @method parseDate
     * @param strDate {string} 格式为：yyyy-MM-dd hh:mm，不符合规格返回null
     * @return Date || null
     * @example
     *    var date = utility.parseDate("2016-11-30 09:00");
     *    date = utility.parseDate("2016-11-30");
     *    date = utility.parseDate("2016年10月30日09时30分");
     *    date = utility.parseDate("2016年10月30日");
     */
    utility.parseDate = function (strDate) {
        var arr, arrDateInfo, arrTimeInfo;
        if (typeof strDate === "undefined" || strDate === "") { return null; }

        try {
            strDate = strDate.replace("年", "-").replace("月", "-").replace("日", " ")
                    .replace("时", ":").replace("分", "");

            arr = strDate.split(" ");
            arrDateInfo = arr[0].split("-"),
                    arrTimeInfo = ((arr.length > 1) && arr[1].split(":")) || [0, 0];

            return new Date(arrDateInfo[0], (arrDateInfo.length > 0 ? parseInt(
                    arrDateInfo[1], 10) - 1 : 0), (arrDateInfo.length > 2
                    ? (arrDateInfo[2] || 1) : 1), arrTimeInfo[0], arrTimeInfo[1],
                    arrTimeInfo[2] || "");
        } catch (ex) {
            return null;
        }
    };

    /**
     * 日期转换字符串格式
     * @method fomartDateString
     * @param date {Date}
     * @param fmt {string}
     * @return String
     * @example
     *    var dateStr = utility.fomartDateString(new Date(), "yyyy-MM-dd");
     *      dateStr = utility.fomartDateString(new Date(), "yyyy-MM-dd hh:mm");
     */
    utility.fomartDateString = function (date, fmt) {
        var o = {
            "M+": date.getMonth() + 1, // 月份
            "d+": date.getDate(), // 日
            "h+": date.getHours(), // 小时
            "m+": date.getMinutes(), // 分
            "s+": date.getSeconds()
            // 秒
        };

        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "")
                    .substr(4 - RegExp.$1.length));
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k])
                        : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    };

    /**
     * 获取当前时间
     * @method getNow
     * @return Date
     * @example
     *    var now = utility.getNow();
     */
    utility.getNow = function () {
        return new Date();
    };

    /**
     * 获取两个日期相隔天数
     * @method getDatePeriod
     * @param start {Date}
     * @param end {Date}
     * @return Number
     *    var utility = Sapi.utility;
     *    var date1 = utility.parseDate("2016-11-29");
     *    var date2 = utility.parseDate("2016-11-30");
     *    var period = utility.getDatePeriod(date1, date2); // return 1
     */
    utility.getDatePeriod = function (start, end) {
        return Math.abs(start * 1 - end * 1) / 60 / 60 / 1000 / 24
    };

    /**
     * 获取相隔几天后的日期
     * @method getDateByDaysApart
     * @param date {Date}
     * @param number {number}
     * @return Date
     * @example
     *   var threeDaysLater = utility.getDateByDaysApart(new Date(), 3);
     */
    utility.getDateByDaysApart = function (date, number) {
        return new Date(date.getTime() + 60 * 60 * 1000 * 24 * number);
    }

    /**
     * 获取某个月得第一天
     * @method getFirstDayInMonth
     * @param date {string||date} 
     * @return Date 
     * @throws "传入参数不正确。"
     * @example 
     *  var currMonthFirstDay = utility.getFirstDayInMonth(new Date());
     */
    utility.getFirstDayInMonth = function (date) {
        if (!utility.isDate(date)) {
            date = utility.parseDate(date);

            if (!date) {
                throw "传入参数不正确。"
            }
        }

        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * 获取某个月得第一天
     * @method getLastDayInMonth
     * @param date {string||date} 
     * @return Date 
     * @throws "传入参数不正确。"
     * @example 
     *  var currMonthLastDay = utility.getFirstDayInMonth(new Date());
     */
    utility.getLastDayInMonth = function (date) {
        if (!utility.isDate(date)) {
            date = utility.parseDate(date);

            if (!date) {
                throw "传入参数不正确。"
            }
        }

        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    /**
     * 日期转换成季度
     * @method parseQuarter
     * @param date {string||date} 
     * @return string
     * @throws null  
     * @example 
     *  var quarter = utility.parseQuarter("2016-09-30");
     *  console.log(quarter); // 2016年第3季度  
     */
    utility.parseQuarter = function (date) {
        if (utility.isString(date)) {
            date = utility.parseDate(date);
        }

        if (utility.isDate(date)) { return utility.getQuarterText(date); }

        return null;
    };

    /**
     * 获取季度文本名称
     * @method getQuarterText
     * @param date {date} 
     * @return string
     * @throws "utility.getQuarterText传入参数不是日期类型" 
     * @example 
     *  var quarter = utility.getQuarterText(utility.parseDate("2016-09-30"));
     *  console.log(quarter); // 2016年第3季度  
     */
    utility.getQuarterText = function (date) {
        if (!utility.isDate(date)) {
            throw "utility.getQuarterText传入参数不是日期类型"
        }

        var text = date.getFullYear() + "年";

        switch (date.getMonth()) {
            case 0:
            case 1:
            case 2:
                text += "第1季度";
                break;
            case 3:
            case 4:
            case 5:
                text += "第2季度";
                break;
            case 6:
            case 7:
            case 8:
                text += "第3季度";
                break;
            case 9:
            case 10:
            case 11:
                text += "第4季度";
                break;
        }

        return text;
    };

    /**
     * 异步请求
     * @method ajax
     * @param url {string} 请求地址
     * @param date {object} 请求参数
     * @param success {function} 请求成功回调函数
     * @param dataType {string} 请求数据类型，例如，html/json
     * @param type {string} 请求方式， 例如，GET/POST
     * @param beforeSend {function} 请求之前调用函数，可用于添加动态图效果
     * @param error {function} 发生错误执行函数
     * @param complete {funciton} 请求完成函数
     * @param contentType {string} 请求内容的类型：application/json;charset=utf-8
     * @async
     * @example 
     *   utility.ajax("/user/getSessionInfo.do", {}, function(data){
     *       if(data["code"]===200)
     *       {
     *              // 执行成功函数
     *        }
     *   }, "json", "GET");
     */
    utility.ajax = function (url, data, success, dataType, type, beforeSend,
            error, complete, contentType) {
        var defaultEvent = {
            beforeSend: function (xhr) {
            },
            error: function (xhr, textStatus, errorThrown) {
                var status = 0, msg = "";
                switch (xhr.status) {
                    case (500):
                        // TODO 服务器系统内部错误
                        msg = "系统内部错误，请联系网站管理员。";
                        status = 500;
                        break;
                    case (401):
                        // TODO 未登录
                        msg = "请登录。";
                        status = 401;
                        break;
                    case (403):
                        // TODO 无权限执行此操作
                        msg = "无权限执行此操作。";
                        status = 403;
                        break;
                    case (408):
                        // TODO 请求超时
                        msg = "请求超时。"
                        status = 408;
                        break;
                    case (0):
                        // TODO cancel
                        break;
                    default:
                        status = 1;
                        // TODO 未知错误
                }
                if (status > 0) {
                    Sapi.basePage
                            && Sapi.basePage.prompt("系统提示",
                                    "请联系网站管理员，错误代码：" + xhr.status, [{
                                        name: "关闭",
                                        click: function () {
                                            Sapi.basePage.closePrompt();
                                            Sapi.basePage.setNextBtnEnable();
                                        }
                                    }]);
                }
            },
            complete: function (xhr, textStatus) {
                if (typeof (xhr) !== 'undefined') {
                    var responseText = xhr.getResponseHeader("X-Responded-JSON");
                    if (responseText != null) {
                        Sapi.basePage && Sapi.basePage.prompt("系统提示", "登录超时，请重新登录。", [{
                            name: "关闭",
                            click: function () {
                                Sapi.basePage.closePrompt();
                                Sapi.basePage.setNextBtnEnable();
                            }
                        }]);
                    }
                }
            }
        }, options;

        url = url + (url.indexOf("?") === -1 ? "?" : "&") + "_=" + (new Date()).getTime();

        options = {
            url: url,
            dataType: dataType || "json",
            data: data || {},
            success: success,
            type: type || 'POST',
            //contentType: 'application/json;charset=utf-8',
            error: error || defaultEvent.error,
            beforeSend: beforeSend || defaultEvent.beforeSend,
            // cache: false,
            complete: complete || defaultEvent.complete
        };

        contentType && (options.contentType = contentType);

        $.ajax(options);
    };

    /**
     * 获取登录信息
     * @method getSessionInfo
     * @param callback {function} 请求成功回调函数，默认带入三个参数function(bSuccess, msg, data){}
     * @async
     */
    utility.getSessionInfo = function (callback) {
        utility.ajax("/user/getSessionInfo.do", {}, function (msg, status) {
            callback(msg["code"] == 200 ? true : false, msg["msg"], msg["data"], msg["code"]);
        }, "json", "GET");
    }

    /**
     * 异步获取js脚本
     * @method getScript
     * @param url {string} 请求地址
     * @param success {function} 请求回调成功方法
     * @async
     */
    utility.getScript = function (url, success) {
        this.ajax(url, null, success, "script", "GET");
    };

    /**
     * 异步获取html
     * @method getHtml
     * @param url {string} 请求url
     * @param success {function} 请求成功回调
     * @async
     */
    utility.getHtml = function (url, success) {
        this.ajax(url, null, success, "html", "GET");
    };

    /**
     * post/get请求回发函数
     * @method requestCallback
     * @private
     */
    function requestCallback(data, callback, xhr) {
        if (data["code"] === 400) {
            // 去验证是否处于登录状态：登录状态说明没权限
            utility.getSessionInfo(function (success, msg, data) {
                if (success) {
                    utility.jumpPage("/unauthorized.html");
                } else {
                    var alert, isThjk = location.pathname.indexOf("/thjk/") !== -1;
                    if (isThjk) {
                        alert = "thjkAlert";
                    } else {
                        alert = "redAlert";
                    }
                    utility[alert]("温馨提示", "当前处于未登录状态，请先登录。", function () {
                        /* utility.jumpPage("/member/login.html?frompage="
                         + encodeURIComponent(window.location.pathname + window.location.search))*/
                        if (isThjk) {
                            utility.jumpPage("/member/login.html?frompage="
                        + encodeURIComponent(window.location.pathname + window.location.search));
                        }
                        else {
                            $(".login").trigger("click");
                        }
                    });
                }
            });
            return false;
        }

        utility.isFunction(callback) && callback(data["code"] === 200 ? true : false, data["msg"], data["data"], xhr);
        return true;
    };

    /**
     * 验证是否登录，处理后端返回400，需确认是否用户是否登录状态，
     * 不是通过utility.post、utility.get请求的异步方法都需加此方法
     * @method verifyLogining
     * @param data {object} 请求返回数据
     * @param callback {function} 回调函数
     * @param xhr {object} xhr请求对象
     * @example 
     * utility.ajax(url, data, function (data, status, xhr) {
                requestCallback(data, callback, xhr);
            });
     */
    utility.verifyLogining = requestCallback;

    /**
     * post异步获取数据
     * @method post
     * @param url {string} 请求地址
     * @param data {object} 请求参数对象
     * @param callback {function} 请求成功回调function(@bSuccess, @msg, @data)
     * @param contentType {boolean} 请求内容类型，默认false，为true时，请求参数需JSON2.stringify()处理
     * @async
     * @throws "调用Sapi.utility.post参数错误";
     */
    utility.post = function (url, data, callback, contentType, type) {
        if (utility.isString(url) && url !== "") {
            utility.ajax(url, data, function (data, status, xhr) {
                requestCallback(data, callback, xhr);
            }, void 0, type ? type : void 0, void 0,
            void 0, void 0, contentType ? 'application/json;charset=utf-8' : void 0);
        }
        else {
            throw "调用Sapi.utility.post参数错误";
        }
    };

   /**
    * get异步获取数据
    * @method get
    * @param url {string} 请求地址
    * @param data {object} 请求参数对象
    * @param callback {function} 请求成功回调function(@bSuccess, @msg, @data)
    * @async
    * @throws "调用Sapi.utility.get参数错误";
    */
    utility.get = function (url, data, callback) {
        if (utility.isString(url) && url !== "" && utility.isFunction(callback)) {
            utility.ajax(url, data, function (data, status, xhr) {
                requestCallback(data, callback, xhr);
            }, void 0, "GET");
        }
        else {
            throw "调用Sapi.utility.get参数错误";
        }
    };

    /**
     * 判断是否数组类型
     * @method isArray 
     * @param data 
     * @return boolean
     */
    utility.isArray = function (data) {
        return Object.prototype.toString.call(data) === "[object Array]";
    };

    /**
     * 判断是否NaN值
     * @method isNaN 
     * @param data 
     * @return boolean
     */
    utility.isNaN = function (data) {
        return data !== data;
    };

    /**
     * 判断是否undefined
     * @method isUndefined 
     * @param data 
     * @return boolean
     */
    utility.isUndefined = function (data) {
        return data === void 0;
    };

    /**
     * 判断是否null值
     * @method isNull 
     * @param data 
     * @return boolean
     */
    utility.isNull = function (data) {
        return data === null;
    };

    /**
     * 判断是否有效数字
     * @method isNumeric 
     * @param data 
     * @return boolean
     */
    utility.isNumeric = function (data) {
        // return !isNaN(parseFloat(data)) && isFinite(data);
        return data - parseFloat(data) >= 0;
    };

    /**
     * 判断是否整数类型
     * @method isInt 
     * @param data 
     * @return boolean
     */
    utility.isInt = function (data) {
        return utility.isNumeric(data) && (String(data).indexOf(".") == -1);
    };

    /**
     * 判断是否正整数类型
     * @method isPositiveInt 
     * @param data 
     * @return boolean
     */
    utility.isPositiveInt = function (data) {
        return utility.isInt(data) && (parseInt(data, 10) > 0);
    };

    /**
     * 判断是否日期类型
     * @method isDate 
     * @param data 
     * @return boolean
     */
    utility.isDate = function (data) {
        return Object.prototype.toString.call(data) === "[object Date]"
                && data.toString() !== "Invalid date" && !utility.isNaN(data);
    };

    /**
     * 判断是否字符串类型
     * @method isString 
     * @param data 
     * @return boolean
     */
    utility.isString = function (data) {
        return Object.prototype.toString.call(data) === "[object String]";
    };

    /**
     * 判断是否函数
     * @method isFunction 
     * @param data 
     * @return boolean
     */
    utility.isFunction = function (fun) {
        return typeof fun === "function";
    };

    /**
     * 判断是否boolean类型
     * @method isBoolean 
     * @param data 
     * @return boolean
     */
    utility.isBoolean = function (data) {
        return typeof data === "boolean";
    };

    /**
     * 判断是否对象类型
     * @method isObject 
     * @param data 
     * @return boolean
     */
    utility.isObject = function (data) {
        return typeof data === "object";
    };

    /**
     * 判断是否jquery对象类型
     * @method isjQuery 
     * @param data 
     * @return boolean
     */
    utility.isjQuery = function (data) {
        return data instanceof jQuery;
    };

    /**
     * 当前页跳转
     * @method jumpPage 
     * @param url {string} 跳转地址 
     * @example
     *  utility.jumpPage("/index.html");// 跳转首页
     */
    utility.jumpPage = function (url) {
        window.location.assign(url);
    };

    /**
     * 获取当前页url传参
     * @method getQueryParam 
     * @param name {string} 参数名称 
     * @return string||undefined
     * @example
     *  // 假设当前页地址是 http://www.sapyt.com/index.html?id=1234134
     *  console.lgo(utility.getQueryParam("id"));// 1234134
     *  console.lgo(utility.getQueryParam("name")); // undefined
     */
    utility.getQueryParam = function (name) {
        var param = window.location.search.substr(1);
        if (!param) {
            return void 0;
        }

        return utility.getSearchParam(param, name);
    };

    /**
     * 获取指定url上的传参
     * @method getSearchParam
     * @param url {string} url地址 
     * @param name {string} 参数名称 
     * @throws "utility.getSearchParam参数数据"
     * @return string||undefined
     * @example
     *  // 假设当前页地址是 http://www.sapyt.com/index.html?id=1234134
     *  console.lgo(utility.getSearchParam("index.html?id=1234134", "id"));// 1234134
     *  console.lgo(utility.getQueryParam("index.html?id=1234134", "name")); // undefined
     */
    utility.getSearchParam = function (url, name) {
        if (arguments.length !== 2) {
            throw "utility.getSearchParam参数数据"
        }

        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = url.match(reg);

        if (r != null) {
            return unescape(r[2]);
        }

        return void 0;
    };

    /**
     * 消息弹出层，仅有一个确认按钮。适用于后端返回错误消息
     * @method alert
     * @param title {string} 提示框标题
     * @param msg {string} 提示内容，可传html
     * @param closeCallback {function} 关闭弹出层执行方法，可不传
     * @param width {string} 弹出层宽度
     * @param className {string} 指定弹出层样式，现有默认样式、"redAlert"、"thjk"三种
     * @requires Sapi.Control.PromptBox
     * @example
     *      utility.alert("温馨提示", "当前处于未登录状态，请登录了再试。");
     *      utility.alert("温馨提示", "当前处于未登录状态，请登录了再试。", function(){ //窗口已关闭 });
     *      utility.alert("温馨提示", "当前处于未登录状态，请登录了再试。", void 0, "400px");
     *      utility.alert("温馨提示", "当前处于未登录状态，请登录了再试。", void 0, "400px", "redAlert");
     */
    utility.alert = function (title, msg, closeCallback, width, className) {
        try {
            Sapi.Control.PromptBox.alert(title, msg, closeCallback, width, className);
        } catch (e) {
            alert(msg);
            utility.isFunction(closeCallback) && closeCallback();
        }
    };

    /**
     * 门户页消息弹出层（redAlert， 偏红色）
     * @method redAlert
     * @param title {string} 提示框标题
     * @param msg {string} 提示内容，可传html
     * @param closeCallback {function} 关闭弹出层执行方法，可不传
     * @example
     *      utility.redAlert("温馨提示", "当前处于未登录状态，请登录了再试。");
     *      utility.redAlert("温馨提示", "当前处于未登录状态，请登录了再试。", function(){ //窗口已关闭 });
     */
    utility.redAlert = function (title, msg, closeCallback) {
        utility.alert(title, msg, closeCallback, "360px", "redAlert");
    };

    /**
     * 投后监控页消息弹出层（redAlert， 浅蓝灰色）
     * @method thjkAlert
     * @param title {string} 提示框标题
     * @param msg {string} 提示内容，可传html
     * @param closeCallback {function} 关闭弹出层执行方法，可不传
     * @example
     *      utility.thjkAlert("温馨提示", "当前处于未登录状态，请登录了再试。");
     *      utility.thjkAlert("温馨提示", "当前处于未登录状态，请登录了再试。", function(){ //窗口已关闭 });
     */
    utility.thjkAlert = function (title, msg, closeCallback) {
        utility.alert(title, msg, closeCallback, "360px", "thjk");
    };

    /**
     * 确认弹出层，默认有一个【确认】按钮和【取消】按钮
     * @method confirm
     * @param title {string} 提示框标题
     * @param msg {string} 提示内容，可传html
     * @param confirmCallback {function} 点击确认按钮执行方法，有两个参数：function(@closefun, $confirmBtn)
     * @param width {string} 弹出层宽度
     * @param className {string} 指定弹出层样式，现有默认样式、"redAlert"、"thjk"三种
     * @requires Sapi.Control.PromptBox
     * @example
     *      utility.confirm("操作提示", "确认删除当前数据吗？", function(closeFun, $btn){ 
     *           // 防止重复提交
     *           if(utility.btnDisabled($btn))
     *           {
     *              return;
     *           }
     *           utility.btnDisabled($btn, true);
     *           // 执行某些操作
     *           utility.btnDisabled($btn, false);
     *           closeFun();//顺利执行完成，关闭提示框
     *      });
     */
    utility.confirm = function (title, msg, confirmCallback, width, className) {
        try {
            Sapi.Control.PromptBox.confirm(title, msg, confirmCallback, width, className);
        } catch (e) {
            if (confim(msg)) {
                utility.isFunction(confirmCallback) && confirmCallback();
            }
        }
    };

    /**
     * 门户页确认弹出层
     * @method redConfirm
     * @param title {string} 提示框标题
     * @param msg {string} 提示内容，可传html
     * @param confirmCallback {function} 点击确认按钮执行方法，有两个参数：function(@closefun, $confirmBtn)
     * @requires Sapi.Control.PromptBox
     * @example
     *      utility.redConfirm("操作提示", "确认删除当前数据吗？", function(closeFun, $btn){ 
     *           // 防止重复提交
     *           if(utility.btnDisabled($btn))
     *           {
     *              return;
     *           }
     *           utility.btnDisabled($btn, true);
     *           // 执行某些操作
     *           utility.btnDisabled($btn, false);
     *           closeFun();//顺利执行完成，关闭提示框
     *      });
     */
    utility.redConfirm = function (title, msg, confirmCallback) {
        utility.confirm(title, msg, confirmCallback, "360px", "redAlert");
    };

    /**
     * 投后监控确认弹出层
     * @method redConfirm
     * @param title {string} 提示框标题
     * @param msg {string} 提示内容，可传html
     * @param confirmCallback {function} 点击确认按钮执行方法，有两个参数：function(@closefun, $confirmBtn)
     * @requires Sapi.Control.PromptBox
     * @example
     *      utility.thjkConfirm("操作提示", "确认删除当前数据吗？", function(closeFun, $btn){ 
     *           // 防止重复提交
     *           if(utility.btnDisabled($btn))
     *           {
     *              return;
     *           }
     *           utility.btnDisabled($btn, true);
     *           // 执行某些操作
     *           utility.btnDisabled($btn, false);
     *           closeFun();//顺利执行完成，关闭提示框
     *      });
     */
    utility.thjkConfirm = function (title, msg, confirmCallback) {
        utility.confirm(title, msg, confirmCallback, "360", "thjk")
    };

    /**
     * 等待提示框，需长时间等待时可用
     * @method waiting
     * @param msg {string||boolean} 传string提示消息或者传boolean关闭等待提示框
     * @param fun {function} 间隔调用方法，该方法会默认接受当前的消息内容，返回必须是新消息内容function(@message) {return @newMessage}
     * @requires Sapi.Control.PromptBox
     * @example 
     *      utility.waiting("当前正在导入数据，请稍等。");// 显示提示层
     *      utility.post(url, {}, function(bSuccess, msg,data){
     *          utility.waiting(false);// 关闭提示层
     *      });
     */
    utility.waiting = function (msg, fun) {
        try {
            Sapi.Control.PromptBox.waiting(msg, fun);
        } catch (e) {
        }
    };

    /**
     * 保存cookie方法
     * @property cookie
     * @namespace utility
     * @private
     */
    utility.cookie = {};

    /**
     * 设置cookie
     * @method cookie.set
     * @namespace utility
     * @param name {string} 设置cookie名称
     * @param value {string} 设置cookie值
     * @param expiredays {number} 过期天数
     * @example
     *      utility.cookie.set("userId", "13413413");
     *      utility.cookie.set("userId", "13413413", 1); 
     *      utility.cookie.set("userId", "13413413", -1); // 使cookie失效
     */
    utility.cookie.set = function (name, value, expiredays) {
        var date;

        if (utility.isInt(expiredays)) {
            date = new Date();
            date.setDate(date.getDate() + expiredays);
        }

        document.cookie = name + "=" + escape(value)
                + (!date ? "" : ";expires=" + date.toGMTString());
    };

    /**
     * 设置cookie
     * @method cookie.get
     * @namespace utility
     * @param name {string} 设置cookie名称
     * @return string
     * @example
     *      utility.cookie.set("userId", "13413413");
     *      console.log(utility.cookie.get("userId")); // "13413413"
     */
    utility.cookie.get = function (name) {
        var arr = document.cookie
                .match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));

        if (arr != null) { return unescape(arr[2]); }

        return null;
    }

    /**
     * ie文档对象加载完成
     * @method ieContentLoaded
     * @param w {window}
     * @param fn {function} 执行方法
     * @private
     */
    utility.ieContentLoaded = function (w, fn) {
        var d = w.document, done = false, init = function () {
            if (!done) {
                done = true;
                fn();
            }
        };

        (function () {
            try {
                d.documentElement.doScroll("left");
            } catch (e) {
                setTimeout(arguments.callee, 50);
                return;
            }
        })();

        d.onreadystatechange = function () {
            if (d.readState === "complete") {
                d.onreadystatechange = null;
                init();
            }
        };
    };

    /**
     * 获取控件html模板
     * @method htmlTemplate
     * @deprecated
     */
    utility.htmlTemplate = (function () {
        var htmlTemplate = {}, input = {
            "Default": ('<div class="form-wrap{$required}">'
                    + '{$star}<input class="input" type="text" value="{$value}">'
                    + '</div>')
        }, button = {
            "Default": '<button class="btn btn-default{$cssClass}"><span>{$text}</span></button>',
            "Add": '<button class="btn btn-icon btn-add"><span>新增</span></button>',
            "AddIcon": '<button class="btn btn-add icon-alone" title="新增"><span>新增</span></button>',
            "AddChildren": '<button class="btn btn-icon btn-index"><span>新增子集</span></button>',
            "AddChildrenIcon": '<button class="btn icon-alone btn-index" title="新增子集"><span>新增子集</span></button>',
            "Edit": '<button class="btn btn-icon btn-edit"><span>编辑</span></button>',
            "EditIcon": '<button class="btn btn-edit icon-alone" title="编辑"><span>编辑</span></button>',
            "Delete": '<button class="btn btn-icon btn-delete"><span>删除</span></button>',
            "DeleteIcon": '<button class="btn btn-delete icon-alone" title="删除"><span>删除</span></button>',
            "Move": '<button class="btn btn-icon btn-move"><span>移动</span></button>',
            "MoveIcon": '<button class="btn icon-alone btn-move" title="移动"><span>移动</span></button>',
            "Data": '<button class="btn btn-icon btn-clouddata"><span>数据</span></button>',
            "DataIcon": '<button class="btn icon-alone btn-clouddata" title="数据"><span>数据</span></button>',
            "UpdateData": '<button class="btn btn-icon btn-updatedata"><span>更新数据</span></button>',
            "UpdateDataIcon": '<button class="btn icon-alone btn-updatedata" title="更新数据"><span>更新数据</span></button>',
            "BatchImport": '<button class="btn btn-icon btn-batchimport"><span>批量导入</span></button>',
            "BatchImportIcon": '<button class="btn icon-alone btn-batchimport" title="批量导入"><span>批量导入</span></button>',
            "Export": '<button class="btn btn-icon btn-export"><span>导出</span></button>',
            "ExportIcon": '<button class="btn icon-alone btn-export" title="导出"><span>导出</span></button>',
            "Import": '<button class="btn btn-icon btn-import"><span>导入</span></button>',
            "ImportIcon": '<button class="btn icon-alone btn-import" title="导入"><span>导入</span></button>',
            "AddField": '<button class="btn btn-icon btn-add-field"><span>新增字段</span></button>',
            "AddFieldIcon": '<button class="btn icon-alone btn-add-field" title="新增字段"><span>新增字段</span></button>',
            // 授权
            "Authorize": '<button class="btn btn-icon btn-authorize"><span>授权</span></button>',
            "AuthorizeIcon": '<button class="btn icon-alone btn-authorize" title="授权"><span>授权</span></button>',
            "DownLoad": '<button class="btn btn-icon btn-authorize"><span>下载</span></button>'
        };

        htmlTemplate.getButton = function (type, text, cssClass) {
            if (utility.isArray(type)) {
                var html = [];

                for (var i = 0, len = type.length; i < len; i++) {
                    html.push(htmlTemplate.getButton(type[i], text, cssClass));
                }

                return html.join("");
            } else if (button[type]) {
                if (type === "Default") {
                    return button[type].replace("{$text}", text || "按钮").replace(
                            "{$cssClass}", cssClass ? (" " + cssClass) : "");
                } else {
                    return button[type];
                }
            }

            return "";
        };

        htmlTemplate.getInput = function (type, value, bRequired) {
            if (input[type]) {
                if (type === "Default") {
                    return input[type].replace("{$value}", value || "").replace(
                            "{$required}", bRequired ? (" required") : "").replace(
                            "{$star}", bRequired ? ('<span class="star">*</span>') : "");
                } else {
                    return button[type];
                }
            }

            return "";
        };

        htmlTemplate.getRadioGroup = function () {

        };

        htmlTemplate.getDropList = function () {
            // <div class="sapi-droplist droplist-filter mr20">
            // <span class="select-value" kd-value="0"
            // kd-text="请选择更新频率">请选择更新频率</span><span
            // class="del-operator"></span>
            // <ul class="data-list">
            // <li class="text-nowrap droplist-select"
            // kd-value="0"><div>请选择更新频率</div></li>
            // <li class="text-nowrap" kd-value="1"><div>年</div></li>
            // <li class="text-nowrap" kd-value="2"><div>月</div></li>
            // <li class="text-nowrap" kd-value="3"><div>日</div></li>
            // </ul>
            // </div>
        };

        return htmlTemplate;
    })(utility);

    /**
     * 获取jquery日期控件选择配置项
     * @method getDatepickerOption
     * @param selectCallback {function} 日期选择函数，选中日期、今天、清空。
     *      funciton(@strDate, @input)默认参数date字符串和输入框元素对象
     * @param minDate {date||string} 最小日期，不传不限制最小值
     * @param maxDate {date||string} 最大日期，不传不限制最大值
     * @return object
     * @example 
     *   $("#date").datepicker(utility.getDatepickerOption(function(strDate){
     *       console.log(strDate); // 打印选中日期
     *   }));
     */
    utility.getDatepickerOption = function (selectCallback, minDate, maxDate) {
        var defaultOpts = {
            altFormat: "yy-mm-dd",
            changeMonth: true,
            currentText: "今天",
            closeText: "清除",
            showButtonPanel: true,
            nextText: "下一月",
            prevText: "上一月",
            // defaultDate: defaultDate,
            onClose: function (input, dp) {
                input.value = "";
            },
            onSelect: null,
            showOtherMonths: true,
            selectOtherMonths: true,
            selectOtherYears: true,
            changeYear: true,
            defaultDate: null
        };
        // 传入第一个参数是函数
        if (utility.isFunction(selectCallback)) {
            defaultOpts["onSelect"] = selectCallback;
            defaultOpts["onClear"] = selectCallback;
        } else if (utility.isObject(selectCallback)) {
            defaultOpts = $.extend(true, defaultOpts, selectCallback);
        }

        minDate && (defaultOpts["minDate"] = minDate);
        maxDate && (defaultOpts["maxDate"] = maxDate);

        return defaultOpts;
    };

    /**
     * 根据fileId下载文件
     * @method downloadFile
     * @param fileId {string} 
     * @deprecated
     */
    utility.downloadFile = function (fileId) {
        utility.downloadFileBySrc(Sapi.DB.g("downloadFile") + "?mongodbId=" + fileId)
    };

    /**
     * 根据src下载文件
     * @method downloadFileBySrc
     * @param src {string}
     * @example
     * // 下载模板
        Sapi.$doc.on("click", ".link-detail", function () {
            var src = Sapi.DB.g("getProfitPlanExcel") + "?moduleId=" + Sapi.Module.Nav.getModuleId(2);
            utility.downloadFileBySrc(src);
        }); 
     */
    utility.downloadFileBySrc = function (src) {
        var iframe = document.createElement("iframe");
        iframe.src = src + (src.indexOf("?") === -1 ? "?" : "&") + "d=" + new Date().getTime();
        iframe.style.display = "none";
        document.body.appendChild(iframe);
    }

    /**
     * 获取百分比圆环配置
     * @method getPercTorusOption
     * @param val {string} 百分比值
     * @param size {number} 尺寸
     * @deprecated
     */
    utility.getPercTorusOption = function (val, size) {
        var completeColor = "#5bc79d", progressColor = "#fc8d00",
            noProgressColor = "#dddddd", opts = {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: 0,
                    plotShadow: false
                },
                title: {
                    text: '',
                    align: 'center',
                    verticalAlign: 'middle',
                    y: 8
                },
                tooltip: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        dataLabels: {
                            enabled: false
                        },
                        startAngle: 0,
                        endAngle: 360,
                        size: size || 100,
                        borderWidth: 0,
                        enableMouseTracking: false
                    }
                },
                series: [{
                    type: 'pie',
                    innerSize: '90%',
                    data: [
                        //{ name: 'Progress', y: 100, color: "#fc8d00" }
                    ]
                }]
            };

        val = parseInt(val, 10) || 0;

        opts["title"]["text"] = val + "%";
        val = val > 100 && 100 || val;
        opts["title"]["style"] = { color: (val >= 100 ? completeColor : progressColor), fontSize: "24px" };
        opts["series"][0]["data"].push({ name: 'Progress', y: val, color: (val >= 100 ? completeColor : progressColor) });
        opts["series"][0]["data"].push({ name: "NoProgress", y: 100 - val, color: noProgressColor });

        return opts;
    };

    /**
     * 加载模板，通过kd-tpl指定模板路径。主要门户用到
     * @method loadTemplate
     * @param callback {function} 加载完成后回调函数
     * @example
     *    页面html如下： 
     *      <div class="wrapper" kd-tpl="templates/header.html"></div>
     *    js调用
     *    Sapi.utility.loadTemplate(); // 加载模板，对动态添加的元素无效，如需要需再执行一遍
     */
    utility.loadTemplate = function (callback) {
        // 定义模板加载后的回调方法
        var tplsCallback = {
            headerCallback: function (navitem, $data) {
                $data.find("a[data-navitem='" + navitem + "']").addClass("selected");

                //utility.triggerCheckSessionInfo();
                utility.checkLogin();
            },
            footerCallback: function () {
            },
            loginCallback: function (params, $data) {

            }
        };

        $("[kd-tpl]").each(function () {
            var $this = $(this), path = $this.attr("kd-tpl"), cb, params = void 0;

            cb = path.split("?").length > 1 ? path.split("?")[1] : null;

            if (cb && (cb.split(":").length > 1)) {
                params = cb.split(":")[1];
                cb = cb.split(":")[0];
            }

            if (path) {
                $this.removeAttr("kd-tpl");
                utility.ajax(path, {}, function (data) {
                    var $data = $(data);
                    var $prev = $this.prev();

                    if (cb && typeof tplsCallback[cb] === "function") {
                        tplsCallback[cb](params, $data);
                    }

                    if ($prev.length === 0) {
                        if ($this.next().length === 0) {
                            $this.parent().append($data)
                        } else {
                            $this.next().before($data);
                        }
                    } else {
                        $prev.after($data);
                    }

                    if (typeof callback === "function") {
                        callback($data);
                    }

                    $this.remove();
                }, "html", "GET");
            }
        });
    };

    /**
     * 触发确认登录，主要门户页用到。跳转到测试工具时需提前验证是否登录
     * @method triggerCheckSessionInfo
     * @async
     * @deprecated
     */
    utility.triggerCheckSessionInfo = function () {
        utility.getSessionInfo(function (success, msg, data) {
            if (success) {
                Sapi.$doc.data("loginName", data.cName);
                Sapi.userId = data.userId;
            }
            Sapi.$doc.data("bCheckLogin", true);
            Sapi.$doc.data("checkLogin")();
        });
    }

    /**
     * 判断退出方法，触发确认登录，显示登录名称等
     * @method checkLogin
     * @private
     * @deprecated
     */
    utility.checkLogin = function () {
        var $doc = $(document), $win = $(window);

        $doc.data("checkLogin", function () {
            var $login = $(".login"), $loginName = $(".login-name"), $signUp = $(".sign-up");

            if ($login.length > 0 && $loginName.length === 0 && $doc.data("bCheckLogin")) {
                if ($doc.data("loginName")) {
                    $login.before('<li class="move-on login-name mobile">'
                                    + $doc.data("loginName") + '</li>');
                    $login.hide();
                    $signUp.before('<li class="move-on logout">退出</li>');
                    $signUp.hide();
                } else {
                    $(".logout").hide();
                    $(".mobile").remove();
                    $login.attr("href", $login.attr("href")
                                            + "?frompage="
                                            + encodeURIComponent(window.location.pathname
                                                    + window.location.search))
                            .show();
                    $(".sign-up").show();
                }
            }
        });

        // 退出
        $doc.on("click", ".logout", function () {
            var $this = $(this);
            utility.redConfirm("操作提示", "确认退出吗？", function () {
                $.ajax({
                    type: "GET",
                    url: "/user/logout.do?v=" + Date.parse(new Date()),
                    contentType: "application/x-www-form-urlencoded",
                    dataType: "json",
                    success: function (data) {
                        if (data["code"] === 200) {
                            $(".logout").remove();
                            $(".mobile").remove();
                            $(".login").show();
                            $(".sign-up").show();
                            if ($this.data("logout") === "function") {
                                $this.data("logout")();
                            }
                            else {
                                window.location.reload();
                            }
                        }
                    }
                });
            });
        });

        utility.triggerCheckSessionInfo();
    };

    /**
     * 设置或获取按钮禁用状态
     * @method btnDisabled
     * @param $btn {jquery} 按钮jquery对象
     * @param disbaled {boolean} 设置$btn的disabled属性值，同时添加btn-disabled
     * @throws "参数错误"
     * @return boolean||undefined 不传第二个参数时返回
     * @example
     *    // 提交数据到后端
     *    Sapi.$doc.on("click", ".btn-save", function(){
     *        var $this = $(this);
     *        // 判断按钮是否禁用
     *        if(utility.btnDisabled($this))
     *        {
     *            return;
     *        }
     *        utility.btnDisabled($this, true);
     *        utility.post(url, {}, function(bsuccess, msg, data){
     *              // 提交完成
     *              utility.btnDisabled($this, false);
     *        });
     *    }):  
     */
    utility.btnDisabled = function ($btn, disabled) {
        if (!$btn || !($btn instanceof jQuery)) {
            throw "参数错误"
            return;
        }

        if (utility.isBoolean(disabled)) {
            disabled ? $btn.addClass("btn-disabled").prop("disabled", true) : $btn.removeClass("btn-disabled").prop("disabled", false);
        }
        else {
            return $btn.hasClass("btn-disabled");
        }

    };

    /**
     * 验证银行卡号：16位到19位银行卡号，仅验证位数
     * @method checkBankCard
     * @param card {string}
     * @return boolean
     */
    utility.checkBankCard = function (card) {
        var sum = 0, num, lastNum, luhm;

        card = card.replace(/\s/g, "");

        if (!card.match(/^\d*$/g) || card.length < 16 || card.length > 20) {
            return false;
        }
        // 取消Luhm校验
        return true;

        lastNum = card.substring(card.length - 1);
        card = card.substring(0, card.length - 1);

        for (var i = card.length; i > 0; i--) {
            num = parseInt(card.charAt(i - 1), 10);
            if (i % 2 === 1) {
                sum += num * 2 > 9 ? num * 2 - 9 : num * 2;
            } else {
                sum += num;
            }
        }

        luhm = sum % 10 == 0 ? 0 : 10 - sum % 10;

        return luhm === parseInt(lastNum, 10);
    };

    /**
     * 转换银行卡格式，每4位一个空格
     * @method parseBackCard
     * @param val {string}
     * @return string
     * @example 
     *      utility.parseBackCard("12343567890123456");// "1234 5678 9012 3456"
     */
    utility.parseBackCard = function (val) {
        // 替换掉非数字
        if (val) {
            val = val.replace(/\s/g, '');
            if (val.match(/\D/g)) {
                val = val.replace(/\D/g, "");
            }

            if (val.length > 20) {
                val = val.substring(0, 20);
            }
        }

        // 格式化
        return val.replace(/(\d{4})(?=\d)/g, "$1 ");
    };

    /**
     * 复制字符串
     * @method repeat
     * @param target {string} 复制字符串
     * @param n {number} 复制次数
     * @return string
     * @example
     *     utility.repeat("a", 4); // "aaaa"
     */
    utility.repeat = (function () {
        var join = Array.prototype.join, obj = {};

        return function (target, n) {
            obj.length = n + 1;
            return join.call(obj, target);
        }
    })();

    /**
     * 截流函数
     * @method throttle
     * @param fn 间隔执行函数
     * @param interTimer 间隔时间
     * @return function
     * @example
     *    Sapi.$win.on("scroll", utility.throttle(function(e){
     *          console.log(Sapi.$win.scrollTop()); // 滚动时每隔200毫秒打印文档滚动高度 
     *    }, 200));
     */
    utility.throttle = function (fn, interTimer) {
        var _self = fn, timer, first = true;

        return function () {
            var args = arguments,
                me = this;

            if (first) {
                _self.apply(me, args);
                first = true;
                return false;
            }

            if (!timer) {
                return false;
            }

            timer = window.setTimeout(function () {
                window.clearTimeout(timer);
                _self.apply(me, args);
                timer = null;
            }, interTimer || 500);
        };
    };

    /**
     * 表单验证，验证必填，有一个没通过就返回
     * @method valiForm
     * @param $form {jquery} 
     * @param bPromptWarn {boolean} 是否tip提示
     * @return object
     *  {
     *     form {object} 字段集
     *     vali {boolean} 是否验证通过
     *     $elem {jQuery} 验证没通过的单个元素
     *     msg {string} 错误信息 
     *  }
     * @example
     *      html如下：
     *      <form id="formDemo">
     *          <div class="input-wrap required">
                    <span class="star">*</span>
                    <input type="text" prompt-msg="请输入财务凭证号" name="credentialsNum" />
                </div>
                <div class="required cash-group">
                    <span class="star">*</span>
                    <div name="amountType" kd-required="Y" id="ddlInAmountType" kd-async="Y" kd-url="commonInFormFundType" kd-defaultopt="|请选择" kd-valuefield="value" kd-textfield="text" class="sapi-droplist inline-block w-p50 float-left">
                        <input type="text" class="select-value" prompt-msg="请选择资金性质" readonly="readonly" value="请选择" />
                        <span class="del-operator"></span>
                    </div>
                    <div class="input-wrap inline-block w-p50 float-left">
                        <input type="text" prompt-msg="请输入金额" data-valuetype="Float" name="amount" />
                    </div>
                </div>
                <div class="required">
                    <span class="star">*</span>
                    <div name="investType" id="inFundType" kd-linkage="inInvestor" kd-async="Y" kd-url="investorType" kd-valuefield="code" kd-textfield="name" kd-defaultopt="|请选择" class="sapi-droplist">
                        <input type="text" class="select-value" prompt-msg="请选择投资方式" readonly="readonly" value="请选择" />
                        <span class="del-operator"></span>
                    </div>
                </div>
                <div class="input-wrap required">
                    <span class="star">*</span>
                    <input type="text" data-valuetype="BankCard" prompt-msg="请输入付款方账号" name="payNum" />
                </div>
            </from>
            js部分：
            Sapi.$doc.on("click", ".btn-save", function(){
                var result = utility.valiForm($("#formDemo", true));
                //没验证通过
                if(!result.vali){
                    return;
                }

                // result.form返回表单数据提交后端
                db.post(url, result.form, function(){});
            });
     */
    utility.valiForm = function ($form, bPromptWarn) {
        var $fields = $form.find("[name]"),
            i = 0, len = $fields.length, $field, valuetype,
               form = {}, name, $input, vali = true, msg = "";

        for (; i < len; i++) {
            $field = $fields.eq(i);
            name = $field.attr("name");
            valuetype = $field.attr("data-valuetype");

            if (!$field.is(":visible")) {
                continue;
            }

            if ($field.attr("type") === "text" || $field[0].tagName.toLowerCase() === "textarea") {
                if (valuetype === "Float" || valuetype === "Int") {
                    form[name] = $field.val().replace(/,/g, "");
                } else if (valuetype === "BankCard") {
                    form[name] = $field.val().replace(/\s/g, "");
                } else {
                    form[name] = $field.val();
                }
            }
            else if ($field.hasClass("sapi-droplist")) {
                form[name] = $field.attr("kd-value");
            }

            if ($field.parent().hasClass("required") || $field.parent().parent().hasClass("required")) {
                if ($.trim(form[name]) === "" || utility.isUndefined(form[name])) {
                    vali = false;
                    if ($field.hasClass("sapi-droplist")) {
                        $input = $field.children(".select-value");
                    }
                    else {
                        $input = $field;
                    }
                    msg = $input.attr("prompt-msg");

                    break;
                }
            }

            if (form[name] && valuetype === "BankCard" && !utility.checkBankCard(form[name])) {
                vali = false;
                msg = "银行卡号不正确。";
                $input = $field;
                break;
            }
        }

        var result = { form: form, vali: vali, $elem: $input, msg: msg };

        if (bPromptWarn && !result["vali"]) {
            result.$elem.trigger("focus");
            utility.triggerPromptWarn(result.$elem, result.msg);
        }

        return result;
    };

    /**
     * 获取单例对象
     * @method getSingleton
     * @param fn 获取单例对象的函数，其返回值保存到inst中
     * @return function
     * @example 
     *      // 返回弹出层对象
     *      var getBoxImport = utility.getSingleton(function(){
     *          var box = new Sapi.Control.Prompt({});
     *          
     *          return box;
     *      }); 
     * 
     *      var box1 = getBoxImport();
     *      var box2 = getBoxImport();
     *      console.log(box1 === box2); // true
     *      box1.show(); // 显示弹出层
     */
    utility.getSingleton = function (fn) {
        var inst = null,
            self = this;

        return function () {
            return inst || (inst = fn.apply(self, arguments));
        };
    };

    /**
     * 获取输入框光标位置
     * @method getInputCursorPos
     * @param input {element} 输入框元素
     * @return number   
     */
    utility.getInputCursorPos = function (input) {
        var cursurPosition = -1;
        if ("selectionStart" in input) {//非IE浏览器
            cursurPosition = input.selectionStart;
        } else {//IE
            var range = document.selection.createRange();
            range.moveStart("character", -input.value.length);
            cursurPosition = range.text.length;
        }

        return cursurPosition;
    };

    /**
     * 设置输入框光标位置
     * @method setInputCursorPos
     * @param input {element} 输入框元素
     * @param i     {number} 设置输入框的位置
     */
    utility.setInputCursorPos = function (input, i) {
        var cursurPosition = -1;

        if ("selectionStart" in input) {//非IE浏览器
            input.setSelectionRange(i, i);
        } else {//IE
            var range = input.createTextRange();
            range.move("character", i);
            range.select();
        }
    };

    /**
     * 监听页面离开事件，弹出提示信息，
     *  与utility.removeBeforeUnload搭配使用
     * @method listenBeforeUnload
     * @param msg {string} 提示消息
     * @example
     *    // 表单数据有变化执行
     *    utility.listenBeforeUnload("存在未保存数据，是否离开"); // 用户试图离开页面时将给出提示信息
     *    // 数据保存成功后
     *    utility.removeBeforeUnload(); // 移除监听事件
     */
    utility.listenBeforeUnload = function (msg) {
        Sapi.$win.unbind("beforeunload");
        Sapi.$win.on("beforeunload", function () {
            return msg;
        });
    };

    /**
     * 移除监听页面离开事件
     * @method removeBeforeUnload
     * @example
     *    // 表单数据有变化执行
     *    utility.listenBeforeUnload("存在未保存数据，是否离开"); // 用户试图离开页面时将给出提示信息
     *    // 数据保存成功后
     *    utility.removeBeforeUnload(); // 移除监听事件
     */
    utility.removeBeforeUnload = function () {
        Sapi.$win.unbind("beforeunload");
    };

    Sapi.utility = utility;
})(Sapi);


(function (Sapi) {
    var $doc = Sapi.$doc, utility = Sapi.utility;

    /**
     * 返回五角星图标
     * @method star
     * @param grade 星级数
     * @param type 图形类型 big/black-small/red-samll
     * @deprecated 
     */
    utility.star = function (grade, type) {
        var starGrade = {
            "0.0": "<div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "0.5": "<div class='star-half-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "1.0": "<div class='star-full-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "1.5": "<div class='star-full-" + type + "'></div><div class='star-half-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "2.0": "<div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "2.5": "<div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-half-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "3.0": "<div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-empty-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "3.5": "<div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-half-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "4.0": "<div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "4.5": "<div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-empty-" + type + "'></div>",
            "5.0": "<div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div><div class='star-full-" + type + "'></div>"
        };

        return starGrade[grade] || starGrade["0.0"];
    }

    /**
   * 初始化poshytip提示
   * @method initPromptWarn
   * @param $elem 元素jquery对象
   * @param msg 提示内容
   * @private
   */
    utility.initPromptWarn = function ($elem, msg) {
        $elem.poshytip({
            className: 'tip-darkgray',
            showOn: 'none',
            showTimeout: 1,
            alignTo: 'target',
            alignX: 'center',
            offsetY: 5,
            timeOnScreen: 1500,
            allowTipHover: true,
            content: msg || ""
        });
    };

    var delayTimer = null;

    /**
     * 触发triggerPromptWarn提示
     * @method triggerPromptWarn
     * @param $elem {jquery} 元素jquery对象
     * @param msg {string}提示内容
     * @param bDelayHide {boolean} 是否延迟隐藏
     * @param bFocus {boolean} 是否立刻让元素获取焦点
     * @example 
     *      var $title = $("title");
     *      if(!$title.val())
     *      {
     *          utility.triggerPromptWarn($title, "标题不能为空", true);
     *          return;
     *      }
     */
    utility.triggerPromptWarn = function ($elem, msg, bDelayHide, bFocus) {
        !$elem.hasClass("prompt-warn") && $elem.addClass("prompt-warn");
        $elem.data("delayHide", bDelayHide ? true : false);

        msg = msg || $elem.attr("prompt-msg");
        utility.initPromptWarn($elem, msg);
        $elem.poshytip("show");

        bFocus && $elem.trigger("focus");
        if (delayTimer) {
            window.clearTimeout(delayTimer);
        }
        if (bDelayHide) {
            delayTimer = window.setTimeout(function () {
                $elem.removeClass("prompt-warn").poshytip("disable");
            }, 1500);
        }
    };

    /**
     * 触发showPromptWarn提示
     * @method triggerPromptWarn
     * @param $elem {jquery} 元素jquery对象
     * @param msg {string}提示内容
     * @deprecated
     */
    utility.showPromptWarn = function ($elem, msg) {
        if ($elem.data("poshytip")) {
            $elem.poshytip("update", msg);
            $elem.poshytip('enable');
        } else {
            $elem.poshytip({
                className: 'tip-darkgray',
                showOn: 'hover',
                showTimeout: 1,
                alignTo: 'target',
                alignX: 'center',
                offsetY: 5,
                allowTipHover: true,
                content: msg || ""
            });
        }

        $elem.trigger("mouseover");

        if (delayTimer) {
            window.clearTimeout(delayTimer);
        }
        delayTimer = window.setTimeout(function () {
            $elem.poshytip("disable")
        }, 1500);
    };

    /**
     * 默认的一些绑定事件/全局页面绑定事件：例如：输入框数据类型限定
     * @class CommonEvent
     */

    /**
     * 绑定数据库链接
     * @event jumpDataBase
     * @deprecated 
     */
    $doc.on("click", ".more-database ul li", function () {

        var i = $(this).index(),
            pathname = window.location.pathname.split("/"),
            path = "/" + pathname[1] + "/" + pathname[2];
        switch (i) {
            case 0:
                utility.jumpPage("http://" + config.DB.BaseURL + "/home/index?id=3");
                break;
            case 1:

                break;
            case 2:
                utility.jumpPage("/landAuction/list.html");
                break;
            case 3:
                utility.jumpPage("/landCalculate/list.html");
                break;
            case 4:
                utility.jumpPage("/database/benchmarking/list.html");
                break;
            case 5:
                utility.jumpPage("/database/product/list.html");
                break;
            case 6:

                break;
            case 7:

                break;

        }
    });

    /**
     * 绑定trps链接
     * @event tips
     * @deprecated 
     */
    $doc.on("mouseover mouseout", ".tips", function (e) {
        var $this = $(this),
            pos = $this.offset();

        var $topTips = $(".top-tips");
        if ($topTips.length === 0) {
            $("body").append('<div class="top-tips"><span class="tips-msg"></span><div class="nabla"></div></div>');
            $topTips = $(".top-tips");
        }

        if (e.type === "mouseover") {
            $topTips.find(".tips-msg").text($this.attr("tips")).end().css({
                top: pos.top - 30,
                left: pos.left + $this.outerWidth() / 2 - $topTips.outerWidth() / 2
            }).stop().fadeIn();
        } else {
            $topTips.stop().fadeOut();
        }

    });

    /**
     * 输入框失去焦点事件，限定输入框值类型Float/Int/BankCard
     * @event input[type="text"].blur
     * @example
     *   html如下：
     *      // 浮点数，保留4位有效数字，结果1,000.0000，不是数字时值为空并获得焦点
     *      <input type="text" data-valuetype="Float" data-fixed="4" value="10000"/>
     *      // 整数，不是整数时值为空并获得焦点 
     *      <input type="text" data-valuetype="Int" value=""/> 
     *      // 银行卡格式，结果1234 1341 3413 24
     *      <input type="text" data-valuetype="BankCard" value="12341341341324"/>
     */
    $doc.on("blur", "input[type='text']", function () {
        var $this = $(this), val = $this.val().replace(/,/g, ""),
            valueType = $this.attr("data-valuetype"),
            type = $this.attr("kdtype");

        if (type === "datepicker") {
            return;
        }

        // 处理负号的情况、字段类型验证
        if (val === "-" && valueType === "Float" || $.trim(val) !== "" && (valueType === "Float" && !utility.isNumeric(val)
            || valueType === "Int" && !utility.isInt(val)) || val !== "" && $.trim(val) === "") {
            $this.val("").trigger("focus");
            return;
        }

        if (valueType === "Float" && val) {
            var fixed = parseInt($this.attr("data-fixed"));
            if (fixed) {
                $this.val(utility.toThousands((parseFloat(val) || 0).toFixed(fixed)));
            } else {
                $this.val(utility.toThousands((parseFloat(val) || 0).toFixed(2)));
            }
        } else if (valueType === "BankCard") {
            $this.val(utility.parseBackCard(val));
        }
    });

    /**
     * 键盘输入时限定值类型
     * @event checkValueType
     * @example
     *   html如下：
     *      // 浮点数，只能输入数字、-、.
     *      <input type="text" data-valuetype="Float" value=""/>
     *      // 整数，只能输入数字、-、.
     *      <input type="text" data-valuetype="Int" value=""/> 
     *      // 银行卡格式，只能输入数字
     *      <input type="text" data-valuetype="BankCard" value="12341341341324"/> 
     */
    $doc.on("keyup", "input[type='text'], textarea", checkValueType);

    function checkValueType(event) {
        var $this = $(this), val, oldVal = this.value,
            type = $this.attr("data-valuetype");

        if (type === "Float" || type === "Int") {
            // 上下左右键不处理
            if (36 < event.which && event.which < 41) {
                return;
            }

            val = $.trim($this.val())

            // 第一个为负号不处理
            if (val === "-") {
                return;
            }
            val = val.replace(/,/g, "");
            // 实数验证
            if (type === "Float" && !utility.isNumeric(val)) {
                val = val.substring(0, val.length - 1);
            }
                // 整数验证
            else if (type === "Int" && !utility.isInt(val)) {
                val = val.substring(0, val.length - 1);
            }

            // 判断字数超过极限  
            if (parseFloat(val) > 100000000000000) {
                utility.triggerPromptWarn($this, "数字超过最大长度", true);
                val = val.substring(0, 14);
            }

            val = utility.toThousands(val);
        }
        else if (type === "BankCard") {
            //if (!utility.checkBankCard(val)) {
            //    utility.triggerPromptWarn($this, "银行卡号不正确。", true);
            //}
            // 格式化
            val = utility.parseBackCard(this.value);
        }

        // type为 "Float"、"Int"和"BankCard"的情况
        if (!utility.isUndefined(val)) {
            var startPos = utility.getInputCursorPos(this), endPos;
            if (startPos == oldVal.length) {
                $this.val(val);
            }
            else {
                if (val.length > oldVal.length) {
                    endPos = startPos + (val.length - oldVal.length);
                } else if (val.length < oldVal.length) {
                    endPos = startPos - (oldVal.length - val.length);
                }

                $this.val(val);
                utility.setInputCursorPos(this, endPos || startPos);
            }
        }

        if (!$this.data("delayHide") && $this.hasClass("prompt-warn")) {
            $this.removeClass("prompt-warn").poshytip('disable');
        }
    }

    /**
     * 输入框默认选中文本，除日期控件、只读输入框外
     * @event select
     */
    $doc.on("click", "input[type='text'], textarea", function () {
        var $this = $(this);

        if ($this.attr("kdtype") === "datepicker" || $this.prop("readonly") || $this.hasClass("hasDatepicker")) {
            return;
        }
        this.select();
    });

})(Sapi);
