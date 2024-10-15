window.t396__isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || navigator.userAgent.indexOf("Instagram") > -1;
window.t396__isIPad =
  "ontouchend" in document && navigator.userAgent.indexOf("AppleWebKit") !== -1;

// eslint-disable-next-line no-unused-vars
function t396_init(recid) {
  var record = document.getElementById("rec" + recid);
  var zeroBlock = record ? record.querySelector(".t396") : null;
  var artBoard = record ? record.querySelector(".t396__artboard") : null;
  if (!artBoard) return;

  t396_initTNobj(recid, artBoard);
  t396__initOnlyScalable();

  var data = "";
  var resolution = t396_detectResolution(recid);
  var allRecords = document.getElementById("allrecords");
  t396_switchResolution(recid, resolution);

  var isScaled = t396_ab__getFieldValue(artBoard, "upscale") === "window";
  t396__setGlobalScaleVariables(recid, resolution, isScaled);
  t396_updateTNobj(recid);
  t396_artboard_build(data, recid);

  /*check is device has touchscreen*/
  var isTouchDevice = "ontouchend" in document;

  window.addEventListener("resize", function () {
    artBoard.classList.add("t396_resizechange");

    t396_waitForFinalEvent(
      function () {
        if (window.t396__isMobile || isTouchDevice) {
          if (document.documentElement.clientWidth !== window.tn_window_width) {
            if (!record) return;
            if (!t396_isBlockVisible(record)) return;
            t396_doResize(recid);
            artBoard.classList.remove("t396_resizechange");
          }
        } else {
          if (!record) return;
          if (!t396_isBlockVisible(record)) return;
          t396_doResize(recid);
          artBoard.classList.remove("t396_resizechange");
        }
      },
      500,
      "resizeruniqueid" + recid
    );
  });

  window.addEventListener("orientationchange", function () {
    t396_waitForFinalEvent(
      function () {
        if (!record) return;
        if (!t396_isBlockVisible(record)) return;
        t396_doResize(recid);
      },
      600,
      "orientationuniqueid" + recid
    );
  });

  window.addEventListener("load", function () {
    t396_allelems__renderView(artBoard);
    t396_allgroups__renderView(artBoard);
    var blockOverflow = artBoard
      ? window.getComputedStyle(artBoard).getPropertyValue("overflow")
      : "";

    if (
      typeof t_lazyload_update === "function" &&
      blockOverflow === "auto" &&
      artBoard
    ) {
      artBoard.addEventListener(
        "scroll",
        t_throttle(function () {
          var dataLazy = allRecords
            ? allRecords.getAttribute("data-tilda-lazy")
            : null;
          if (window.lazy === "y" || dataLazy === "yes") {
            t_onFuncLoad("t_lazyload_update", function () {
              t_lazyload_update();
            });
          }
        }, 500)
      );
    }

    if (window.location.hash !== "" && blockOverflow === "visible") {
      if (artBoard) artBoard.style.overflow = "hidden";
      setTimeout(function () {
        if (artBoard) artBoard.style.overflow = "visible";
      }, 1);
    }
  });

  /**
   * Для личного кабинета из-за того, что класс tlk-courses_page, проставляющий отступ к body,
   * добавляется асинхронно, вешаем MutationObserver, чтобы отследить момент, когда класс будет добавлен
   */
  if (window.tildaMembers && "MutationObserver" in window) {
    var mutationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target.classList.contains("tlk-courses_page")
        ) {
          t396_doResize(recid);
          mutationObserver.disconnect();
        }
      });
    });
    mutationObserver.observe(document.body, {
      attributes: true,
    });
  }

  // recalc zero params, if page has ME901 with padding at axisX
  if (document.querySelector(".t830")) {
    t_onReady(function () {
      var menuClassList = [
        "t830__allrecords_padd",
        "t830__allrecords_padd-small",
      ];
      var isAllRecContainsClass = menuClassList.some(function (className) {
        return allRecords.classList.contains(className);
      });
      if (isAllRecContainsClass) {
        t396_doResize(recid);
      } else {
        allRecords.addEventListener("allRecPaddingInit", function () {
          t396_doResize(recid);
        });
      }
    });
  }

  if (
    record &&
    zeroBlock &&
    artBoard &&
    record.getAttribute("data-connect-with-tab") === "yes"
  ) {
    zeroBlock.addEventListener("displayChanged", function () {
      t396_allelems__renderView(artBoard);
      t396_allgroups__renderView(artBoard);
      t396_doResize(recid);
    });
  }

  /* Fix for T203 and zero with autoscale */
  setTimeout(function () {
    if (record && record.closest("#allrecordstable") && zeroBlock && artBoard) {
      zeroBlock.addEventListener("displayChanged", function () {
        t396_allelems__renderView(artBoard);
        t396_allgroups__renderView(artBoard);
        t396_doResize(recid);
      });
    }
  }, 1000);

  // Fix for T635 in ZeroBlock
  var isT635Exist = !!document.querySelector(".t635__textholder");
  if (record && isT635Exist && zeroBlock && artBoard) {
    zeroBlock.addEventListener("animationInited", function () {
      t396_allelems__renderView(artBoard);
      t396_allgroups__renderView(artBoard);
      t396_doResize(recid);
    });
  }

  /* fix for disappearing elements in safari */
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) && zeroBlock) {
    zeroBlock.classList.add("t396_safari");
  }

  var isTildaModeEdit = allRecords
    ? allRecords.getAttribute("data-tilda-mode") === "edit"
    : null;
  if (isScaled && !isTildaModeEdit) {
    t_onFuncLoad("t396_scaleBlock", function () {
      // eslint-disable-next-line no-undef
      t396_scaleBlock(recid);
    });
  }

  if (
    !isTildaModeEdit &&
    t396_ab__getFieldValue(artBoard, "fixed-need-js") === "y"
  ) {
    t_onFuncLoad("t396__processFixedArtBoard", function () {
      // eslint-disable-next-line no-undef
      t396__processFixedArtBoard(artBoard);
    });
  }

  t396__processAbsoluteArtBoard(artBoard);
  t396__processTopShift(artBoard, recid, false);
}

function t396_isOnlyScalableBrowser() {
  return window.isOnlyScalable;
}

function t396__initOnlyScalable() {
  if (typeof window.isOnlyScalable !== "undefined") return;
  var firefoxMatch = window.navigator.userAgent.match(/Firefox\/([0-9]+)\./);
  var firefoxVersion = firefoxMatch ? parseInt(firefoxMatch[1], 10) : 126;
  var isChrome = window.navigator.userAgent.match(/Chrome\/([0-9]+)\./);
  var chromeVersion = (isChrome && parseInt(isChrome[1], 10)) || 0;
  window.isOnlyScalable = firefoxVersion < 126;
  window.shouldUseScaleFactor =
    !window.isOnlyScalable && !firefoxMatch && chromeVersion <= 127;
}

function t396__setGlobalScaleVariables(recid, resolution, isScaled) {
  window.tn_window_width = document.documentElement.clientWidth;
  var artBoardId = "ab" + recid;
  if (isScaled) {
    window.tn[artBoardId].scaleFactor = parseFloat(
      (window.tn_window_width / resolution).toFixed(3)
    );
    window.tn_scale_factor = parseFloat(
      (window.tn_window_width / resolution).toFixed(3)
    );
  } else {
    window.tn[artBoardId].scaleFactor = 1;
    window.tn_scale_factor = 1;
  }
}

