/**
 * scale both elements with the same recid
 */
function t396_scaleBlock(recid) {
  var records = document.querySelectorAll(`#rec${recid}`);
  if (!records.length) return;
  records.forEach((record) => {
    t396_scaleSingleBlock(recid, record);
  });
}

function t396_scaleSingleBlock(recid, record) {
  var isOnlyScalable = t396_isOnlyScalableBrowser();
  var resolution = t396_detectResolution(recid);

  var artBoard = record.querySelector(".t396__artboard");
  var toScaledElementList = t396_scale__getElementsToScale(artBoard);

  if (!artBoard || toScaledElementList.length === 0) return;

  var currentScaleFactor;
  if (typeof window.t396__getCurrentScaleFactor === "function") {
    currentScaleFactor = t396__getCurrentScaleFactor(recid);
  } else {
    currentScaleFactor =
      window.tn &&
      window.tn["ab" + recid] &&
      window.tn["ab" + recid].scaleFactor;
    if (!currentScaleFactor) currentScaleFactor = window.tn_scale_factor;
  }

  var artBoardHeight = t396_ab__getFieldValue(artBoard, "height");
  var updatedBlockHeight = Math.floor(artBoardHeight * currentScaleFactor);
  var artBoardHeightVH = t396_ab__getFieldValue(artBoard, "height_vh");

  if (artBoardHeightVH) {
    var artBoardMinHeight = t396_ab__getFieldValue(artBoard, "height");
    var artBoardMaxHeight = t396_ab__getHeight(artBoard);
    var scaledMinHeight = artBoardMinHeight * currentScaleFactor;
    updatedBlockHeight =
      scaledMinHeight >= artBoardMaxHeight
        ? scaledMinHeight
        : artBoardMaxHeight;
  }

  t396_scale__updateArtboardState(artBoard, updatedBlockHeight);

  toScaledElementList.forEach(function (elem) {
    var elementCore = elem.querySelector(".tn-molecule, .tn-atom");
    var elemType = t396_scale__getElementType(elem);
    var containerProp = t396_elem__getFieldValue(elem, "container");
    if (!containerProp && elemType === "group") containerProp = "grid";
    if (!elementCore || containerProp !== "grid") return;

    if (isOnlyScalable) {
      var scaleWrapper = elementCore.closest(".tn-atom__scale-wrapper");
      if (!scaleWrapper) {
        t396_scale__wrapElement(
          elementCore,
          currentScaleFactor,
          "tn-atom__scale-wrapper"
        );
        scaleWrapper = elementCore.closest(".tn-atom__scale-wrapper"); // обновляем переменную
      }
      elem.style.zoom = "";
      t396_scale__processBackdropFilter(elem, elementCore, scaleWrapper);
      t396_scale__processBackgroundForShape(
        elem,
        elementCore,
        elemType,
        currentScaleFactor
      );
    } else {
      // Исправление размера шрифта для Safari при автоскейле
      var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if ((elemType === "text" || elemType === "button") && isSafari) {
        var fontSize = parseFloat(getComputedStyle(elementCore).fontSize);

        var cachedTextSizeAdjust = elementCore.style.webkitTextSizeAdjust;
        elementCore.style.webkitTextSizeAdjust = "none";
        elem.style.zoom = currentScaleFactor;
        var cachedFontSize = parseFloat(getComputedStyle(elementCore).fontSize);
        cachedFontSize = Math.round(cachedFontSize);
        var delta = Math.abs(fontSize - cachedFontSize);
        elementCore.style.webkitTextSizeAdjust = cachedTextSizeAdjust;

        if (delta >= 1) {
          elementCore.style.fontSize =
            Math.round(fontSize * currentScaleFactor) + "px";
          elementCore.style.webkitTextSizeAdjust = "none";
        }
      }

      if (elem.getAttribute("data-scale-off") !== "yes") {
        elem.style.zoom = currentScaleFactor;
      }

      /**
       * Если применить свойство Zoom к шейпам высотой 1 пиксель или шириной 1 пиксель, они будут
       * визуально иметь разную толщину. Этот код исправляет эту ошибку.
       */

      if (elemType === "shape") {
        var elemHeight = t396_elem__getFieldValue(elem, "height");
        elemHeight = t396_elem__getHeight(elem, elemHeight);
        elemHeight = t396_elem__convertPosition__Local__toAbsolute(
          elem,
          "height",
          elemHeight
        );

        var elemWidth = t396_elem__getFieldValue(elem, "width");
        elemWidth = t396_elem__getWidth(elem, elemWidth);
        elemWidth = t396_elem__convertPosition__Local__toAbsolute(
          elem,
          "width",
          elemWidth
        );

        var elemTop = parseFloat(t396_elem__getFieldValue(elem, "top"));
        elemTop = t396_elem__convertPosition__Local__toAbsolute(
          elem,
          "top",
          elemTop
        );

        var elemLeft = parseFloat(t396_elem__getFieldValue(elem, "left"));
        elemLeft = t396_elem__convertPosition__Local__toAbsolute(
          elem,
          "left",
          elemLeft
        );

        var elemStyles = window.getComputedStyle(elementCore);
        var elemBorder = elemStyles.borderWidth;
        var isImage = elemStyles.backgroundImage !== "none" ? true : false;
        var isAnimated = elem.getAttribute("data-animate-sbs-event");

        if (
          (elemHeight <= 2 || elemWidth <= 2) &&
          elemBorder === "0px" &&
          !isImage &&
          !isAnimated
        ) {
          elem.style.removeProperty("zoom");

          /**
           * Избавляемся от свойства zoom, обновляя координаты и параметры элемента
           * с учетом коэффициента масштабирования.
           */

          var scaleWidth = elemWidth * currentScaleFactor;
          var scaleHeight = elemHeight * currentScaleFactor;
          var scaleTop = elemTop * currentScaleFactor;
          var scaleLeft = elemLeft * currentScaleFactor;

          elem.style.width = parseFloat(scaleWidth) + "px";
          elem.style.height = parseFloat(scaleHeight) + "px";
          elem.style.top = Math.round(scaleTop) + "px";
          elem.style.left = Math.round(scaleLeft) + "px";

          /**
           * Устанавливаем атрибут так, чтобы другие функции не меняли
           * размер и координаты элемента
           */

          elem.setAttribute("data-scale-off", "yes");
        }
      }

      if (
        elemType === "text" &&
        resolution < 1200 &&
        elementCore &&
        !isSafari
      ) {
        elementCore.style.webkitTextSizeAdjust = "auto";
      }
      if (elementCore) elementCore.style.transformOrigin = "center";
    }
  });
}

