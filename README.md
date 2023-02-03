# html2pdf-2img
HTML下载成pdf或者img格式，pdf也是以图片形式生成的，并支持水印，pdf支持配置分页元素自动分页，不会截断元素。

基于jspdf.js和watermark.js二次封装，并且优化了pdf的分割判断方式，不会出现截断元素的问题。
使用方法：

      安装：npm i html2pdf-2img

      import JsPdfImg from 'html2pdf-2img'

      new JsPdfImg("#printPage", "导出的图片名称", {
        watermarkOption: {
          watermark_txt: "水印配置",
          z_index: 97,
          watermark_x: 0,
          watermark_y: 0,
          watermark_x_space: 160,
          watermark_y_space: 160,
          watermark_width: 180,
        },
      }).outImage(() => {
        console.log('结束')
      });
      
      new JsPdfImg("#printPage", "导出的pdf名称", {
        pageBreak: ['.title', '#area', 'li', 'h3'], // 当导出pdf时候，这个参数必填
        pageStartOffset: 20, // 每个页头的留空距离
        watermarkOption: {
          watermark_txt: "水印配置",
          z_index: 97,
          watermark_x: 0,
          watermark_y: 0,
          watermark_x_space: 160,
          watermark_y_space: 160,
          watermark_width: 180,
        },
      }).outPdf(() => {
        console.log('结束')
      });

     水印的配置参数：
     watermarkOption: {
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
     }

感谢https://github.com/saucxs/watermark-dom