/**
 *
 * @param {HTMLElement} artBoard
 * @param {string} recid - record ID
 * @param {Boolean } isResize
 */
function t396__processTopShift(artBoard, recid, isResize) {
  if (
    typeof window.t396__updateTopShift === "function" &&
    (t396_ab__getFieldValue(artBoard, "shift-processed") === "y" ||
      t396_ab__getFieldValue(artBoard, "fixed-shift") === "y")
  ) {
    // eslint-disable-next-line no-undef
    t396__updateTopShift(recid, isResize);
  }
}

function t396_doResize(recid) {
  var isOnlyScalable = t396_isOnlyScalableBrowser();
  var record = document.getElementById("rec" + recid);
  var allRecords = document.getElementById("allrecords");
  var resolution = t396_detectResolution(recid);
  var scaleStyle = record ? record.querySelector(".t396__scale-style") : null;
  t396__setScaleFactorForElements(recid);
  t396_removeElementFromDOM(scaleStyle);
  if (!isOnlyScalable) {
    var elements = record ? record.querySelectorAll(".t396__elem") : [];
    Array.prototype.forEach.call(elements, function (element) {
      element.style.zoom = "";
      var atom = element.querySelector(".tn-atom");
      if (atom) {
        atom.style.transformOrigin = "";
        atom.style.fontSize = "";
        atom.style.webkitTextSizeAdjust = "";
      }
    });
  } else {
    var coreElementList = record
      ? record.querySelectorAll(".tn-molecule, .tn-atom")
      : [];
    Array.prototype.forEach.call(coreElementList, function (coreElement) {
      /**
       * не обновляем атомы внутри молекулы, из-за того, что автоскейл внутри
       * физ. групп на них не распространяется, а работает на всю молекулу целиком
       */
      if (
        coreElement.classList.contains("tn-atom") &&
        coreElement.closest(".tn-molecule")
      )
        return;
      var atomWrapper = coreElement.closest(".tn-atom__scale-wrapper");
      var atomParent = atomWrapper ? atomWrapper.parentNode : null;
      if (atomParent) atomParent.removeChild(atomWrapper);
      if (atomParent) atomParent.appendChild(coreElement);
    });
  }
  t396_switchResolution(recid, resolution);
  var artBoard = record ? record.querySelector(".t396__artboard") : null;
  var isScaled = t396_ab__getFieldValue(artBoard, "upscale") === "window";
  t396__setGlobalScaleVariables(recid, resolution, isScaled);
  t396_updateTNobj(recid);
  t396_ab__renderView(artBoard);
  var tildaMode = allRecords ? allRecords.getAttribute("data-tilda-mode") : "";
  if (isScaled && tildaMode !== "edit") {
    t_onFuncLoad("t396_scaleBlock", function () {
      // eslint-disable-next-line no-undef
      t396_scaleBlock(recid);
    });
  }

  if (
    tildaMode !== "edit" &&
    t396_ab__getFieldValue(artBoard, "fixed-need-js") === "y"
  ) {
    t_onFuncLoad("t396__processFixedArtBoard", function () {
      // eslint-disable-next-line no-undef
      t396__processFixedArtBoard(artBoard);
    });
  }

  t396__processAbsoluteArtBoard(artBoard);
  t396__processTopShift(artBoard, recid, true);

  t396_allelems__renderView(artBoard);
  t396_allgroups__renderView(artBoard);

  if (!artBoard) return;
  // remove inline styles after scaleInitial
  var wrappers = [
    artBoard,
    artBoard.querySelector(".t396__carrier"),
    artBoard.querySelector(".t396__filter"),
  ];
  wrappers.forEach(function (wrapper) {
    if (wrapper) wrapper.style.height = "";
  });
}

function t396__processAbsoluteArtBoard(artBoard) {
  if (!artBoard) return;
  var currentPos = t396_ab__getFieldValue(artBoard, "pos");
  if (currentPos === "fixed") return; // same operation will be done from tilda-zero-fixed script
  var abNoBgClass = "t396__artboard-fixed-no-bg";
  if (currentPos !== "absolute") {
    artBoard.classList.remove(abNoBgClass);
    return;
  }
  var abStyles = getComputedStyle(artBoard);

  // set special class if artboard has no background
  var filter = artBoard.querySelector(".t396__filter");
  var filterHasNotBG = filter
    ? getComputedStyle(filter).backgroundImage === "none"
    : true;
  var abHasNotBG =
    abStyles.backgroundColor === "rgba(0, 0, 0, 0)" &&
    abStyles.backgroundImage === "none";

  var action = abHasNotBG && filterHasNotBG ? "add" : "remove";
  artBoard.classList[action](abNoBgClass);
}

function t396_detectResolution(recid) {
  if (!recid) return;

  var artBoardId = "ab" + recid;
  var windowWidth = window.innerWidth;
  if (window.t396__isMobile || window.t396__isIPad) {
    windowWidth = document.documentElement.clientWidth;
  }
  var resolution;

  window.tn[artBoardId].screens.forEach(function (screen) {
    if (windowWidth >= screen) resolution = screen;
  });

  if (typeof resolution === "undefined")
    resolution = window.tn[artBoardId].screens[0];

  return resolution;
}

function t396_initTNobj(recid, artBoard) {
  if (!artBoard) return;

  // Если объект уже существует, чтобы не перезатереть данные,
  // записываем объект второго уровня для конкретного блока и выходим
  if (typeof window.tn !== "undefined") {
    t396_setScreensTNobj(recid, artBoard);
    return;
  }

  // Если объект ещё не существует, создаём его
  window.tn = {};
  window.tn.ab_fields = [
    "height",
    "width",
    "bgcolor",
    "bgimg",
    "bgattachment",
    "bgposition",
    "filteropacity",
    "filtercolor",
    "filteropacity2",
    "filtercolor2",
    "height_vh",
    "valign",
  ];

  t396_setScreensTNobj(recid, artBoard);
}

function t396_setScreensTNobj(recid, artBoard) {
  var artBoardId = "ab" + recid;

  /* Заводим для конкретного artboard свой объект и записываем туда уникальные данные */
  window.tn[artBoardId] = {};
  window.tn[artBoardId].screens = [];

  var screens = artBoard.getAttribute("data-artboard-screens");
  if (!screens) {
    /* Если пользователь не менял дефолтные разрешения */
    window.tn[artBoardId].screens = [320, 480, 640, 960, 1200];
  } else {
    /* Если пользовательские настройки есть, то создаём корректный массив */
    screens = screens.split(",");
    screens.forEach(function (screen) {
      screen = parseInt(screen, 10);
      window.tn[artBoardId].screens.push(screen);
    });
  }
}

/**
 * Считаем отступы по оси X для случаев, когда контент страницы смещен, например,
 * при наличии бокового меню в ЛК, или блока ME901.
 *
 * @return {number}
 */
function t396__getAxisXPadding() {
  var allRecords = document.getElementById("allrecords");
  var paddingChecker =
    Boolean(window.tildaMembers) ||
    window.zero_window_width_hook === "allrecords";
  if (!allRecords || !paddingChecker) return 0;
  var processedElementsArray = [document.body, allRecords];
  var paddingX = processedElementsArray.reduce(function (acc, element) {
    var paddingLeft = window.getComputedStyle(element).paddingLeft;
    var paddingRight = window.getComputedStyle(element).paddingRight;
    return acc + parseInt(paddingLeft, 10) + parseInt(paddingRight, 10);
  }, 0);
  return paddingX || 0;
}