/**
 * Работаем только с прямыми потомками артборда, не преобразуя вложенные элементы
 * @param {HTMLElement} artBoard - текущий артборд
 * @return {HTMLElement[]} - отфильтрованный список элементов для автоскейла
 */
function t396_scale__getElementsToScale(artBoard) {
  if (!artBoard) return [];
  return Array.prototype.slice
    .call(artBoard.children)
    .filter(function (element) {
      return (
        element &&
        (element.classList.contains("t396__elem") ||
          element.classList.contains("t396__group"))
      );
    });
}

/**
 * Пропорционально изменяем высоту артборда,
 * чтобы все увеличенные элементы не оказались за пределами области видимости по вертикали
 * @param {HTMLElement} artBoard - текущий артборд
 * @param {number} height - высота артборда с учетом коофициента масшатабирования
 */
function t396_scale__updateArtboardState(artBoard, height) {
  artBoard.classList.add("t396__artboard_scale");
  var recid = artBoard.getAttribute("data-artboard-recid");

  // prettier-ignore
  var styleStr =
		'<style class="t396__scale-style">' +
		'.t-rec#rec' + recid + ' { overflow: visible; }' +
		'#rec' + recid + ' .t396__carrier,' +
		'#rec' + recid + ' .t396__filter,' +
		'#rec' + recid + ' .t396__artboard {' +
		'height: ' + height + 'px !important;' +
		'width: 100vw !important;' +
		'max-width: 100%;' +
		'}' +
		'</style>';

  artBoard.insertAdjacentHTML("beforeend", styleStr);
}

