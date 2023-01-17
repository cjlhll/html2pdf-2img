export default class watermark {
    constructor(settings) {
        this.watermark = {};
        this.forceRemove = false;
        this.defaultSettings={
            watermark_id: 'wm_div_id',          //水印总体的id
            watermark_prefix: 'mask_div_id',    //小水印的id前缀
            watermark_txt:"测试水印",             //水印的内容
            watermark_x:20,                     //水印起始位置x轴坐标
            watermark_y:20,                     //水印起始位置Y轴坐标
            watermark_rows:0,                   //水印行数
            watermark_cols:0,                   //水印列数
            watermark_x_space:20,              //水印x轴间隔
            watermark_y_space:20,               //水印y轴间隔
            watermark_font:'微软雅黑',           //水印字体
            watermark_color:'black',            //水印字体颜色
            watermark_fontsize:'18px',          //水印字体大小
            watermark_alpha:0.15,               //水印透明度，要求设置在大于等于0.005
            watermark_width:100,                //水印宽度
            watermark_height:100,               //水印长度
            watermark_angle:15,                 //水印倾斜度数
            watermark_parent_width:0,      //水印的总体宽度（默认值：body的scrollWidth和clientWidth的较大值）
            watermark_parent_height:0,     //水印的总体高度（默认值：body的scrollHeight和clientHeight的较大值）
            watermark_parent_node:null,     //水印插件挂载的父元素element,不输入则默认挂在body上
            monitor:true,                   //monitor 是否监控， true: 不可删除水印; false: 可删水印。
            z_index: 9999999,
            watermark_img: '',
        };
        this.parentDom = settings.watermark_parent_node ? (typeof settings.watermark_parent_node === 'string') ? document.querySelector(settings.watermark_parent_node) : settings.watermark_parent_node : document.body
        this.globalSetting = settings;
        let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        //监听dom是否被移除或者改变属性的回调函数
        var domChangeCallback = (records) => {
            if(this.forceRemove) {
                this.forceRemove = false;
                return;
            }
            if ((this.globalSetting && records.length === 1) || records.length === 1 && records[0].removedNodes.length >= 1) {
                let dom = document.getElementById(this.defaultSettings.watermark_id)
                if (dom) { // 避免vue等单页面应用有缓存的路由页面，导致死循环。
                    this.loadMark(this.globalSetting);
                }
            }
        };
        this.hasObserver = MutationObserver !== undefined;
        this.watermarkObserver = this.hasObserver ? new MutationObserver(domChangeCallback) : null;
        this.option = {
            'childList': true,
            'attributes': true,
            'subtree': true, // 监听子节点树，会导致性能变差。
        };
    }
    init() {
        this.loadMark(this.globalSetting);
        window.addEventListener('onload', () => {
            this.loadMark(this.globalSetting);
        });
        window.addEventListener('resize', () => {
            this.loadMark(this.globalSetting);
        });
    }
    loadMark(settings) {
        /*采用配置项替换默认值，作用类似jquery.extend*/
        if(arguments.length===1&&typeof arguments[0] ==="object" ){
            var src=arguments[0]||{};
            for(let key in src)
            {
                if(src[key]&&this.defaultSettings[key]&&src[key]===this.defaultSettings[key])continue;
                /*veronic: resolution of watermark_angle=0 not in force*/
                else if(src[key] || src[key] === 0) this.defaultSettings[key]=src[key];
            }
        }
        /*如果元素存在则移除*/
        var watermark_element = document.getElementById(this.defaultSettings.watermark_id);
        watermark_element && watermark_element.parentNode && watermark_element.parentNode.removeChild(watermark_element);
        /*如果设置水印挂载的父元素的id*/
        var watermark_parent_element = this.parentDom;
        var watermark_hook_element = watermark_parent_element;
        var page_width,page_height;
        if (watermark_parent_element) {
            /*获取页面宽度*/
            // var page_width = Math.max(watermark_hook_element.scrollWidth,watermark_hook_element.clientWidth) - defaultSettings.watermark_width/2;
            page_width = Math.max(watermark_hook_element.scrollWidth,watermark_hook_element.clientWidth);
            /*获取页面最大长度*/
            // var page_height = Math.max(watermark_hook_element.scrollHeight,watermark_hook_element.clientHeight,document.documentElement.clientHeight)-defaultSettings.watermark_height/2;
            page_height = Math.max(watermark_hook_element.scrollHeight,watermark_hook_element.clientHeight);
        }
        var setting = arguments[0]||{};
        var parentEle = watermark_hook_element;
        var page_offsetTop = 0;
        var page_offsetLeft = 0;
        if(setting.watermark_parent_width || setting.watermark_parent_height){
            /*指定父元素同时指定了宽或高*/
            if(parentEle){
                page_offsetTop = parentEle.offsetTop || 0;
                page_offsetLeft = parentEle.offsetLeft || 0;
                this.defaultSettings.watermark_x = this.defaultSettings.watermark_x + page_offsetLeft;
                this.defaultSettings.watermark_y = this.defaultSettings.watermark_y + page_offsetTop;
            }
        }else{
            if(parentEle){
                page_offsetTop = parentEle.offsetTop || 0;
                page_offsetLeft = parentEle.offsetLeft || 0;
            }
        }
        /*创建水印外壳div*/
        var otdiv = document.getElementById(this.defaultSettings.watermark_id);
        if(!otdiv && watermark_parent_element){
            otdiv =document.createElement('div');
            /*创建shadow dom*/
            otdiv.id = this.defaultSettings.watermark_id;
            otdiv.setAttribute('style','pointer-events: none !important; display: block !important');
            /*判断浏览器是否支持attachShadow方法*/
            /*将shadow dom随机插入body内的任意位置*/
            var nodeList = watermark_hook_element.children;
            var index = Math.floor(Math.random()*(nodeList.length-1 ));
            if(nodeList[index]){
                watermark_hook_element.insertBefore(otdiv, nodeList[index]);
            }else{
                watermark_hook_element.appendChild(otdiv);
            }
        }
        /*三种情况下会重新计算水印列数和x方向水印间隔：1、水印列数设置为0，2、水印宽度大于页面宽度，3、水印宽度小于于页面宽度*/
        this.defaultSettings.watermark_cols = parseInt((page_width - this.defaultSettings.watermark_x) / (this.defaultSettings.watermark_width + this.defaultSettings.watermark_x_space));
        var temp_watermark_x_space = parseInt((page_width - this.defaultSettings.watermark_x - this.defaultSettings.watermark_width * this.defaultSettings.watermark_cols) / (this.defaultSettings.watermark_cols));
        this.defaultSettings.watermark_x_space = temp_watermark_x_space? this.defaultSettings.watermark_x_space : temp_watermark_x_space;
        var allWatermarkWidth;
        /*三种情况下会重新计算水印行数和y方向水印间隔：1、水印行数设置为0，2、水印长度大于页面长度，3、水印长度小于于页面长度*/
        this.defaultSettings.watermark_rows = parseInt((page_height - this.defaultSettings.watermark_y) / (this.defaultSettings.watermark_height + this.defaultSettings.watermark_y_space));
        var temp_watermark_y_space = parseInt((page_height - this.defaultSettings.watermark_y - this.defaultSettings.watermark_height * this.defaultSettings.watermark_rows) / (this.defaultSettings.watermark_rows));
        this.defaultSettings.watermark_y_space = temp_watermark_y_space? this.defaultSettings.watermark_y_space : temp_watermark_y_space;
        var allWatermarkHeight;
        if(watermark_parent_element){
            allWatermarkWidth = this.defaultSettings.watermark_x + this.defaultSettings.watermark_width * this.defaultSettings.watermark_cols + this.defaultSettings.watermark_x_space * (this.defaultSettings.watermark_cols - 1);
            allWatermarkHeight = this.defaultSettings.watermark_y + this.defaultSettings.watermark_height * this.defaultSettings.watermark_rows + this.defaultSettings.watermark_y_space * (this.defaultSettings.watermark_rows - 1);
        }else{
            allWatermarkWidth = page_offsetLeft + this.defaultSettings.watermark_x + this.defaultSettings.watermark_width * this.defaultSettings.watermark_cols + this.defaultSettings.watermark_x_space * (this.defaultSettings.watermark_cols - 1);
            allWatermarkHeight = page_offsetTop + this.defaultSettings.watermark_y + this.defaultSettings.watermark_height * this.defaultSettings.watermark_rows + this.defaultSettings.watermark_y_space * (this.defaultSettings.watermark_rows - 1);
        }
        var x;
        var y;
        for (var i = 0; i < this.defaultSettings.watermark_rows; i++) {
            if(watermark_parent_element){
                y = page_offsetTop + this.defaultSettings.watermark_y + (page_height - allWatermarkHeight) / 2 + (this.defaultSettings.watermark_y_space + this.defaultSettings.watermark_height) * i;
            }else{
                y = this.defaultSettings.watermark_y + (page_height - allWatermarkHeight) / 2 + (this.defaultSettings.watermark_y_space + this.defaultSettings.watermark_height) * i;
            }
            for (var j = 0; j < this.defaultSettings.watermark_cols; j++) {
                if(watermark_parent_element){
                    x = page_offsetLeft + this.defaultSettings.watermark_x + (page_width - allWatermarkWidth) / 2 + (this.defaultSettings.watermark_width + this.defaultSettings.watermark_x_space) * j;
                }else {
                    x = this.defaultSettings.watermark_x + (page_width - allWatermarkWidth) / 2 + (this.defaultSettings.watermark_width + this.defaultSettings.watermark_x_space) * j;
                }
                var mask_div = document.createElement('div');
                var oText
                if (this.defaultSettings.watermark_img) {
                    oText = document.createElement('img')
                    oText.src = this.defaultSettings.watermark_img
                    oText.style.width = '100%'
                } else {
                    oText=document.createTextNode(this.defaultSettings.watermark_txt);
                }
                mask_div.appendChild(oText);
                /*设置水印相关属性start*/
                mask_div.id = this.defaultSettings.watermark_prefix + i + j;
                /*设置水印div倾斜显示*/
                mask_div.style.webkitTransform = "rotate(-" + this.defaultSettings.watermark_angle + "deg)";
                mask_div.style.MozTransform = "rotate(-" + this.defaultSettings.watermark_angle + "deg)";
                mask_div.style.msTransform = "rotate(-" + this.defaultSettings.watermark_angle + "deg)";
                mask_div.style.OTransform = "rotate(-" + this.defaultSettings.watermark_angle + "deg)";
                mask_div.style.transform = "rotate(-" + this.defaultSettings.watermark_angle + "deg)";
                mask_div.style.visibility = "";
                mask_div.style.position = "absolute";
                /*选不中*/
                mask_div.style.left = x + 'px';
                mask_div.style.top = y + 'px';
                mask_div.style.overflow = "hidden";
                mask_div.style.zIndex = this.defaultSettings.z_index;
                mask_div.style.opacity = this.defaultSettings.watermark_alpha;
                mask_div.style.fontSize = this.defaultSettings.watermark_fontsize;
                mask_div.style.fontFamily = this.defaultSettings.watermark_font;
                mask_div.style.color = this.defaultSettings.watermark_color;
                mask_div.style.textAlign = "center";
                mask_div.style.width = this.defaultSettings.watermark_width + 'px';
                mask_div.style.height = this.defaultSettings.watermark_height + 'px';
                mask_div.style.display = "block";
                mask_div.style['-ms-user-select'] = "none";
                /*设置水印相关属性end*/
                otdiv.appendChild(mask_div)
            }
        }
        // monitor 是否监控， true: 不可删除水印; false: 可删水印。
        const minotor = settings.monitor === undefined ? this.defaultSettings.monitor : settings.monitor;
        if (minotor && this.hasObserver && this.watermarkObserver && watermark_hook_element) {
            this.watermarkObserver.observe(watermark_hook_element, this.option);
            // this.watermarkObserver.observe(this.watermarkDom, this.option);
        }
    }
    removeMark() {
        /*采用配置项替换默认值，作用类似jquery.extend*/
        if(arguments.length===1&&typeof arguments[0] ==="object" )
        {
            var src=arguments[0]||{};
            for(let key in src)
            {
                if(src[key]&&this.defaultSettings[key]&&src[key]===this.defaultSettings[key])continue;
                /*veronic: resolution of watermark_angle=0 not in force*/
                else if(src[key] || src[key] === 0) this.defaultSettings[key]=src[key];
            }
        }
        /*移除水印*/
        var watermark_element = document.getElementById(this.defaultSettings.watermark_id);
        if (watermark_element) {
            var _parentElement = watermark_element.parentNode;
            _parentElement.removeChild(watermark_element);
            // :ambulance: remove()
            // minotor 这个配置有些冗余
            // 如果用 MutationObserver 来监听dom变化防止删除水印
            // remove() 方法里用 MutationObserver 的 disconnect() 解除监听即可
            this.watermarkObserver.disconnect();
            this.watermarkObserver = null
        }
    }
    load(settings) {
        this.globalSetting = settings;
        this.loadMark(settings);
    }
    remove() {
        this.forceRemove = true;
        this.removeMark();
    }
}