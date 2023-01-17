# html2pdf-2img
HTML下载成pdf或者img格式，并支持水印，pdf支持配置分页元素自动分页，不会截断元素。

基于jspdf.js和watermark.js二次封装，并且优化了pdf的分割判断方式，不会出现截断元素的问题。
使用方法：

      import html2pdf from 'html2pdf-2img'

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



感谢https://github.com/saucxs/watermark-dom
