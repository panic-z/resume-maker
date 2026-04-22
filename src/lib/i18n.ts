export type Language = "zh" | "en";

type Messages = {
  app: {
    title: string;
    tagline: string;
    srTitle: string;
    srDescription: string;
  };
  header: {
    zh: string;
    en: string;
  };
  toolbar: {
    template: string;
    mode: string;
    workspace: string;
    edit: string;
    preview: string;
    markdown: string;
    style: string;
    visual: string;
    import: {
      trigger: string;
      markdown: string;
      projectJson: string;
      pdf: string;
      markdownInput: string;
      projectJsonInput: string;
      pdfInput: string;
      confirmMarkdown: string;
      confirmProject: string;
      confirmPdf: string;
      errors: {
        unsupportedType: string;
        readFailed: string;
        invalidJson: string;
        invalidProject: string;
        pdfParseFailed: string;
        pdfEmpty: string;
      };
    };
    export: string;
    templates: Record<"classic" | "modern" | "minimal" | "professional" | "creative", string>;
  };
  stylePanel: {
    title: string;
    close: string;
    font: string;
    fontSize: string;
    lineHeight: string;
    pagePadding: string;
    accentColor: string;
    background: string;
    backgroundModes: Record<"preset" | "custom-gradient" | "custom-image", string>;
    backgroundOptions: Record<"plain" | "corner-frame" | "soft-arc" | "grid-wash" | "editorial-bands", string>;
    backgroundGradient: {
      fromColor: string;
      toColor: string;
      direction: string;
      softness: string;
      directionOptions: Record<"to-bottom" | "to-bottom-right" | "to-right", string>;
      softnessHint: string;
    };
    backgroundImage: {
      upload: string;
      replace: string;
      remove: string;
      fit: string;
      note: string;
      empty: string;
      fileName: string;
      selected: string;
      fitOptions: Record<"cover" | "contain" | "repeat", string>;
      errors: {
        unsupportedType: string;
        fileTooLarge: string;
        readFailed: string;
        persistenceFailed: string;
      };
    };
    reset: string;
    fontOptions: Record<"serif" | "sans" | "system", string>;
  };
  preview: {
    hint: string;
    elements: {
      name: string;
      contact: string;
      sectionTitle: string;
      entryTitle: string;
      section: string;
      listItem: string;
      link: string;
      list: string;
    };
  };
  stylePopover: {
    resetElement: string;
    sections: {
      font: string;
      text: string;
      spacing: string;
      border: string;
    };
    rows: {
      size: string;
      weight: string;
      color: string;
      align: string;
      letterSpacing: string;
      transform: string;
      marginTop: string;
      marginBottom: string;
      borderStyle: string;
    };
    fontWeights: Record<"normal" | "500" | "600" | "700" | "800", string>;
    textAligns: Record<"left" | "center" | "right", string>;
    textTransforms: Record<"none" | "uppercase" | "capitalize", string>;
    borderStyles: Record<"none" | "solid" | "dashed" | "dotted", string>;
  };
  export: {
    popupBlocked: string;
  };
};