/**
 * Оборачиваем элемент
 * @param {HTMLElement} element - текущий элемент
 * @param {number} scaleFactor - соотношение размера экрана пользователя к разрешению артборда
 * @param {string} className - класс обертки
 */
function t396_scale__wrapElement(element, scaleFactor, className) {
  if (!element) return;
  var parent = element.parentNode;
  if (!parent) return;
  var div = document.createElement("div");
  div.classList.add(className);
  div.style.transform = "scale(" + scaleFactor + ")";
  div.appendChild(element);
  parent.appendChild(div);
}

/**
 * Исправляем проблему, которая возникает для onlyScalable-браузеров, в которых
 * элементы с css-свойствами backdrop-filter и border-radius некорректно рендерятся
 * @param {HTMLElement} element
 * @param {HTMLElement} elementCore - .tn-atom или .tn-molecule
 * @param {HTMLDivElement} scaleWrapper
 */
function t396_scale__processBackdropFilter(element, elementCore, scaleWrapper) {
  if (element.style.backdropFilter === "none")
    element.style.backdropFilter = "";
  var elemFilter = getComputedStyle(element).backdropFilter;
  if (!elemFilter) return;
  element.style.backdropFilter = "none";
  scaleWrapper.style.backdropFilter = elemFilter;
  var atomBorderRadius = getComputedStyle(elementCore).borderRadius;
  if (atomBorderRadius !== "0px")
    scaleWrapper.style.borderRadius = atomBorderRadius;
}

/**
 * Background-attachment: fixed; не работает ни с одним свойством transform в Firefox.
 * Чтобы это исправить, мы выявляем такие случаи, удаляем обертку со свойством transform: scale()
 * и добавляем координаты и размеры, рассчитанные с помощью currentScaleFactor.
 * @param {HTMLElement} elem
 * @param {HTMLElement} elementCore - .tn-atom или .tn-molecule
 * @param {string} elemType - тип элемента
 * @param {number} currentScaleFactor - коэфициент масштабирования
 */
function t396_scale__processBackgroundForShape(
  elem,
  elementCore,
  elemType,
  currentScaleFactor
) {
  if (elemType !== "shape") return;
  var coreStyles = elementCore && getComputedStyle(elementCore);
  if (!coreStyles) return;

  // возможны случаи, когда изображение не успело обработаться и добавится в стили, тогда проверяем атрибут
  var backgroundImage =
    (coreStyles && coreStyles.backgroundImage) ||
    elementCore.getAttribute("data-original");
  if (!backgroundImage || coreStyles.backgroundAttachment !== "fixed") return;

  elem.removeChild(elementCore.parentNode);
  elem.appendChild(elementCore);

  var elemHeight = t396_elem__getFieldValue(elem, "height");
  elemHeight = t396_elem__getHeight(elem, elemHeight);
  elemHeight = t396_elem__convertPosition__Local__toAbsolute(
    elem,
    "height",
    elemHeight
  );

  var elemWidth = t396_elem__getFieldValue(elem, "width");
  elemWidth = t396_elem__getWidth(elem, elemWidth);
  elemWidth = t396_elem__convertPosition__Local__toAbsolute(
    elem,
    "width",
    elemWidth
  );

  var elemTop = parseFloat(t396_elem__getFieldValue(elem, "top"));
  var elemLeft = parseFloat(t396_elem__getFieldValue(elem, "left"));

  elem.style.top = elemTop * currentScaleFactor + "px";
  elem.style.left = elemLeft * currentScaleFactor + "px";
  elem.style.height = elemHeight * currentScaleFactor + "px";
  elem.style.width = elemWidth * currentScaleFactor + "px";

  elem.setAttribute("data-scale-off", "yes");
}

/**
 * Определяем тип элемента
 * @param {HTMLElement} element
 * @returns {string} - тип элемента
 */
function t396_scale__getElementType(element) {
  var elementType = element.getAttribute("data-elem-type");
  if (!elementType && element.classList.contains("tn-group"))
    elementType = "group";
  return elementType;
}

/**
 * Для случаев, когда в <head/> нет встроенной функции t396_initialScale(),
 * но при этом ее вызов есть на странице.
 */
if (!window.t396_initialScale) window.t396_initialScale = function () {};