function t396_updateTNobj(recid) {
  var axisXPadding = t396__getAxisXPadding();
  window.tn.window_width = document.documentElement.clientWidth;
  if (axisXPadding) window.tn.window_width -= axisXPadding;

  window.tn.window_height = window.t396__isMobile
    ? document.documentElement.clientHeight
    : window.innerHeight;

  var artBoardId = "ab" + recid;
  var screensReverse = window.tn[artBoardId].screens.slice().reverse();

  for (var i = 0; i < screensReverse.length; i++) {
    if (window.tn[artBoardId].curResolution !== screensReverse[i]) continue;
    window.tn[artBoardId].canvas_min_width = screensReverse[i];
    window.tn[artBoardId].canvas_max_width =
      i === 0 ? window.tn.window_width : screensReverse[i - 1];
  }

  window.tn[artBoardId].grid_width = window.tn[artBoardId].canvas_min_width;
  window.tn[artBoardId].grid_offset_left =
    (window.tn.window_width - window.tn[artBoardId].grid_width) / 2;
}

var t396_waitForFinalEvent = (function () {
  var timers = {};
  return function (callback, ms, uniqueId) {
    if (!uniqueId) {
      uniqueId = "Don't call this twice without a uniqueId";
    }
    if (timers[uniqueId]) {
      clearTimeout(timers[uniqueId]);
    }
    timers[uniqueId] = setTimeout(callback, ms);
  };
})();

function t396_switchResolution(recid, resolution) {
  var artBoardId = "ab" + recid;
  var resolutionMax =
    window.tn[artBoardId].screens[window.tn[artBoardId].screens.length - 1];

  window.tn[artBoardId].curResolution = resolution;
  window.tn[artBoardId].curResolution_max = resolutionMax;

  // Данное свойство необходимо на тот случай, если скрипт zero
  // обновился, а второстепенные скрипты (например, zero-forms -- нет)
  window.tn.curResolution = resolution;
  window.tn.curResolution_max = resolutionMax;
}

function t396_artboard_build(data, recid) {
  /* set style to artboard */
  var record = document.getElementById("rec" + recid);
  var allRecords = document.getElementById("allrecords");
  var artBoard = record ? record.querySelector(".t396__artboard") : null;
  if (!artBoard) return false;

  t396_ab__renderView(artBoard);
  t396_allgroups__renderView(artBoard);
  t396__setScaleFactorForElements(recid);

  var event = document.createEvent("Event");
  event.initEvent("artBoardRendered", true, true);

  /* create elements */
  var elements = artBoard.querySelectorAll(".tn-elem");
  Array.prototype.forEach.call(elements, function (element) {
    var dataType = element.getAttribute("data-elem-type");
    switch (dataType) {
      case "text":
        t396_addText(artBoard, element);
        break;
      case "image":
        t396_addImage(artBoard, element);
        break;
      case "shape":
        t396_addShape(artBoard, element);
        break;
      case "button":
        t396_addButton(artBoard, element);
        break;
      case "video":
        t396_addVideo(artBoard, element);
        break;
      case "html":
        t396_addHtml(artBoard, element);
        break;
      case "tooltip":
        t396_addTooltip(artBoard, element);
        break;
      case "form":
        t396_addForm(artBoard, element, recid);
        break;
      case "gallery":
        t396_addGallery(artBoard, element, recid);
        break;
      case "vector":
        t396_addVector(artBoard, element);
        break;
    }
  });

  artBoard.classList.remove("rendering");
  artBoard.classList.add("rendered");
  artBoard.dispatchEvent(event);

  var artBoardOverflow = artBoard.getAttribute("data-artboard-ovrflw");
  if (
    (artBoardOverflow === "visible" || artBoardOverflow === "visibleX") &&
    allRecords
  ) {
    allRecords.style.overflow = "hidden";

    // ST320N фильтры - .t951__sidebar_sticky
    // ST3xx галерея в виде 1 или 2 колонок, текст фиксируется при скролле - .t-store__prod-popup__col_fixed
    // overflow:hidden и position:sticky не работают вместе, поэтому к overflow добавляем overflow:clip для обратной совместимости
    var sidebarSticky = document.querySelector(
      ".t951__sidebar_sticky,.t-store__prod-popup__col_fixed"
    );
    if (sidebarSticky) {
      // overflow:clip работает в Safari >= 16, Firefox >= 81, Chrome >= 90
      // чтобы не проверять все совместимые версии, доверимся браузеру, который сам решит какую декларацию соблюдать
      allRecords.style.cssText += "overflow:clip;";
    }
  }

  if (artBoardOverflow === "auto") {
    /*check if artboard has horizontal scrollbar*/
    var diff = Math.abs(artBoard.offsetHeight - artBoard.clientHeight);
    if (diff !== 0) {
      artBoard.style.paddingBottom = diff + "px";
    }
  }

  if (window.t396__isMobile || window.t396__isIPad) {
    var style = document.createElement("style");
    // prettier-ignore
    style.textContent = '@media only screen and (min-width:1366px) and (orientation:landscape) and (-webkit-min-device-pixel-ratio:2) {.t396__carrier {background-attachment:scroll!important;}}';

    record.insertAdjacentElement("beforeend", style);
  }
}

function t396_ab__renderView(artBoard) {
  if (!artBoard) return false;
  var fields = window.tn.ab_fields;
  var allRecords = document.getElementById("allrecords");
  var artBoardHeightVH;

  for (var i = 0; i < fields.length; i++) {
    t396_ab__renderViewOneField(artBoard, fields[i]);
  }

  var artBoardMinHeight = t396_ab__getFieldValue(artBoard, "height");
  var artBoardMaxHeight = t396_ab__getHeight(artBoard);
  var recid = artBoard.getAttribute("data-artboard-recid");
  var currentScaleFactor = t396__getCurrentScaleFactor(recid);

  var isTildaModeEdit = allRecords
    ? allRecords.getAttribute("data-tilda-mode") === "edit"
    : false;
  var isScaled = t396_ab__getFieldValue(artBoard, "upscale") === "window";
  artBoardHeightVH = t396_ab__getFieldValue(artBoard, "height_vh");
  if (isScaled && !isTildaModeEdit && artBoardHeightVH) {
    var scaledMinHeight = parseInt(artBoardMinHeight, 10) * currentScaleFactor;
  }
  var offsetTop;
  if (
    artBoardMinHeight === artBoardMaxHeight ||
    (scaledMinHeight && scaledMinHeight >= artBoardMaxHeight)
  ) {
    offsetTop = 0;
  } else {
    var artBoardVerticalAlign = t396_ab__getFieldValue(artBoard, "valign");
    switch (artBoardVerticalAlign) {
      case "top":
        offsetTop = 0;
        break;
      case "center":
        if (scaledMinHeight) {
          offsetTop = parseFloat(
            ((artBoardMaxHeight - scaledMinHeight) / 2).toFixed(1)
          );
        } else {
          offsetTop = parseFloat(
            ((artBoardMaxHeight - artBoardMinHeight) / 2).toFixed(1)
          );
        }
        break;
      case "bottom":
        if (scaledMinHeight) {
          offsetTop = parseFloat(
            (artBoardMaxHeight - scaledMinHeight).toFixed(1)
          );
        } else {
          offsetTop = parseFloat(
            (artBoardMaxHeight - artBoardMinHeight).toFixed(1)
          );
        }
        break;
      case "stretch":
        offsetTop = 0;
        artBoardMinHeight = artBoardMaxHeight;
        break;
      default:
        offsetTop = 0;
        break;
    }
  }

  artBoard.setAttribute("data-artboard-proxy-min-offset-top", offsetTop);
  artBoard.setAttribute("data-artboard-proxy-min-height", artBoardMinHeight);
  artBoard.setAttribute("data-artboard-proxy-max-height", artBoardMaxHeight);

  var filter = artBoard.querySelector(".t396__filter");
  var carrier = artBoard.querySelector(".t396__carrier");
  artBoardHeightVH = t396_ab__getFieldValue(artBoard, "height_vh");
  artBoardHeightVH = parseFloat(artBoardHeightVH);
  if ((window.t396__isMobile || window.t396__isIPad) && artBoardHeightVH) {
    var height =
      (document.documentElement.clientHeight * artBoardHeightVH) / 100;
    artBoard.style.height = height + "px";
    if (filter) filter.style.height = height + "px";
    if (carrier) carrier.style.height = height + "px";
  }
}