export const messages: Record<Language, Messages> = {
  zh: {
    app: {
      title: "Resume Maker",
      tagline: "开源简历生成器",
      srTitle: "Resume Maker",
      srDescription: "使用 Markdown、实时预览、样式控制和 PDF 或 HTML 导出，在浏览器中创建专业简历。",
    },
    header: {
      zh: "中文",
      en: "English",
    },
    toolbar: {
      template: "模板",
      mode: "模式",
      workspace: "视图",
      edit: "编辑",
      preview: "预览",
      markdown: "Markdown",
      style: "样式",
      visual: "可视化",
      import: {
        trigger: "导入",
        markdown: "Markdown",
        projectJson: "JSON 项目",
        pdf: "PDF（实验）",
        markdownInput: "导入 Markdown 文件",
        projectJsonInput: "导入 JSON 项目文件",
        pdfInput: "导入 PDF 文件",
        confirmMarkdown: "导入 Markdown 会替换当前简历内容，是否继续？",
        confirmProject: "导入项目会替换当前简历、模板和样式，是否继续？",
        confirmPdf: "导入 PDF 会尝试转换为 Markdown 并替换当前简历内容，是否继续？",
        errors: {
          unsupportedType: "暂不支持该文件类型",
          readFailed: "文件读取失败，请重试",
          invalidJson: "JSON 文件格式无效，请检查后重试",
          invalidProject: "项目文件无效，请确认它来自 Resume Maker 导出",
          pdfParseFailed: "PDF 解析失败，请检查文件后重试",
          pdfEmpty: "未能从 PDF 中提取到内容，请尝试导入 Markdown 或 JSON 项目文件",
        },
      },
      export: "导出",
      templates: {
        classic: "经典",
        modern: "现代",
        minimal: "简约",
        professional: "商务",
        creative: "创意",
      },
    },
    stylePanel: {
      title: "样式",
      close: "关闭样式面板",
      font: "字体",
      fontSize: "字号",
      lineHeight: "行距",
      pagePadding: "边距",
      accentColor: "主题色",
      background: "背景",
      backgroundModes: {
        preset: "预设",
        "custom-gradient": "自定义渐变",
        "custom-image": "自定义图片",
      },
      backgroundOptions: {
        plain: "纯白",
        "corner-frame": "角框",
        "soft-arc": "柔弧",
        "grid-wash": "网格",
        "editorial-bands": "编排条带",
      },
      backgroundGradient: {
        fromColor: "起始颜色",
        toColor: "结束颜色",
        direction: "方向",
        softness: "柔和度",
        directionOptions: {
          "to-bottom": "向下",
          "to-bottom-right": "右下",
          "to-right": "向右",
        },
        softnessHint: "柔和度将在后续任务中启用",
      },
      backgroundImage: {
        upload: "上传图片",
        replace: "替换图片",
        remove: "移除图片",
        fit: "铺放方式",
        note: "图片背景会增大导出文件体积",
        empty: "暂未选择图片，上传功能将在后续任务中接入。",
        fileName: "当前图片",
        selected: "已选择图片",
        fitOptions: {
          cover: "覆盖",
          contain: "完整显示",
          repeat: "平铺",
        },
        errors: {
          unsupportedType: "仅支持 PNG、JPEG 或 WebP",
          fileTooLarge: "图片不能超过 1.5 MB",
          readFailed: "图片读取失败，请重试",
          persistenceFailed: "图片已应用，但无法保存到下次刷新",
        },
      },
      reset: "重置全部样式",
      fontOptions: {
        serif: "衬线体",
        sans: "无衬线",
        system: "系统默认",
      },
    },
    preview: {
      hint: "点击元素编辑样式",
      elements: {
        name: "姓名",
        contact: "联系方式",
        sectionTitle: "章节标题",
        entryTitle: "条目标题",
        section: "章节",
        listItem: "列表项",
        link: "链接",
        list: "列表",
      },
    },
    stylePopover: {
      resetElement: "重置当前元素",
      sections: {
        font: "字体",
        text: "文本",
        spacing: "间距",
        border: "边框",
      },
      rows: {
        size: "大小",
        weight: "粗细",
        color: "颜色",
        align: "对齐",
        letterSpacing: "间距",
        transform: "转换",
        marginTop: "上边距",
        marginBottom: "下边距",
        borderStyle: "样式",
      },
      fontWeights: {
        normal: "常规",
        "500": "中粗",
        "600": "半粗",
        "700": "粗体",
        "800": "特粗",
      },
      textAligns: {
        left: "左",
        center: "中",
        right: "右",
      },
      textTransforms: {
        none: "无",
        uppercase: "大写",
        capitalize: "首大写",
      },
      borderStyles: {
        none: "无",
        solid: "实线",
        dashed: "虚线",
        dotted: "点线",
      },
    },
    export: {
      popupBlocked: "弹窗被浏览器拦截，请允许弹窗后重试",
    },
  },
  en: {
    app: {
      title: "Resume Maker",
      tagline: "Open Source Resume Builder",
      srTitle: "Resume Maker",
      srDescription: "Create a professional resume with Markdown, live preview, style controls, and PDF or HTML export directly in your browser.",
    },
    header: {
      zh: "中文",
      en: "English",
    },
    toolbar: {
      template: "Templates",
      mode: "Mode",
      workspace: "Workspace",
      edit: "Edit",
      preview: "Preview",
      markdown: "Markdown",
      style: "Style",
      visual: "Visual",
      import: {
        trigger: "Import",
        markdown: "Markdown",
        projectJson: "Project JSON",
        pdf: "PDF (Experimental)",
        markdownInput: "Import Markdown file",
        projectJsonInput: "Import project JSON file",
        pdfInput: "Import PDF file",
        confirmMarkdown: "Importing Markdown will replace the current resume content. Continue?",
        confirmProject: "Importing a project will replace the current resume, template, and styles. Continue?",
        confirmPdf: "Importing a PDF will try to convert it to Markdown and replace the current resume content. Continue?",
        errors: {
          unsupportedType: "This file type is not supported yet",
          readFailed: "Failed to read the file. Please try again.",
          invalidJson: "The JSON file is invalid. Please check it and try again.",
          invalidProject: "The project file is invalid. Confirm it was exported from Resume Maker.",
          pdfParseFailed: "Failed to parse the PDF. Please check the file and try again.",
          pdfEmpty: "No content could be extracted from the PDF. Try importing Markdown or a project JSON file instead.",
        },
      },
      export: "Export",
      templates: {
        classic: "Classic",
        modern: "Modern",
        minimal: "Minimal",
        professional: "Professional",
        creative: "Creative",
      },
    },
    stylePanel: {
      title: "Style",
      close: "Close style panel",
      font: "Font",
      fontSize: "Size",
      lineHeight: "Line Height",
      pagePadding: "Padding",
      accentColor: "Accent",
      background: "Background",
      backgroundModes: {
        preset: "Preset",
        "custom-gradient": "Custom Gradient",
        "custom-image": "Custom Image",
      },
      backgroundOptions: {
        plain: "Plain",
        "corner-frame": "Corner Frame",
        "soft-arc": "Soft Arc",
        "grid-wash": "Grid Wash",
        "editorial-bands": "Editorial Bands",
      },
      backgroundGradient: {
        fromColor: "From Color",
        toColor: "To Color",
        direction: "Direction",
        softness: "Softness",
        directionOptions: {
          "to-bottom": "Down",
          "to-bottom-right": "Down Right",
          "to-right": "Right",
        },
        softnessHint: "Softness will be enabled in a follow-up task",
      },
      backgroundImage: {
        upload: "Upload Image",
        replace: "Replace Image",
        remove: "Remove Image",
        fit: "Fit",
        note: "Image backgrounds increase export file size",
        empty: "No image selected yet. Upload will be wired in the next task.",
        fileName: "Current Image",
        selected: "Image selected",
        fitOptions: {
          cover: "Cover",
          contain: "Contain",
          repeat: "Repeat",
        },
        errors: {
          unsupportedType: "Only PNG, JPEG, or WebP is supported",
          fileTooLarge: "Image must be 1.5 MB or smaller",
          readFailed: "Image reading failed. Please try again.",
          persistenceFailed: "Image was applied, but could not be saved for refresh",
        },
      },
      reset: "Reset All Styles",
      fontOptions: {
        serif: "Serif",
        sans: "Sans",
        system: "System",
      },
    },
    preview: {
      hint: "Click any element to edit styles",
      elements: {
        name: "Name",
        contact: "Contact",
        sectionTitle: "Section Title",
        entryTitle: "Entry Title",
        section: "Section",
        listItem: "List Item",
        link: "Link",
        list: "List",
      },
    },
    stylePopover: {
      resetElement: "Reset Element",
      sections: {
        font: "Font",
        text: "Text",
        spacing: "Spacing",
        border: "Border",
      },
      rows: {
        size: "Size",
        weight: "Weight",
        color: "Color",
        align: "Align",
        letterSpacing: "Tracking",
        transform: "Transform",
        marginTop: "Top",
        marginBottom: "Bottom",
        borderStyle: "Style",
      },
      fontWeights: {
        normal: "Regular",
        "500": "Medium",
        "600": "Semibold",
        "700": "Bold",
        "800": "Extra Bold",
      },
      textAligns: {
        left: "Left",
        center: "Center",
        right: "Right",
      },
      textTransforms: {
        none: "None",
        uppercase: "Upper",
        capitalize: "Cap",
      },
      borderStyles: {
        none: "None",
        solid: "Solid",
        dashed: "Dashed",
        dotted: "Dotted",
      },
    },
    export: {
      popupBlocked: "The print window was blocked by your browser. Allow pop-ups and try again.",
    },
  },
};