function t396__getCurrentScaleFactor(recid) {
  var artBoardId = "ab" + recid;
  var abScaleFactor =
    window.tn && window.tn[artBoardId] && window.tn[artBoardId].scaleFactor;
  return abScaleFactor || window.tn_scale_factor;
}

function t396__setScaleFactorForElements(recid) {
  var record = document.getElementById("rec" + recid);
  var artBoard = record ? record.querySelector(".t396__artboard") : null;
  if (!artBoard) return;
  var scaleFactor = t396__getCurrentScaleFactor(recid);
  var artBoardElements = artBoard.querySelectorAll(".t396__elem, .tn-group");
  Array.prototype.forEach.call(artBoardElements, function (element) {
    element.scaleFactor = scaleFactor;
  });
}

function t396_addText(artBoard, element) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString =
    "top,left,width,container,axisx,axisy,widthunits,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  /*render elem view*/
  t396_elem__renderView(element);
}

function t396_addImage(artBoard, element) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString =
    "img,width,filewidth,fileheight,top,left,container,axisx,axisy,widthunits,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  /*render elem view*/
  t396_elem__renderView(element);
  t396_processElemTransform(element);

  var img = element.querySelector("img");
  if (!img) return;
  img.addEventListener("load", function () {
    t396_elem__renderViewOneField(element, "top");
    if (img.src) {
      setTimeout(function () {
        t396_elem__renderViewOneField(element, "top");
      }, 2000);
    }
  });
  if (img.complete) {
    t396_elem__renderViewOneField(element, "top");
    if (img.src) {
      setTimeout(function () {
        t396_elem__renderViewOneField(element, "top");
      }, 2000);
    }
  }
  img.addEventListener("tuwidget_done", function () {
    t396_elem__renderViewOneField(element, "top");
  });
  t396_changeFilterOnSafari(element);
}

function t396_addShape(artBoard, element) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString = "width,height,top,left,";
  fieldsString +=
    "container,axisx,axisy,widthunits,heightunits,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  t396_elem__renderView(element);
  t396_processElemTransform(element);
}

/**
 * fix bug when user set blur and rotate
 *
 * @param {HTMLElement} element
 */
function t396_processElemTransform(element) {
  var elementStyles = getComputedStyle(element);
  var elementHasBlur =
    (elementStyles.backdropFilter && elementStyles.backdropFilter !== "none") ||
    (elementStyles.webkitBackdropFilter &&
      elementStyles.webkitBackdropFilter !== "none");
  if (!elementHasBlur) return;

  var atom = element.querySelector(".tn-atom");
  var atomTransform = atom ? window.getComputedStyle(atom).transform : "none";

  /*
   * matrix(a, b, c, d, e, f)
   *
   * The two arguments, A and D are for scaling the element in the
   * X-direction and the Y-direction, respectively. Identically to that of the scale(a, d) method.
   *
   * matrix(1, 0, 0, 1, 0, 0) === transform: scale(1)
   *
   * The second and third arguments B and C are for skewing the element.
   * The two values work identically to that of the skew(b, c) method.
   *
   * matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0) === rotate(45deg)
   * if there is any rotation than B === -C && A === D
   */
  if (atomTransform === "matrix(1, 0, 0, 1, 0, 0)") atomTransform = "none";
  if (atomTransform === "none") return;

  atom.style.transform = "none";
  element.style.transform = atomTransform;
}

/**
 * Only for Safari.
 * Hard change filter value in element.
 *
 * @param {HTMLElement} element - .t396__elem
 */
function t396_changeFilterOnSafari(element) {
  if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) return;
  var hasBackdropFilter = t396__checkContainBackdropFilter(element);
  if (!hasBackdropFilter || !("IntersectionObserver" in window)) return;
  var atom = element.querySelector(".tn-atom");
  var imageObserver = new IntersectionObserver(function (
    entries,
    imageObserver
  ) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var target = entry.target;
      imageObserver.unobserve(target);
      t396__processBackdropFilterOnImage(element);
    });
  });
  imageObserver.observe(atom);
}

function t396__checkContainBackdropFilter(element) {
  if (!element) return false;
  var backdropFilter = window.getComputedStyle(element).webkitBackdropFilter;
  if (backdropFilter && backdropFilter !== "none") return true;
  var animWrapper = element.querySelector(
    ".tn-atom__sbs-anim-wrapper, .tn-atom__prx-wrapper, .tn-atom__sticky-wrapper"
  );
  if (!animWrapper) return false;
  var wrapperBackdropFilter =
    window.getComputedStyle(animWrapper).webkitBackdropFilter;
  return wrapperBackdropFilter && wrapperBackdropFilter !== "none";
}

function t396__processBackdropFilterOnImage(elem) {
  if (!elem) return;
  var hasSBS = elem.getAttribute("data-animate-sbs-opts");
  var hasExtendedAnimation =
    elem.getAttribute("data-animate-prx") ||
    elem.getAttribute("data-animate-fix");
  var hasAnimation = hasSBS || hasExtendedAnimation;
  var isProcessed = elem.classList.contains(
    "t396__elem--backdrop-filter-img-wrappered"
  );

  if ((hasAnimation && isProcessed) || !hasAnimation) {
    t396__updateBackdropFilterOnImage(elem);
  } else {
    elem.addEventListener("backdropFilterImgWrappered", function () {
      t396__updateBackdropFilterOnImage(elem);
    });
  }
}

function t396__updateBackdropFilterOnImage(elem) {
  if (!elem) return;
  var img = elem.querySelector("img");
  var animWrapper = elem.querySelector(
    ".tn-atom__sbs-anim-wrapper, .tn-atom__prx-wrapper, .tn-atom__sticky-wrapper"
  );
  var targetFilterValue = "";
  if (animWrapper) {
    elem = animWrapper;
    targetFilterValue =
      window.getComputedStyle(elem).webkitBackdropFilter || "";
  }
  elem.style.webkitBackdropFilter = "none";
  t396_waitForUploadImg(img, function () {
    elem.style.webkitBackdropFilter = targetFilterValue;
  });
}

/**
 * Wait image loading.
 * Only for Safari via lazy-loading
 *
 * @param {HTMLImageElement} img
 * @param {Function} cb
 */
function t396_waitForUploadImg(img, cb) {
  if (window.lazy !== "y") {
    cb();
    return;
  }
  var timerID = setTimeout(function () {
    if (img.classList.contains("loaded") && img.clientWidth && img.src) {
      cb();
      clearTimeout(timerID);
    } else {
      t396_waitForUploadImg(img, cb);
    }
  }, 300);
}

function t396_addButton(artBoard, element) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString =
    "top,left,width,height,container,axisx,axisy,caption,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  /*render elem view*/
  t396_elem__renderView(element);
  t396_processElemTransform(element);

  return element;
}

function t396_addVideo(artBoard, element) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString = "width,height,top,left,";
  fieldsString +=
    "container,axisx,axisy,widthunits,heightunits,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  /*render elem view*/
  t396_elem__renderView(element);

  /*continued in the file "tilda-zero-video-1.0.js"*/
  t_onFuncLoad("t396_initVideo", function () {
    // eslint-disable-next-line no-undef
    t396_initVideo(element);
  });
}

function t396_addHtml(artBoard, element) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString = "width,height,top,left,";
  fieldsString +=
    "container,axisx,axisy,widthunits,heightunits,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  /*render elem view*/
  t396_elem__renderView(element);
}

function t396_addTooltip(artBoard, element) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString = "width,height,top,left,";
  fieldsString +=
    "container,axisx,axisy,widthunits,heightunits,leftunits,topunits,tipposition";
  element.setAttribute("data-fields", fieldsString);

  /*render elem view*/
  t396_elem__renderView(element);

  /*continued in the file "tilda-zero-tooltip-1.0.js"*/
  t_onFuncLoad("t396_initTooltip", function () {
    // eslint-disable-next-line no-undef
    t396_initTooltip(element);
  });
}

function t396_addForm(artBoard, element, recid) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString = "width,top,left,";
  fieldsString += "inputs,container,axisx,axisy,widthunits,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  /*find forms data for script*/
  var formElems;
  var elemid = element.getAttribute("data-elem-id");
  var textarea = element.querySelector(".tn-atom__inputs-textarea");
  if (textarea) formElems = textarea.value;

  /*continued in the file "tilda-zero-forms-1.0.js"*/
  t_onFuncLoad("t_zeroForms__init", function () {
    t396_elem__renderView(element);
    // eslint-disable-next-line no-undef
    t_zeroForms__init(recid, elemid, formElems);
    t396_elem__renderView(element);
  });
}

function t396_addGallery(artBoard, element, recid) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString = "width,height,top,left,";
  fieldsString +=
    "imgs,container,axisx,axisy,widthunits,heightunits,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  /*render elem view*/
  t396_elem__renderView(element);

  var elemid = element.getAttribute("data-elem-id");

  /*continued in the file "tilda-zero-gallery-1.0.js"*/
  t_onFuncLoad("t_zeroGallery__init", function () {
    // eslint-disable-next-line no-undef
    t_zeroGallery__init(recid, elemid);
  });
}

function t396_addVector(artBoard, element) {
  element = t396_getEl(element);
  if (!element) return;

  /*add data atributes*/
  var fieldsString =
    "width,filewidth,fileheight,top,left,container,axisx,axisy,widthunits,leftunits,topunits";
  element.setAttribute("data-fields", fieldsString);

  /*render elem view*/
  t396_elem__renderView(element);
  t396_processElemTransform(element);
}

function t396_elem__getFieldValue(element, prop) {
  element = t396_getEl(element);
  if (!element) return;

  if (element.classList.contains("tn-group")) {
    return t396_group__getFieldValue(element, prop);
  }

  var artBoard = element.closest(".t396__artboard");
  var recid = artBoard.getAttribute("data-artboard-recid");
  var artBoardId = "ab" + recid;

  // temp fix: for compability with old scripts
  if (typeof window.tn[artBoardId] === "undefined") {
    t396_initTNobj(recid, artBoard);
    var resolution = t396_detectResolution(recid);
    t396_switchResolution(recid, resolution);
  }

  var curRes = window.tn[artBoardId].curResolution;
  var curResMax = window.tn[artBoardId].curResolution_max;
  var screens = window.tn[artBoardId].screens;
  var dataField;

  if (curRes === curResMax) {
    dataField = element.getAttribute("data-field-" + prop + "-value");
  } else {
    dataField = element.getAttribute(
      "data-field-" + prop + "-res-" + curRes + "-value"
    );
  }

  if (!dataField && dataField !== "") {
    for (var i = 0; i < screens.length; i++) {
      var screen = screens[i];
      if (screen <= curRes) continue;

      if (screen === curResMax) {
        dataField = element.getAttribute("data-field-" + prop + "-value");
      } else {
        dataField = element.getAttribute(
          "data-field-" + prop + "-res-" + screen + "-value"
        );
      }

      if (dataField) break;
    }
  }

  return dataField;
}

function t396_elem__renderView(element) {
  element = t396_getEl(element);
  var fields = element ? element.getAttribute("data-fields") : "";
  if (!fields) return false;
  fields = fields.split(",");

  /*set to element value of every field  via css*/
  fields.forEach(function (field) {
    t396_elem__renderViewOneField(element, field);
  });
  t396_elem_fixLineHeight(element);
}

function t396_group__renderView(group) {
  var fields = group ? group.getAttribute("data-fields") : "";
  if (!fields) return false;
  fields = fields.split(",");

  fields.forEach(function (field) {
    var value = t396_group__getFieldValue(group, field);

    switch (field) {
      case "left":
        value = t396_elem__convertPosition__Local__toAbsolute(
          group,
          field,
          value
        );
        group.style.left = parseFloat(value).toFixed(1) + "px";
        break;
      case "top":
        value = t396_elem__convertPosition__Local__toAbsolute(
          group,
          field,
          value
        );
        group.style.top = parseFloat(value).toFixed(1) + "px";
        break;
    }
  });
}

function t396_elem__renderViewOneField(element, field) {
  element = t396_getEl(element);
  if (!element) return;

  /**
   * If the element already has dimensions and coordinates,
   * you don't need to do anything
   */

  var allRecords = document.getElementById("allrecords");
  var tildaMode = allRecords ? allRecords.getAttribute("data-tilda-mode") : "";
  var artBoard = element.closest(".t396__artboard");
  var isScaled = t396_ab__getFieldValue(artBoard, "upscale") === "window";
  if (
    element.getAttribute("data-scale-off") === "yes" &&
    isScaled &&
    tildaMode !== "edit"
  ) {
    return;
  }

  var value = t396_elem__getFieldValue(element, field);
  var elementType;
  var borderWidth;
  var borderStyle;
  var currentValue;
  var slidesMain;
  var slidesImg;

  switch (field) {
    case "left":
      value = t396_elem__convertPosition__Local__toAbsolute(
        element,
        field,
        value
      );
      element.style.left = parseFloat(value).toFixed(1) + "px";
      break;
    case "top":
      value = t396_elem__convertPosition__Local__toAbsolute(
        element,
        field,
        value
      );
      element.style.top = parseFloat(value).toFixed(1) + "px";
      break;
    case "width":
      value = t396_elem__getWidth(element, value);
      element.style.width = parseFloat(value).toFixed(1) + "px";
      elementType = element.getAttribute("data-elem-type");
      switch (elementType) {
        case "tooltip":
          var pinSvgIcon = element.querySelectorAll(".tn-atom__pin-icon");
          /* add width to near parent svg to fix InternerExplorer problem */
          Array.prototype.forEach.call(pinSvgIcon, function (pin) {
            var pinSize = parseFloat(value).toFixed(1) + "px";
            pin.style.width = pinSize;
            pin.style.height = pinSize;
          });
          element.style.height = parseInt(value).toFixed(1) + "px";
          break;
        case "gallery":
          borderWidth = t396_elem__getFieldValue(element, "borderwidth");
          borderStyle = t396_elem__getFieldValue(element, "borderstyle");
          if (!borderStyle || !borderWidth || borderStyle === "none") {
            borderWidth = 0;
          }
          value -= borderWidth * 2;
          currentValue = Math.round(parseFloat(value)) + "px";
          slidesMain = element.querySelector(".t-slds__main");
          slidesImg = element.querySelectorAll(".tn-atom__slds-img");

          element.style.width = currentValue;
          if (slidesMain) slidesMain.style.width = currentValue;
          Array.prototype.forEach.call(slidesImg, function (img) {
            img.style.width = currentValue;
          });
          break;
      }
      break;
    case "height":
      elementType = element.getAttribute("data-elem-type");
      if (elementType === "tooltip") return;
      value = t396_elem__getHeight(element, value);
      element.style.height = parseFloat(value).toFixed(1) + "px";

      if (elementType === "gallery") {
        borderWidth = t396_elem__getFieldValue(element, "borderwidth");
        borderStyle = t396_elem__getFieldValue(element, "borderstyle");
        if (!borderStyle || !borderWidth || borderStyle === "none") {
          borderWidth = 0;
        }
        value -= borderWidth * 2;
        currentValue = Math.round(parseFloat(value)) + "px";
        slidesMain = element.querySelector(".t-slds__main");
        slidesImg = element.querySelectorAll(".tn-atom__slds-img");

        element.style.height = currentValue;
        if (slidesMain) slidesMain.style.height = currentValue;
        Array.prototype.forEach.call(slidesImg, function (img) {
          img.style.height = currentValue;
        });
      }
      break;
    case "container":
      t396_elem__renderViewOneField(element, "left");
      t396_elem__renderViewOneField(element, "top");
      break;
    case "inputs":
      var textArea = element.querySelector(".tn-atom__inputs-textarea");
      value = textArea ? textArea.value : "";
      try {
        // eslint-disable-next-line no-undef
        t_zeroForms__renderForm(element, value);
      } catch (err) {}
      break;
  }

  if (
    field === "width" ||
    field === "height" ||
    field === "fontsize" ||
    field === "fontfamily" ||
    field === "letterspacing" ||
    field === "fontweight" ||
    field === "img"
  ) {
    t396_elem__renderViewOneField(element, "left");
    t396_elem__renderViewOneField(element, "top");
  }
}

function t396_elem__convertPosition__Local__toAbsolute(element, field, value) {
  element = t396_getEl(element);
  if (!element) return;
  var artBoard = element.closest(".t396__artboard");
  var recid = artBoard.getAttribute("data-artboard-recid");
  var artBoardId = "ab" + recid;
  var verticalAlignValue = t396_ab__getFieldValue(artBoard, "valign");
  var isScaled = t396_ab__getFieldValue(artBoard, "upscale") === "window";
  var allRecords = document.getElementById("allrecords");
  var tildaMode = allRecords ? allRecords.getAttribute("data-tilda-mode") : "";
  var isTildaModeEdit = tildaMode === "edit";
  var isOnlyScalable = t396_isOnlyScalableBrowser();
  var isScaledElement = !isTildaModeEdit && isScaled && isOnlyScalable;
  var isZoomedElement = !isTildaModeEdit && isScaled && !isOnlyScalable;
  var valueAxisY = t396_elem__getFieldValue(element, "axisy");
  var valueAxisX = t396_elem__getFieldValue(element, "axisx");
  var container = t396_elem__getFieldValue(element, "container");
  var isGroupPhysical =
    element.classList.contains("tn-group") &&
    t396_group__getFieldValue(element, "type") === "physical";
  var parentGroup = element.parentNode.closest(".tn-group");
  var isParentGroupPhysical =
    t396_group__getFieldValue(parentGroup, "type") === "physical";

  if (isGroupPhysical) {
    container = "grid";
  }

  value = parseInt(value);

  var elementContainer;
  var offsetLeft;
  var offsetTop;
  var elementWidth;
  var elementContainerWidth;
  var elementHeight;
  var elementContainerHeight;
  var currentScaleFactor = t396__getCurrentScaleFactor(recid);

  switch (field) {
    case "left":
      elementContainer = container === "grid" ? "grid" : "window";
      offsetLeft =
        container === "grid" ? window.tn[artBoardId].grid_offset_left : 0;
      elementContainerWidth =
        container === "grid"
          ? window.tn[artBoardId].grid_width
          : window.tn.window_width;

      /*fluid or not*/
      var elementLeftUnits = t396_elem__getFieldValue(element, "leftunits");
      if (elementLeftUnits === "%") {
        value = t396_roundFloat((elementContainerWidth * value) / 100);
      }

      if (isParentGroupPhysical) {
        var parentGroupLeft = parseInt(
          t396_group__getFieldValue(parentGroup, "left"),
          10
        );
        var parentGroupLeftUnits = t396_group__getFieldValue(
          parentGroup,
          "leftunits"
        );

        if (parentGroupLeftUnits === "%") {
          parentGroupLeft = t396_roundFloat(
            (elementContainerWidth * parentGroupLeft) / 100
          );
        }

        value = value - parentGroupLeft;

        break;
      }

      /*with scale logic*/
      if (!isTildaModeEdit && isScaled) {
        if (container === "grid" && isOnlyScalable)
          value = value * currentScaleFactor;
      } else {
        value = offsetLeft + value;
      }

      if (valueAxisX === "center") {
        elementWidth = t396_elem__getWidth(element);

        if (isScaledElement && elementContainer !== "window") {
          elementContainerWidth *= currentScaleFactor;
          elementWidth *= currentScaleFactor;
        }

        value = elementContainerWidth / 2 - elementWidth / 2 + value;
      }

      if (valueAxisX === "right") {
        elementWidth = t396_elem__getWidth(element);
        if (isScaledElement && elementContainer !== "window") {
          elementContainerWidth *= currentScaleFactor;
          elementWidth *= currentScaleFactor;
        }
        value = elementContainerWidth - elementWidth + value;
      }

      if (isScaledElement && elementContainer !== "window") {
        elementWidth = t396_elem__getWidth(element);
        value = value + (elementWidth * currentScaleFactor - elementWidth) / 2;
      }

      break;

    case "top":
      var artBoardParent = element.closest(".t396__artboard");
      var proxyMinOffsetTop = artBoardParent
        ? artBoardParent.getAttribute("data-artboard-proxy-min-offset-top")
        : "0";
      var proxyMinHeight = artBoardParent
        ? artBoardParent.getAttribute("data-artboard-proxy-min-height")
        : "0";
      var proxyMaxHeight = artBoardParent
        ? artBoardParent.getAttribute("data-artboard-proxy-max-height")
        : "0";

      var getElementHeight = function (element) {
        var height = t396_elem__getHeight(element);

        if (element && element.getAttribute("data-elem-type") === "image") {
          var width = t396_elem__getWidth(element);
          var fileWidth = t396_elem__getFieldValue(element, "filewidth");
          var fileHeight = t396_elem__getFieldValue(element, "fileheight");

          if (fileWidth && fileHeight) {
            var ratio = parseInt(fileWidth) / parseInt(fileHeight);
            height = width / ratio;
          }
        }
        return height;
      };

      elementContainer = container === "grid" ? "grid" : "window";
      offsetTop = container === "grid" ? parseFloat(proxyMinOffsetTop) : 0;
      elementContainerHeight =
        container === "grid"
          ? parseFloat(proxyMinHeight)
          : parseFloat(proxyMaxHeight);

      /*fluid or not*/
      var elTopUnits = t396_elem__getFieldValue(element, "topunits");
      if (elTopUnits === "%") {
        value = elementContainerHeight * (value / 100);
      }

      if (isParentGroupPhysical) {
        var parentGroupTop = parseInt(
          t396_group__getFieldValue(parentGroup, "top"),
          10
        );
        var parentGroupTopUnits = t396_group__getFieldValue(
          parentGroup,
          "topunits"
        );

        if (parentGroupTopUnits === "%") {
          parentGroupTop = t396_roundFloat(
            (elementContainerHeight * parentGroupTop) / 100
          );
        }

        value = value - parentGroupTop;

        break;
      }

      if (isScaledElement && elementContainer !== "window") {
        value *= currentScaleFactor;
      }

      if (isZoomedElement && elementContainer !== "window") {
        offsetTop =
          verticalAlignValue === "stretch" ? 0 : offsetTop / currentScaleFactor;
      }

      value = offsetTop + value;

      var artBoardHeightVH = t396_ab__getFieldValue(
        artBoardParent,
        "height_vh"
      );
      var artBoardMinHeight = t396_ab__getFieldValue(artBoardParent, "height");
      var artBoardMaxHeight = t396_ab__getHeight(artBoardParent);
      if (isScaled && !isTildaModeEdit && artBoardHeightVH) {
        var scaledMinHeight =
          parseInt(artBoardMinHeight, 10) * currentScaleFactor;
      }

      if (valueAxisY === "center") {
        elementHeight = getElementHeight(element);

        if (isScaledElement && elementContainer !== "window") {
          if (verticalAlignValue !== "stretch") {
            elementContainerHeight =
              elementContainerHeight * currentScaleFactor;
          } else if (scaledMinHeight) {
            elementContainerHeight =
              scaledMinHeight > artBoardMaxHeight
                ? scaledMinHeight
                : artBoardMaxHeight;
          } else {
            elementContainerHeight = artBoardParent.clientHeight;
          }

          elementHeight *= currentScaleFactor;
        }

        if (
          !isTildaModeEdit &&
          isScaled &&
          !isOnlyScalable &&
          elementContainer !== "window" &&
          verticalAlignValue === "stretch"
        ) {
          if (scaledMinHeight) {
            elementContainerHeight =
              scaledMinHeight > artBoardMaxHeight
                ? scaledMinHeight
                : artBoardMaxHeight;
          } else {
            elementContainerHeight = artBoardParent.clientHeight;
          }
          elementContainerHeight = elementContainerHeight / currentScaleFactor;
        }

        value = elementContainerHeight / 2 - elementHeight / 2 + value;
      }

      if (valueAxisY === "bottom") {
        elementHeight = getElementHeight(element);

        if (isScaledElement && elementContainer !== "window") {
          if (verticalAlignValue !== "stretch") {
            elementContainerHeight =
              elementContainerHeight * currentScaleFactor;
          } else if (scaledMinHeight) {
            elementContainerHeight =
              scaledMinHeight > artBoardMaxHeight
                ? scaledMinHeight
                : artBoardMaxHeight;
          } else {
            elementContainerHeight = artBoardParent.clientHeight;
          }

          elementHeight *= currentScaleFactor;
        }

        if (
          !isTildaModeEdit &&
          isScaled &&
          !isOnlyScalable &&
          elementContainer !== "window" &&
          verticalAlignValue === "stretch"
        ) {
          if (scaledMinHeight) {
            elementContainerHeight =
              scaledMinHeight > artBoardMaxHeight
                ? scaledMinHeight
                : artBoardMaxHeight;
          } else {
            elementContainerHeight = artBoardParent.clientHeight;
          }

          elementContainerHeight = elementContainerHeight / currentScaleFactor;
        }

        value = elementContainerHeight - elementHeight + value;
      }

      if (isScaledElement && elementContainer !== "window") {
        elementHeight = getElementHeight(element);
        var scaledDifference =
          (elementHeight * currentScaleFactor - elementHeight) / 2;
        scaledDifference = Math.round(scaledDifference);
        value += scaledDifference;
      }

      break;
  }

  return value;
}

/**
 * TODO: эта функция некорректно считает через getComputedStyle() значение размера шрифта и line-height
 * при наличии родителя-группы со свойством zoom.
 *
 * @param {HTMLElement} element
 */
function t396_elem_fixLineHeight(element) {
  /**
   * Different browsers have different algorithms for calculating relative line-height.
   * Because of this, large text elements have different heights in different browsers.
   * To fix this, calculate the line-height in pixels and round it up
   */

  // early return if element type not text
  var elementType = element.getAttribute("data-elem-type");
  if (elementType !== "text") return;

  // early return if atom is undefined
  var atom = element.querySelector(".tn-atom");
  if (!atom) return;

  var parentGroup = element.closest(".t396__group");
  if (parentGroup && parentGroup.style.zoom) return;

  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  var zoom = element.style.zoom;

  // remove line-height for case of resize
  atom.style.removeProperty("line-height");
  var lineHeight = parseFloat(window.getComputedStyle(atom).lineHeight);
  if (isSafari && zoom) {
    lineHeight = t396_elem__getCorrectStylesForSafari(element, "lineHeight");
  }

  // if line-height succesfully find, set it to element
  if (lineHeight && !isNaN(lineHeight)) {
    atom.style.lineHeight = Math.round(lineHeight) + "px";
  }
}

function t396_elem__getCorrectStylesForSafari(element, style) {
  var atom = element.querySelector(".tn-atom");
  var zoom = element.style.zoom;
  var cachedTextSizeAdjust = atom.style.webkitTextSizeAdjust;
  var cachedFontSize = atom.style.fontSize;
  atom.style.webkitTextSizeAdjust = "none";
  atom.style.fontSize = "";
  element.style.zoom = "";
  var value = parseFloat(window.getComputedStyle(atom)[style]);
  atom.style.webkitTextSizeAdjust = cachedTextSizeAdjust;
  atom.style.fontSize = cachedFontSize;
  if (zoom) element.style.zoom = zoom;
  return value;
}

function t396_ab__getFieldValue(artBoard, prop) {
  if (!artBoard) return;

  var dataField;
  var recid = artBoard.getAttribute("data-artboard-recid");
  var artBoardId = "ab" + recid;

  // temp fix: for compability with old scripts
  if (typeof window.tn[artBoardId] === "undefined") {
    t396_initTNobj(recid, artBoard);
    var resolution = t396_detectResolution(recid);
    t396_switchResolution(recid, resolution);
  }

  var curRes = window.tn[artBoardId].curResolution;
  var curResMax = window.tn[artBoardId].curResolution_max;
  var screens = window.tn[artBoardId].screens;

  if (curRes === curResMax) {
    dataField = artBoard.getAttribute("data-artboard-" + prop);
  } else {
    dataField = artBoard.getAttribute(
      "data-artboard-" + prop + "-res-" + curRes
    );
  }

  // dataField can exist with empty value,
  // to properly check, need to compare the value with null
  if (dataField === null) {
    for (var i = 0; i < screens.length; i++) {
      var screen = screens[i];
      if (screen <= curRes) continue;

      if (screen === curResMax) {
        dataField = artBoard.getAttribute("data-artboard-" + prop);
      } else {
        dataField = artBoard.getAttribute(
          "data-artboard-" + prop + "-res-" + screen
        );
      }

      if (dataField !== null) break;
    }
  }

  return dataField;
}

function t396_ab__renderViewOneField(artBoard, field) {
  t396_ab__getFieldValue(artBoard, field);
}

function t396_group__getFieldValue(group, field) {
  if (!group) return;

  var dataField;
  var recid = group
    .closest(".t396__artboard")
    .getAttribute("data-artboard-recid");
  var artBoardId = "ab" + recid;

  var curRes = window.tn[artBoardId].curResolution;
  var curResMax = window.tn[artBoardId].curResolution_max;
  var screens = window.tn[artBoardId].screens;
  var postfix = ["widthmode", "heightmode", "flex"].includes(field)
    ? ""
    : "-value";

  if (curRes === curResMax) {
    dataField = group.getAttribute("data-group-" + field + postfix);
  } else {
    dataField = group.getAttribute(
      "data-group-" + field + "-res-" + curRes + postfix
    );
  }

  // dataField can exist with empty value,
  // to properly check, need to compare the value with null
  if (dataField === null) {
    for (var i = 0; i < screens.length; i++) {
      var screen = screens[i];
      if (screen <= curRes) continue;

      if (screen === curResMax) {
        dataField = group.getAttribute("data-group-" + field + "-value");
      } else {
        dataField = group.getAttribute(
          "data-group-" + field + "-res-" + screen + "-value"
        );
      }

      if (dataField !== null) break;
    }
  }

  return dataField;
}

function t396_allgroups__renderView(artBoard) {
  if (!artBoard) return;

  var groups = artBoard.querySelectorAll(".tn-group");
  var physicalGroups = Array.prototype.filter.call(groups, function (group) {
    return t396_group__getFieldValue(group, "type") === "physical";
  });

  Array.prototype.forEach.call(physicalGroups, function (group) {
    t396_group__renderView(group);
    t396_allgroups__renderViewAutolayout(group);
  });
}

function t396_allgroups__renderViewAutolayout(group) {
  if (!group || !group.classList.contains("t396__group-flex")) return;
  var widthmode = t396_group__getFieldValue(group, "widthmode");
  var heightmode = t396_group__getFieldValue(group, "heightmode");
  group.style.width = widthmode === "hug" ? "min-content" : "";
  group.style.height = heightmode === "hug" ? "initial" : "";
}

function t396_allelems__renderView(artBoard) {
  if (!artBoard) return false;
  var ArtBoardelements = artBoard.querySelectorAll(".tn-elem");
  Array.prototype.forEach.call(ArtBoardelements, function (element) {
    t396_elem__renderView(element);
  });
}

function t396_ab__getHeight(artBoard, artBoardHeight) {
  if (!artBoardHeight)
    artBoardHeight = t396_ab__getFieldValue(artBoard, "height");
  artBoardHeight = parseFloat(artBoardHeight);

  /* get Artboard height (fluid or px) */
  var artBoardHeightVH = t396_ab__getFieldValue(artBoard, "height_vh");
  if (artBoardHeightVH) {
    artBoardHeightVH = parseFloat(artBoardHeightVH);
    if (!isNaN(artBoardHeightVH)) {
      var artBoardHeightVHpx =
        (window.tn.window_height * artBoardHeightVH) / 100;
      if (artBoardHeight < artBoardHeightVHpx) {
        artBoardHeight = artBoardHeightVHpx;
      }
    }
  }
  return artBoardHeight;
}

function t396_elem__getWidth(element, value) {
  element = t396_getEl(element);
  var artBoard = element.closest(".t396__artboard");
  var recid = artBoard.getAttribute("data-artboard-recid");
  var artBoardId = "ab" + recid;
  if (!value) value = t396_elem__getFieldValue(element, "width");
  value = parseFloat(value);
  var elWidthUnits = t396_elem__getFieldValue(element, "widthunits");
  if (elWidthUnits === "%") {
    var elementContainer = t396_elem__getFieldValue(element, "container");
    if (elementContainer === "window") {
      value = (window.tn.window_width * value) / 100;
    } else {
      value = (window.tn[artBoardId].grid_width * value) / 100;
    }
  }
  return value;
}

function t396_elem__getHeight(element, value) {
  element = t396_getEl(element);
  if (!value) value = t396_elem__getFieldValue(element, "height");
  value = parseFloat(value);
  var elemType = element.getAttribute("data-elem-type");

  if (
    elemType === "shape" ||
    elemType === "video" ||
    elemType === "html" ||
    elemType === "gallery" ||
    elemType === "button"
  ) {
    var elHeightUnits = t396_elem__getFieldValue(element, "heightunits");
    if (elHeightUnits === "%") {
      var artBoard = element.closest(".t396__artboard");
      var proxyMinHeight = artBoard
        ? artBoard.getAttribute("data-artboard-proxy-min-height")
        : "0";
      var proxyMaxHeight = artBoard
        ? artBoard.getAttribute("data-artboard-proxy-max-height")
        : "0";
      var artBoardMinHeight = parseFloat(proxyMinHeight);
      var artBoardMaxHeight = parseFloat(proxyMaxHeight);
      var elementContainer = t396_elem__getFieldValue(element, "container");

      if (elementContainer === "window") {
        value = artBoardMaxHeight * (value / 100);
      } else {
        value = artBoardMinHeight * (value / 100);
      }
    }
  } else {
    if (elemType === "text") {
      var atom = element.querySelector(".tn-atom");
      if (atom) atom.style.lineHeight = "";
    }
    value = element.clientHeight;
  }

  return value;
}

function t396_roundFloat(n) {
  n = Math.round(n * 100) / 100;
  return n;
}

function t396_removeElementFromDOM(el) {
  el = t396_getEl(el);
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

function t396_getEl(el) {
  if (window.jQuery && el instanceof jQuery) {
    return el.length ? el.get(0) : null;
  } else {
    return el;
  }
}

function t396_isBlockVisible(rec) {
  var windowWidth = window.innerWidth;
  var screenMin = rec.getAttribute("data-screen-min");
  var screenMax = rec.getAttribute("data-screen-max");

  if (screenMin && windowWidth < parseInt(screenMin, 10)) return false;
  return !(screenMax && windowWidth > parseInt(screenMax, 10));
}
