/**
 * @file
 * **LazyLoad** позволяет загружать изображения на странице по мере прокрутки.
 *
 * Работает с тегами `<img>`, `<div>`, `<td>`, `<a>`, и `<iframe>`.
 *
 * ## Описание
 * - Оригинальное изображение должно находиться в атрибуте `data-original` (или в другом, указанном в настройках), а тег должен иметь класс `t-img` или `t-bgimg`.
 * - Реализована переменная загрузка изображений, где размер элемента DOM измеряется, и URL изображения изменяется с командами для изменения размера или формата.
 * - В случае ошибки загрузки URL изменяется на резервный `origin`, и загрузка повторяется с него.
 * - Есть отдельная функция для изображений с анимацией SBS.
 *
 * ## Тестирование
 * Скрипт включает в себя множество функций. Чтобы протестировать всё, нужно:
 * - Тестировать изображения с анимацией SBS.
 * - Проверить обложки с `fixed` в Safari.
 * - Проверить блоки с плиточной галереей (размеры должны правильно округляться).
 * - Тестировать слайдеры с миниатюрами (миниатюры должны быть маленького размера).
 * - Обеспечить перерасчет размеров при изменении на больший размер.
 * - Тестировать ошибки загрузки (переключение на `origin` и отправка статистики).
 * - Проверить блоки с сгенерированным контентом (тестировать функцию `update`, например, всплывающее окно с изображением).
 * - Тестировать горизонтальную прокрутку (включая мобильные устройства).
 * - Тестировать загрузку снизу вверх.
 *
 * @module tilda-lazyload-1.0.js
 */

/**
 * Глобальная переменная на которую можно ориентироваться, загружена ли эта библиотека
 * @type {string}
 * @default 'y'
 */
window.lazy = "y";

/**
 * Глобальный массив для хранения статистики загрузки изображений.
 *
 * Этот массив используется для хранения объектов, которые содержат информацию
 * о времени загрузки изображений и других параметрах, таких как тип домена, с которого была выполнена загрузка.
 *
 * @type {Array<Object>}
 * @property {number} time - Время загрузки изображения в миллисекундах.
 * @property {string} [th] - Флаг, указывающий на то, что изображение загружено с миниатюризированного домена (`'y'`, если да).
 * @property {string} [st] - Флаг, указывающий на то, что изображение загружено с домена `static` (`'y'`, если да).
 */
window.t_loadImgStats = [];

// Это обертка для подхода AMD (Asynchronous Module Definition), которая позволяет
// реализовывать модульный подход
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports === "object") {
    module.exports = factory();
  } else {
    root.LazyLoad = factory();
  }
})(this, function () {
  var _defaultSettings;
  var _supportsClassList;
  var _isInitialized = false;
  var _popularResolutions;
  var _popularResolutionsOther;
  var _supportsObserver = false;
  var _staticUrlRegex = /\/static\.tildacdn\.(info|.{1,3})\//;
  var _staticUrlReplaces = {};

  /**
   * PRIVATE FUNCTIONS *NOT RELATED* TO A SPECIFIC INSTANCE OF LAZY LOAD
   * -------------------------------------------------------------------
   */

  function _init() {
    if (!_isInitialized) {
      _defaultSettings = {
        elements_selector: "img",
        container: window,
        threshold: 300,
        throttle: 50,
        data_src: "original",
        data_srcset: "original-set",
        class_loading: "loading",
        class_loaded: "loaded",
        skip_invisible: true,
        show_while_loading: true,
        callback_load: null,
        callback_error: null,
        callback_set: null,
        callback_processed: null,
        placeholder:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      };
      if (document.body && typeof document.body === "object") {
        _supportsClassList = !!document.body.classList;
      }

      _supportsObserver = "IntersectionObserver" in window;

      _isInitialized = true;

      // Эти две переменных используются в функции модификации URL для ресайза
      // В них перечислены самые популярные размеры контейнеров изображений
      // Разбиты на две переменные для быстроты выполнения поиска. Самые популярные и менее
      // Размеры которые сюда не попали - округляются. - Нужно для того, чтобы сократить забивание кэша.
      // prettier-ignore
      _popularResolutions = [
				'200x151', '640x712', '320x356', '670x744', '335x372', '300x225', '500x375', '400x301',
				'748x832', '374x416', '670x502', '335x251', '360x234', '560x622', '280x311', '640x416',
			];
      // prettier-ignore
      _popularResolutionsOther = [
				'353x245', '155x151', '158x164', '372x495', '280x272', '117x117', '291x280', '280x269',
				'335x241', '283x283', '150x156', '353x233', '414x730', '372x362', '275x206', '290x322',
				'248x207', '177x136', '173x173', '280x308', '195x214', '248x191', '155x196', '163x203',
				'320x444', '158x162', '176x203', '412x700', '360x88', '360x616', '167x167', '130x144',
				'280x233', '560x314', '320x299', '372x275', '320x178', '372x242', '360x352', '353x294',
				'260x182', '372x310', '335x344', '374x432', '414x500', '374x360', '220x338', '150x146',
				'335x239', '176x176', '320x302', '374x260', '360x568', '191x221', '192x192', '372x558',
				'335x188', '320x358', '335x258', '374x575', '26x26', '353x360', '360x206', '335x248',
				'335x322', '167x256', '560x364', '155x172', '163x216', '163x181', '360x257', '374x561',
				'374x243', '220x212', '177x148', '291x324', '167x160', '375x749', '335x387', '172x172',
				'260x302', '414x700', '220x254', '177x172', '374x519', '176x169', '320x352', '335x233',
				'150x203', '360x207', '158x121', '360x396', '158x131', '150x98', '220x169', '182x202',
				'320x179', '372x413', '181x226', '353x200', '158x153', '375x628', '176x271', '374x364',
				'320x492', '374x247', '414x833', '353x393', '335x218', '560x399', '412x264', '293x164',
				'56x56', '177x204', '248x382', '181x181', '118x118', '260x346', '374x497', '260x202',
				'393x251', '158x158', '372x200', '373x414', '320x229', '177x177', '312x175', '374x312',
				'84x84', '320x329', '177x194', '353x350', '335x503', '335x446', '335x326', '374x200',
				'158x182', '320x237', '335x221', '176x196', '150x229', '320x224', '248x276', '360x299',
				'260x289', '196x216', '335x279', '177x272', '320x426', '260x172', '155x194', '320x369',
				'372x350', '360x302', '360x402', '169x186', '158x242', '173x199', '167x185', '360x238',
				'220x123', '320x308', '414x265', '374x350', '300x333', '177x170', '320x222', '320x311',
				'260x169', '150x173', '320x246', '353x265', '192x222', '158x151', '372x414', '150x144',
				'760x502', '314x176', '320x208', '182x182', '320x211', '163x163', '372x279', '360x202',
				'360x252', '260x252', '260x286', '353x392', '160x104', '374x281', '353x353', '150x231',
				'320x267', '372x372', '177x197', '275x154', '158x175', '374x374', '150x167', '260x146',
			];

      _staticUrlReplaces = {
        com: "com",
        info: "pub",
        pub: "pub",
        ink: "ink",
        pro: "pro",
        biz: "biz",
        net: "net",
        one: "one",
      };
    }
  }

  function _now() {
    var d = new Date();
    return d.getTime();
  }

  function _merge_objects(obj1, obj2) {
    var obj3 = {},
      propertyName;
    for (propertyName in obj1) {
      if (Object.prototype.hasOwnProperty.call(obj1, propertyName)) {
        obj3[propertyName] = obj1[propertyName];
      }
    }
    for (propertyName in obj2) {
      if (Object.prototype.hasOwnProperty.call(obj2, propertyName)) {
        obj3[propertyName] = obj2[propertyName];
      }
    }
    return obj3;
  }

  /**
   *Переводит выборку элементов (nodeSet) в массив
   */
  function _convertToArray(nodeSet) {
    var elsArray;
    try {
      elsArray = Array.prototype.slice.call(nodeSet);
    } catch (e) {
      var array = [],
        i,
        l = nodeSet.length;
      for (i = 0; i < l; i++) {
        array.push(nodeSet[i]);
      }
      elsArray = array;
    }
    elsArray.forEach(function (element) {
      element.isSkipByPosition =
        element.offsetParent === null &&
        _isExist(_getParent(element, "t396__carrier-wrapper")) === false &&
        element.getAttribute("data-content-cover-parallax") !== "fixed";
      // Условие должно отсечь элементы, которые скрыты диапазоном видимости
      var elRec = _getParent(element, "t-rec");
      if (_isExist(elRec)) {
        element.isNotUnderScreenRange =
          elRec.hasAttribute("data-screen-max") === false &&
          elRec.hasAttribute("data-screen-min") === false;
      }
    });
    return elsArray;
  }

  function _addClass(element, className) {
    // HTML 5 compliant browsers.
    if (_supportsClassList) {
      element.classList.add(className);
      return;
    }
    // Legacy browsers (IE<10) support.
    element.className += (element.className ? " " : "") + className;
  }

  function _removeClass(element, className) {
    // HTML 5 compliant browsers.
    if (_supportsClassList) {
      element.classList.remove(className);
      return;
    }
    // Legacy browsers (IE<10) support.
    element.className = element.className
      .replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), " ")
      .replace(/^\s+/, "")
      .replace(/\s+$/, "");
  }

  function _hasClass(element, className) {
    if (_supportsClassList) {
      return element.classList.contains(className);
    }
    // Legacy browsers (IE<10) support.
    return new RegExp(" " + className + " ").test(
      " " + element.className + " "
    );
  }

  // Ищет элемент с нужным классом выше
  function _getParent(element, className) {
    var p = element.parentNode;
    while (p && p !== document) {
      if (_hasClass(p, className) === true) {
        return p;
      }
      p = p.parentNode;
    }
    return null;
  }

  function _isExist(element) {
    return typeof element !== "undefined" && element !== null;
  }

  function _getOffset(element) {
    var rect = element.getBoundingClientRect();
    return {
      top: rect.top + document.body.scrollTop,
      left: rect.left + document.body.scrollLeft,
    };
  }

  function _isStaticUrl(url) {
    return _staticUrlRegex.test(url);
  }

  function _getThumbUrl(staticUrl) {
    return staticUrl.replace(_staticUrlRegex, function (_, domain) {
      return (
        "/" +
        t_lazyload__getThumbDomainName() +
        "." +
        (_staticUrlReplaces[domain] || "com") +
        "/"
      );
    });
  }

  // Служебные функции-полифилы или для упрощения - закончились
  /**
   * Одна из главных функций.
   * - Получает URL картинки из атрибуте data-original  (или другом указанным в настройках)
   * - Определяет будет ли модифицироваться URL - для загрузки Адаптивной версии изображения.
   * - Устанавливает URL в зависимости от типа Тега (img, div, iframe)
   *
   * @param {node} target - DOM-элемент куда должно быть установлена картинка для загрузки
   * @param {node} source - исходный DOM-элемент
   * их два т.к. может быть использован метод с фейковой подгрузкой. сначала загружаем в виртуальный div, а на успех - вставляем в нужное место.
   * таким образом нет в обложках мы видим сначала размытую мелкую картинку, а затем она мгновенно заменяется на нормальную
   * @param {string} srcDataAttribute - 'data-original' атрибут с исходной картинкой
   */
  function _setSources(target, source, srcsetDataAttribute, srcDataAttribute) {
    // получаем URL иображниея из атрибута data-original
    var src = source.getAttribute("data-" + srcDataAttribute);
    if (!src) {
      _removeClass(source, "loading");
      return;
    }

    // получаем размеры контейнера
    var width = source.clientWidth;
    var height = source.clientHeight;

    // т.к слайдеры почти всегда рисуются JS-ом, часто у дом-элементов конкретного слайда или миниатюры(буллета) не хватает размеров.
    // по-этому для них мы ищем родительские теги и берем размеры у них
    if (
      (_hasClass(source, "t-slds__bgimg") ||
        _hasClass(source, "t-slds__img")) &&
      !_hasClass(source, "t827__image")
    ) {
      var wrp = _getParent(source, "t-slds__wrapper");
      if (!wrp) wrp = _getParent(source, "t-slds__container");
      // если контейнер не найдет, возможно это миниатюрки снизу,
      // попробуем найти контейнер с другим именем для них
      if (_isExist(wrp) === false) {
        wrp = _getParent(source, "t-slds__thumbsbullet");
      }
      // если в итоге контейнер найден
      // берем его размер
      if (_isExist(wrp)) {
        width = wrp.clientWidth;
        height = wrp.clientHeight;
      }
    }

    // В Zero block с функцией Autoscale to window width у изображений меняются размеры
    if (_hasClass(source, "tn-atom") && _hasClass(source, "t-bgimg")) {
      var wrp = _getParent(source, "tn-atom__scale-wrapper");
      if (_isExist(wrp)) {
        var rect = wrp.getBoundingClientRect();
        var foo = t_lazyload__round("round", rect.width, rect.height, 10);
        width = foo[0];
        height = foo[1];
      }
    }

    //////
    // Модифицируем исходный URL изображения
    // меняя его и добавляя в него команды трансформации размера или конвертации в нужный формат
    // для этого мы определим начальные данные и вызовим специальную функцию

    var x = ""; // css background-position может быть не только center center, надо это учитывать
    var y = "";
    var bgsize = ""; // css background-size может быть cover или contain, надо это учитывать
    var bgatt = ""; // css background-attachment может быть fixed, надо это учитывать
    var comm = ""; // команда для трансформации - resize, cover или contain
    var rule = ""; // в дата атрибутах может быть передана индивидуальное правило. Например пропустить или округлить

    var round = 1; // коэф. округления размера
    var doo = true; // переменная определяет будем ли делать адаптацию и менять URL вообще
    var skip = false; // пропустить трансформацию размера, но оставить попытку конвертации в WEBP

    // если есть эта переменная - не делаем адаптацию URL вообще
    if (window.lazy_imgoptimoff == "yes") doo = false;

    // также не делаем адаптацию есть есть ошибка загрузки
    // причем мы учитываем и thumb и static
    // т.к. если даже thumb - норм, а static нет - то thumb может отдавать редирект на static - а он будет не доступен
    if (window.lazy_err_thumb === "y" || window.lazy_err_static === "y")
      doo = false;

    // определяем комманду трансформации
    // все картинки с тегом IMG - только resize, остальные - по принципу cover или contain
    if (source.tagName === "IMG") {
      comm = "resize";
    } else if (typeof getComputedStyle !== "undefined") {
      var sourceStyles = getComputedStyle(source);
      var bgPos = sourceStyles.backgroundPosition;
      if (bgPos) {
        var foo = bgPos.split(" ");
        x = foo[0];
        y = foo[1];
        if (x == "50%") {
          x = "center";
        } else if (x == "0%") {
          x = "left";
        } else if (x == "100%") {
          x = "right";
        }
        if (y == "50%") {
          y = "center";
        } else if (y == "0%") {
          y = "top";
        } else if (y == "100%") {
          y = "bottom";
        }
      }
      bgsize = sourceStyles.backgroundSize;
      bgatt = sourceStyles.backgroundAttachment;
      if (bgsize == "contain") {
        comm = "contain";
      } else {
        comm = "cover";
      }
      if (bgatt == "fixed") skip = true;
    } else {
      skip = true;
    }

    // У конкретной картинки в DOM-эллементе может быть прописаны индивидуальные правила в атрибуте data-lazy-rule
    // что надо с ним делать (правила отделяются запятыми)
    // Получаем этот аттрибут и применяем правила из него
    rule = source.getAttribute("data-lazy-rule");
    if (rule) {
      var a = rule.split(","),
        i;
      for (i = 0; i < a.length; i++) {
        if (a[i].indexOf("round:") > -1) {
          round = a[i].split(":")[1] * 1;
        }
        if (a[i].indexOf("comm:") > -1) {
          comm = a[i].split(":")[1];
          if (comm != "resize" && comm != "cover" && comm != "contain")
            doo = false;
        }
        if (a[i].indexOf("skip") > -1) {
          skip = true;
        }
        if (a[i].indexOf("optimoff") > -1) {
          doo = false;
        }
      }
    }

    // если из rule получили что нужно округлить размеры - делаем это
    if (round > 1) {
      var foo = t_lazyload__round(comm, width, height, round);
      width = foo[0];
      height = foo[1];
    }

    // для команды cover - определяем будем ли округлять размеры и менять на resize
    // - нет: если размеры делятся на 5
    // - нет: если это популярный размер
    // - нет: если это ZB
    // - нет: если это обложка
    // - в других случаях - округляем и меняем на resize (это нужно чтобы не создавать много индивидуальных версий картинок)
    if (comm == "cover" && width > 0 && height > 0 && width <= 1000) {
      if (
        width === Math.ceil(width / 5) * 5 &&
        height === Math.ceil(height / 5) * 5
      ) {
        //ok
      } else if (_popularResolutions.indexOf(width + "x" + height) > -1) {
        //ok
      } else if (_popularResolutionsOther.indexOf(width + "x" + height) > -1) {
        //add maybe latter chrome dev resolutions '375x667','414x736','375x812','414x823','411x731','360x640'
        //ok
      } else if (
        _hasClass(source, "tn-atom") ||
        _hasClass(source, "tn-atom__img")
      ) {
        //ok
      } else {
        if (_hasClass(source, "t-cover__carrier")) {
          //keep cover
        } else {
          comm = "resize";
        }
        var foo = t_lazyload__round(comm, width, height, 100);
        width = foo[0];
        height = foo[1];
      }
    }

    // fix case then empty img not loading, and img has width of browser icon broken image
    if (comm == "resize" && width < 30) {
      skip = true;
    }

    // модифицируем URL картинки, меняя static на thumb и добавляя операторы трансформации и конвертации
    // - если флаг doo не изменился и true
    // - если контейнер большой (десктоп) - то только конвертация без ресайза.
    // (ресайз на десктопе обложек не даст большого прироста в весе, а вот качество при пережатии - пострадает
    // иначе - ресайз)
    if (doo === true) {
      if (
        skip === true ||
        width > 1000 ||
        height > 1000 ||
        width == 0 ||
        (source.tagName != "IMG" && height == 0)
      ) {
        src = t_lazyload__getWebPUrl(src);
      } else {
        //if(src.charAt(63)<5){
        src = t_lazyload__getResizeUrl(
          source.tagName,
          comm,
          src,
          width,
          height,
          x,
          y,
          bgsize
        );
        //}
      }
    }

    // если фиксировали ошибки загрузки с static. - грузим с резервного
    if (window.lazy_err_static === "y" && _isStaticUrl(src)) {
      // static3 - общий резервный origin, для него не предусмотрена замена TLD
      src = src.replace(_staticUrlRegex, "/static3.tildacdn.com/");
    }

    // проверяем на пустоту
    if (!src) return;

    //////
    // наконец-то ставим URL картинки в target
    // ставим в нужный аттрибут в зависимости от типа тега
    if (target.tagName === "IMG") {
      target.setAttribute("src", src);
    } else if (target.tagName === "IFRAME") {
      target.setAttribute("src", src);
    } else if (target.tagName === "OBJECT") {
      target.setAttribute("data", src);
    } else {
      var gradient;
      if (target.style.backgroundImage.indexOf("-gradient(") !== -1) {
        var split = target.style.backgroundImage.split("), ");
        gradient = split[1];
      }
      if (gradient) {
        target.style.backgroundImage = "url(" + src + "), " + gradient;
      } else {
        target.style.backgroundImage = "url(" + src + ")";
        t_lazyload__checkParentBackground(target, src);
      }
    }

    // добавляем параметр в source
    // по нему в дальнейшем если нужно можно ориентироватья т.к если брать src или background-image
    // то они могу быть пустыми в случае когда мы грузим в фейковую картинку сперва
    source.lazy_loading_src = src;
  }

  /**
   * Проверяем явл. картинка обложкой или нет,
   * если да, то при загрузке фона и вставки его в элемент
   * убираем фон у родителя t-cover
   * Необходимо только для обложек у которых в качестве
   * фона уставноленно изображение с прозрачным фоном (svg)
   * @param {HTMLElement} el
   * @param {String} imageUrl
   */
  function t_lazyload__checkParentBackground(el, imageUrl) {
    var coverId = el.getAttribute("data-content-cover-id");
    if (!coverId) return;
    var srcType = imageUrl.split(".");
    srcType = srcType[srcType.length - 1];
    var parentEl = document.getElementById("recorddiv" + coverId);
    if (srcType === "svg") {
      parentEl.style.backgroundImage = "";
    }
  }

  /**
   * Функция округления размеров
   */
  function t_lazyload__round(comm, width, height, round) {
    if (comm == "cover" && width > 0 && height > 0) {
      var rr = width / height;
      var ratio = 1;

      //h > w
      if (rr <= 1) {
        if (rr <= 0.8) ratio = 0.8;
        if (rr <= 0.751) ratio = 0.75;
        if (rr <= 0.667) ratio = 0.667;
        if (rr <= 0.563) ratio = 0.562;
        if (rr <= 0.501) ratio = 0.5;
        height = Math.ceil(height / round) * round;
        width = Math.ceil(height * ratio);
        width = Math.ceil(width / 10) * 10;
      } else {
        if (rr >= 1.25) ratio = 1.25;
        if (rr >= 1.332) ratio = 1.333;
        if (rr >= 1.5) ratio = 1.5;
        if (rr >= 1.777) ratio = 1.777;
        if (rr >= 2.0) ratio = 2.0;
        width = Math.ceil(width / round) * round;
        height = Math.ceil(width / ratio);
        height = Math.ceil(height / 10) * 10;
      }
    } else {
      if (width > 0) {
        width = Math.ceil(width / round) * round;
      }
      if (height > 0) {
        height = Math.ceil(height / round) * round;
      }
    }

    return [width, height];
  }

  /**
   * Функция преобразования URL картинки, добавляя в путь модификаторы трансформации и конвертации в WEBP
   * - Если URL не наш или SVG - ничего не делает
   * - Для ретины - удваивает размеры
   * - Если размеры > 1000 - ничего не делает (т.к в выигрыша в весе файла не получается, но зато происходит двойная компрессия)
   * - При DPR = 1 и размере изображения меньше 400px по большей размерности увеличиваем размеры изображения в 1.2 раз
   */
  function t_lazyload__getResizeUrl(tagName, comm, str, width, height, x, y) {
    if (str == "undefined" || str == null) return str;
    if (
      str.indexOf(".svg") > 0 ||
      str.indexOf(".gif") > 0 ||
      str.indexOf(".ico") > 0 ||
      str.indexOf("static.tildacdn.") === -1 ||
      str.indexOf("-/empty/") > 0 ||
      str.indexOf("-/resizeb/") > 0
    )
      return str;
    if (str.indexOf("/-/") > -1) return str;
    if (width == 0 && height == 0) return str;
    if (window.lazy_err_thumb == "y") return str;
    if (str.indexOf("lib") > -1) return str;
    if (
      tagName !== "IMG" &&
      tagName !== "DIV" &&
      tagName !== "TD" &&
      tagName !== "A"
    )
      return str;

    var k = 1;
    if (window.devicePixelRatio === 1 && Math.max(width, height) <= 400)
      k = 1.2;
    if (window.devicePixelRatio > 1) k = 2;

    if (width > 0) width = parseInt(k * width);
    if (height > 0) height = parseInt(k * height);

    if (width > 1000 || height > 1800) {
      var newstr = t_lazyload__getWebPUrl(str);
      return newstr;
    }

    if (comm == "resize") {
      var arrr = str.split("/");
      // prettier-ignore
      arrr.splice(
				str.split('/').length - 1,
				0, '-/resize/' + width + 'x' + (tagName == 'DIV' && height > 0 ? height : '') + '/' + (window.lazy_webp == 'y' ? '-/format/webp' : '')
			);
      var newstr = _getThumbUrl(arrr.join("/"));
    } else {
      if (width <= 0 && height <= 0) return str;

      if (x !== "left" && x !== "right") x = "center";
      if (y !== "top" && y !== "bottom") y = "center";

      var arrr = str.split("/");
      // prettier-ignore
      arrr.splice(
				str.split('/').length - 1,
				0,
				'-/' + comm + '/' + width + 'x' + height + '/' + x + '/' + y + '/' + (window.lazy_webp == 'y' ? '-/format/webp' : '')
			);
      var newstr = _getThumbUrl(arrr.join("/"));
    }
    return newstr;
  }

  /**
   * Функция преобразования URL картинки, добавляя в путь конвертацию в WEBP
   * - передается строка с урл картинки,
   * - добавляет в урл модификатор преобразования в webp - если он поддерживается браузером
   */
  function t_lazyload__getWebPUrl(str) {
    if (str == "undefined" || str == null) return str;
    if (
      str.indexOf(".svg") > 0 ||
      str.indexOf(".gif") > 0 ||
      str.indexOf(".ico") > 0 ||
      str.indexOf("static.tildacdn.") === -1 ||
      str.indexOf("-/empty/") > 0 ||
      str.indexOf("-/resizeb/") > 0
    )
      return str;
    if (str.indexOf("/-/") > -1) return str;
    if (str.indexOf("lib") > -1) return str;
    if (!(window.lazy_webp === "y")) {
      return str;
    }
    if (window.lazy_err_thumb === "y") return str;

    var arrr = str.split("/");
    arrr.splice(str.split("/").length - 1, 0, "-/format/webp");
    var newstr = _getThumbUrl(arrr.join("/"));

    return newstr;
  }

  /**
   * Загрузка изобрадения с резервного origin
   * Функция вызывается в случае ошибки загрузки изображения.
   * - Из URL удаляются все модификаторы трансформации
   * - заменяется origin на резервный
   * - отправляется событие на сервер системной статистики для трекинга массового сбоя
   */
  function t_lazyload__reloadonError(element, src, startTime) {
    if (typeof src != "string" || src == null || src == "") return;

    //console.log('lazy loading err: '+src);
    // eslint-disable-next-line no-console
    console.log("lazy loading err");

    // 1
    // если изображение со static.
    if (_isStaticUrl(src)) {
      window.lazy_err_static = "y";
      // static3 - общий резервный origin, для него не предусмотрена замена TLD
      var newsrc = src.replace(_staticUrlRegex, "/static3.tildacdn.com/");
      t_lazyload__reloadonError__reload(element, newsrc);
      return;
    }

    // 2
    // если изображение с thumb
    if (
      src.indexOf(t_lazyload__getThumbDomainName()) === -1 ||
      src.indexOf("/-/") === -1
    )
      return;

    window.lazy_err_thumb = "y";

    // убираем модификаторы из url
    var arrr = src.split("/");
    var uid = "";
    var name = "";
    if (arrr.length > 3) {
      for (var i = 0; i < arrr.length; i++) {
        if (arrr[i] !== "") {
          if (
            arrr[i].substring(0, 3) == "til" &&
            arrr[i].length == 36 &&
            (arrr[i].match(/-/g) || []).length == 4
          ) {
            uid = arrr[i];
          }
          if (i == arrr.length - 1) {
            name = arrr[i];
          }
        }
      }
    }

    // загружаем изображение с резерва
    if (uid !== "" && name !== "") {
      var newsrc = "https://static3.tildacdn.com/" + uid + "/" + name;
      t_lazyload__reloadonError__reload(element, newsrc);
    }

    // Sys Stat
    // Load script with errors handlers
    if (typeof t_errors__sendCDNErrors !== "function") {
      var s = document.createElement("script");
      s.src = "https://static.tildacdn.com/js/tilda-errors-1.0.min.js";
      s.type = "text/javascript";
      s.async = true;
      document.body.appendChild(s);
    }

    // calc request time from try to load img to error time
    var qTime = startTime > 1 ? _now() - startTime : "";

    // - Save error detail to array
    if (typeof window.t_cdnerrors !== "object") window.t_cdnerrors = [];
    window.t_cdnerrors.push({
      url: src,
      time: qTime,
      debug: { domloaded: window.t_lazyload_domloaded },
    });
  }

  function t_lazyload__reloadonError__reload(element, src) {
    // eslint-disable-next-line no-console
    console.log("try reload: " + src);
    if (element.tagName === "IMG") {
      if (src) element.setAttribute("src", src);
    } else if (src) element.style.backgroundImage = "url(" + src + ")";
  }

  /**
   * INITIALIZER
   * -----------
   */

  function LazyLoad(instanceSettings) {
    _init();

    this._settings = _merge_objects(_defaultSettings, instanceSettings);
    this._queryOriginNode =
      this._settings.container === window ? document : this._settings.container;

    this._previousLoopTime = 0;
    this._loopTimeout = null;

    if (_supportsObserver) {
      this._initializeObserver();
    }

    this.update();

    this.loadAnimatedImages();
  }

  /*
   * PRIVATE FUNCTIONS *RELATED* TO A SPECIFIC INSTANCE OF LAZY LOAD
   * ---------------------------------------------------------------
   */

  /**
   * We use _showOnLoad for Сovers
   * Show image when fake img element was loaded
   * Это позволяет во время загрузки оригинального изображения, показывать маленькую размытую картинку в обложках
   */
  LazyLoad.prototype._showOnLoad = function (element) {
    var fakeImg,
      settings = this._settings;
    var startTime;

    // If no src attribute given use data:uri.
    if (!element.getAttribute("src") && settings.placeholder) {
      element.setAttribute("src", settings.placeholder);
    }

    // Creating a new `img` in a DOM fragment.
    fakeImg = document.createElement("img");

    // Listening to the load event
    function loadCallback() {
      // As this method is asynchronous, it must be protected against external destroy() calls
      if (settings === null) {
        return;
      }

      // Add stat to array
      t_lazyLoad__appendImgStatToArr(fakeImg, startTime);

      // Calling LOAD callback
      if (settings.callback_load) {
        settings.callback_load(element);
      }
      _setSources(element, element, settings.data_srcset, settings.data_src);
      // Calling SET callback
      if (settings.callback_set) {
        settings.callback_set(element);
      }
      _removeClass(element, settings.class_loading);
      _addClass(element, settings.class_loaded);
      fakeImg.removeEventListener("load", loadCallback);
    }

    fakeImg.addEventListener("load", loadCallback);
    fakeImg.addEventListener("error", function (ev) {
      _removeClass(element, settings.class_loading);
      if (settings.callback_error) {
        settings.callback_error(element);
      }
      if (ev.path !== undefined) {
        t_lazyload__reloadonError(element, ev.path[0].currentSrc, startTime);
      } else if (ev.target !== undefined) {
        t_lazyload__reloadonError(element, ev.target.currentSrc, startTime);
      }
    });
    _addClass(element, settings.class_loading);

    //stat start loading time
    startTime = _now();

    // главная функция -
    // устанавливаем картинку в DOM-элемент
    _setSources(fakeImg, element, settings.data_srcset, settings.data_src);
  };

  /**
   * We use _showOnAppear for all cases exept Сovers
   */
  LazyLoad.prototype._showOnAppear = function (element) {
    var settings = this._settings;
    var startTime;

    function loadCallback() {
      // As this method is asynchronous, it must be protected against external destroy() calls
      if (settings === null) {
        return;
      }

      // Add stat to array
      t_lazyLoad__appendImgStatToArr(element, startTime);

      // Calling LOAD callback
      if (settings.callback_load) {
        settings.callback_load(element);
      }
      _removeClass(element, settings.class_loading);
      _addClass(element, settings.class_loaded);
      element.removeEventListener("load", loadCallback);
    }

    if (element.tagName === "IMG" || element.tagName === "IFRAME") {
      element.addEventListener("load", loadCallback);
      element.addEventListener("error", function (ev) {
        element.removeEventListener("load", loadCallback);
        _removeClass(element, settings.class_loading);
        if (settings.callback_error) {
          settings.callback_error(element);
        }
        if (ev.path !== undefined) {
          t_lazyload__reloadonError(element, ev.path[0].currentSrc, startTime);
        } else if (ev.target !== undefined) {
          t_lazyload__reloadonError(element, ev.target.currentSrc, startTime);
        }
      });
      _addClass(element, settings.class_loading);
    }

    // stat start loading time
    startTime = _now();

    // главная функция -
    // устанавливаем картинку в DOM-элемент
    _setSources(element, element, settings.data_srcset, settings.data_src);

    // calling SET callback
    if (settings.callback_set) {
      settings.callback_set(element);
    }
  };

  LazyLoad.prototype._show = function (element) {
    if (this._settings.show_while_loading) {
      this._showOnAppear(element);
    } else {
      this._showOnLoad(element);
    }
  };

  /**
   * Инициализирует обсервер который будет смотреть за видимостью элементов
   * И если элемент видим, то он загружается и исключается из обсервера
   */
  LazyLoad.prototype._initializeObserver = function () {
    var self = this;

    this._intersectionObserver = new IntersectionObserver(
      function (entries) {
        var scrollY = window.scrollY;

        entries.forEach(function (entry) {
          var element = entry.target;

          if (
            self._settings.skip_invisible &&
            element.isSkipByPosition &&
            element.isNotUnderScreenRange
          ) {
            return;
          }

          var isAboveViewport = entry.boundingClientRect.top + scrollY < 0;
          var parentZeroElem = element.closest(".t396__elem");
          var isAboveInnerViewport =
            parentZeroElem && parentZeroElem.style.top.indexOf("-") === 0;

          if (element.wasProcessed) {
            self._intersectionObserver.unobserve(element);

            if (self._settings.callback_processed) {
              self._settings.callback_processed(self._elements.length);
            }

            return;
          }

          if (entry.isIntersecting || isAboveViewport || isAboveInnerViewport) {
            self._show(element);

            element.wasProcessed = true;
          }
        });
      },
      {
        rootMargin: this._settings.threshold + "px",
        threshold: [0],
      }
    );
  };

  /*
   * PUBLIC FUNCTIONS
   * ----------------
   */

  /**
   * Force load for imgs with sbs bacause this imgs change their coords
   */
  LazyLoad.prototype.loadAnimatedImages = function () {
    var i,
      element,
      settings = this._settings,
      elements = this._elements,
      elementsLength = !elements ? 0 : elements.length;

    function getTriggerElementOffset(element, type) {
      var trgEl;
      if (type === "trigger") {
        var trgId = element.getAttribute("data-animate-sbs-trgels");
        if (trgId) {
          trgEl = document.querySelector('[data-elem-id="' + trgId + '"]');
        }
      } else if (type === "viewport") {
        trgEl = _getParent(element, "t396");
      }
      return _isExist(trgEl) ? _getOffset(trgEl) : null;
    }

    function isFarAway(element, type) {
      var trgOffset = getTriggerElementOffset(element, type);
      if (!trgOffset) return false;

      var elemOffset = _getOffset(element);
      var distanceTopBottomBetween = Math.abs(trgOffset.top - elemOffset.top);
      var distanceRightLeftBetween = Math.abs(trgOffset.left - elemOffset.left);

      return (
        distanceTopBottomBetween > settings.threshold ||
        distanceRightLeftBetween > settings.threshold
      );
    }

    for (i = 0; i < elementsLength; i++) {
      element = elements[i];
      if (
        !_hasClass(element, "tn-atom__img") &&
        !_hasClass(element, "tn-atom")
      ) {
        continue;
      }

      var elContainer = _getParent(element, "tn-elem");
      var isAnimated = elContainer.getAttribute("data-animate-sbs-opts");
      var animEvent = elContainer.getAttribute("data-animate-sbs-event");
      var animTrgEls = elContainer.getAttribute("data-animate-sbs-trgels");
      var animType;

      if (animEvent === "intoview" || animEvent === "blockintoview")
        animType = "viewport";
      if (!animTrgEls) animType = "trigger";

      // If must skip_invisible and element is invisible, skip it or not animated
      if (
        (settings.skip_invisible && element.offsetParent === null) ||
        !isAnimated
      ) {
        continue;
      }

      if (isFarAway(elContainer, animType)) {
        // Forking behaviour depending on show_while_loading (true value is ideal for progressive jpeg).
        if (settings.show_while_loading) {
          this._showOnAppear(element);
        } else {
          this._showOnLoad(element);
        }

        element.wasProcessed = true;

        if (settings.callback_processed) {
          settings.callback_processed(elements.length);
        }
      }
    }
  };

  /**
   * Вызывается при необходимости вручную обновить
   * И определяет, будут они показаны или нет + вешает эвент на скролл
   */
  LazyLoad.prototype.update = function () {
    var self = this;

    this._elements = _convertToArray(
      this._queryOriginNode.querySelectorAll(this._settings.elements_selector)
    );

    if (_supportsObserver && this._intersectionObserver) {
      this._intersectionObserver.disconnect();

      return this._elements.forEach(function (element) {
        self._intersectionObserver.observe(element);
      });
    }

    this._elements.forEach(function (element) {
      self._show(element);

      if (self._settings.callback_processed) {
        self._settings.callback_processed(self._elements.length);
      }

      element.wasProcessed = true;
    });
  };

  LazyLoad.prototype.destroy = function () {
    this._intersectionObserver.disconnect();
    this._elements = null;
    this._queryOriginNode = null;
    this._settings = null;
  };

  return LazyLoad;
});

/**
 * Запускаем на document ready
 */
if (document.readyState != "loading") {
  t_lazyload__init();
} else {
  document.addEventListener("DOMContentLoaded", t_lazyload__init);
}

/**
 * Инициализирующая начальная функция
 */
function t_lazyload__init() {
  // Сначала несколько подготовительных шагов

  // определим поддержку WEBP браузером
  t_lazyload__detectwebp();

  // режим оптимизации изображений может быть выключен в настройках сайта
  // смотрим дата атрибут data-tilda-imgoptimoff
  // если == yes, модфикиации URL картинок не будет
  var elAllRecs = document.querySelector("#allrecords");
  if (elAllRecs && elAllRecs.getAttribute("data-tilda-imgoptimoff") === "yes") {
    window.lazy_imgoptimoff = "yes";
  } else {
    window.lazy_imgoptimoff = "";
  }

  // обработаем блоки, в которых не нужна оптимизация
  // и пропишем картинкам в этих блоках атрибут rule с пропуском
  var elstoSkip = document.querySelectorAll(".t156 .t-img");
  for (var i = 0; i < elstoSkip.length; i++) {
    elstoSkip[i].setAttribute("data-lazy-rule", "skip");
  }

  // обработаем блоки, в которых нужно жесткое округление
  // обычно это все галереи плиткой, у которых ширина = ширине браузера
  // (в плитках картинки маленькие, а размер окна бразуера у всех очень случайный,
  //    по-этому надо жестко округлять, иначе много уникальных размеров)
  var elstoRound = document.querySelectorAll(
    ".t492,.t552,.t251,.t603,.t660,.t661,.t662,.t680,.t827,.t909,.t218,.t740,.t132,.t694,.t762,.t786,.t546"
  );
  Array.prototype.forEach.call(elstoRound, function (el) {
    var bars = el.querySelectorAll(".t-bgimg");
    Array.prototype.forEach.call(bars, function (bar) {
      bar.setAttribute("data-lazy-rule", "comm:resize,round:100");
    });
  });

  //////
  // Теперь сама инициализация

  // init lazyload for Covers
  setTimeout(function () {
    window.lazyload_cover = new window.LazyLoad({
      elements_selector: ".t-cover__carrier",
      show_while_loading: false,
      data_src: "content-cover-bg",
      placeholder: "",
      threshold: 700,
    });
  }, 100);

  // init lazyload for Images, Background Images, Iframes
  setTimeout(function () {
    window.lazyload_img = new window.LazyLoad({
      elements_selector: ".t-img",
      threshold: 800,
    });
    window.lazyload_bgimg = new window.LazyLoad({
      elements_selector: ".t-bgimg",
      show_while_loading: false,
      placeholder: "",
      threshold: 800,
    });
    window.lazyload_iframe = new window.LazyLoad({
      elements_selector: ".t-iframe",
    });

    // в старых слайдерах на bootstrap (например t341) - чтобы картинка в слайдах подгружалась, надо подписаться на событие
    // нюанс в то что событие посылает jquery а не нативное, по-этому подписаться на ванила js на событие jquery нельзя
    // приходится делать подписку на jquery
    if (window.jQuery) {
      (function ($) {
        $(document).bind("slide.bs.carousel", function () {
          setTimeout(function () {
            t_lazyload_update();
          }, 500);
        });
      })(jQuery);
    }

    // это хак чтобы лечить странный баг с необновлением изображения браузером на мобильных
    // (видимо какой-то оптимизационный баг мобильных браузеров)
    // функции выполнялись - но на экране обновления не было
    // данный хак создает пустой div поверх всего, и тут же его убирает
    // видимо это заставляет браузер принудительно перерендерить отображение
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      if (
        document.body &&
        typeof document.body === "object" &&
        !!document.body.classList
      ) {
        if (document.querySelector(".t-mbfix")) return; // игнорировать при повторном запуске
        var elmbfix = document.createElement("div");
        elmbfix.classList.add("t-mbfix");
        document.body.appendChild(elmbfix); // запоминаем добавленный экзепляр
        setTimeout(function () {
          elmbfix.classList.add("t-mbfix_hide");
        }, 50);
        setTimeout(function () {
          if (elmbfix && elmbfix.parentNode) {
            elmbfix.parentNode.removeChild(elmbfix);
          }
        }, 1000);
      }
    }
  }, 500);

  // Подписываемся на событие ресайза и делаем тротл для уменьшения нагрузки в секунду
  window.addEventListener("resize", function () {
    clearTimeout(window.t_lazyload_resize_timerid);
    window.t_lazyload_resize_timerid = setTimeout(
      t_lazyload__onWindowResize,
      1000
    );
  });

  // Определяем скорость загрузки DOM-а
  setTimeout(function () {
    if (
      typeof performance === "object" &&
      typeof performance.timing === "object"
    ) {
      window.t_lazyload_domloaded =
        window.performance.timing.domContentLoadedEventEnd * 1 -
        window.performance.timing.navigationStart * 1;
    }
  }, 0);
}

/**
 * Функция используется для перерасчета у всех экземпляров лейзилоада
 * Обычно используется во внешних скриптах, которые создают контент динамически
 * Например в галереях, попапах и т.д.
 */
function t_lazyload_update() {
  if (typeof lazyload_cover !== "undefined") {
    window.lazyload_cover.update();
  }
  if (typeof lazyload_img !== "undefined") {
    window.lazyload_img.update();
  }
  if (typeof lazyload_bgimg !== "undefined") {
    window.lazyload_bgimg.update();
  }
  if (typeof lazyload_iframe !== "undefined") {
    window.lazyload_iframe.update();
  }
}

/**
 * Функция которая вешается на событие ресайза окна
 * пробегает по всем картинкам и меняет размеры модификаторов в URL
 */
function t_lazyload__onWindowResize() {
  //console.log('lz onwinres');

  // При ресайзе окна - вызываем апдейт для того чтобы лейзилоад подхватил картинки, которые были спрятаны изначально
  // на определенных разрешениях
  t_lazyload_update();

  // Если мы используем адаптацию, то картинки загружаются под размер контейнеров
  // В случае ресайза окна - картинки могут быть размылены (например переворот телефона из портрета в лендскейп)
  // В таком случае вызываем функцию - которая будет обновлять размеры изображений и перезагружать их
  if (window.lazy_imgoptimoff !== "yes") {
    var els = document.querySelectorAll(".t-cover__carrier, .t-bgimg, .t-img");
    Array.prototype.forEach.call(els, function (elem) {
      window.t_lazyload_updateResize_elem(elem);
    });
  }
}

/**
 * Функция при ресайзе окна обновляет урл картинок, заменяя размеры на актуальные:
 * - функция вызывается при ресайзе окна, а также есть вызов из tilda-cover-1.0.js
 * - в функцию передается ссылка на дом элемент
 * - берется урл картинки, находится модификатор resize с параметрами и
 * - размеры заменяются на актуальные.
 */
window.t_lazyload_updateResize_elem = function (elem) {
  //console.log('update resize elem');
  if (window.jQuery && elem instanceof jQuery) {
    if (elem.length == 0) {
      return;
    }
    elem = elem.get(0);
  }

  if (typeof elem == "undefined" || elem === null) {
    return;
  }

  // TODO:
  // Доработать кейс, когда событие ресайза произошло когда картинка еще грузится.
  // В случае с обложками - для загрузки используется фейковая картинка (в обложках)
  // собственно в background image будет пусто.
  // Для решения - Надо использовать свойство elem.lazy_loading_src
  // или сделать сброс фейковых ресурсов кторые в процессе и старт их заново

  var tagName = elem.tagName;

  if (tagName == "IMG") {
    var str = elem.getAttribute("src");
    var prefix = "-/resize/";
  } else if (typeof getComputedStyle !== "undefined") {
    var elemStyles = getComputedStyle(elem);

    var str = elemStyles.backgroundImage
      .replace("url(", "")
      .replace(")", "")
      .replace(/"/gi, "");

    if (elemStyles.backgroundSize === "contain") {
      var prefix = "-/contain/";
    } else {
      var prefix = "-/cover/";
    }
  } else {
    var prefix = "-/cover/";
  }

  if (
    typeof str == "undefined" ||
    str === null ||
    str.indexOf(prefix) === -1 ||
    str.indexOf(".svg") > 0 ||
    str.indexOf(".gif") > 0 ||
    str.indexOf(".ico") > 0 ||
    str.indexOf(t_lazyload__getThumbDomainName()) === -1 ||
    (str.indexOf("-/empty/") > 0 && str.indexOf("-/resizeb/") > 0)
  ) {
    return;
  }

  // модифицируем url заменяя размеры на новые
  // но только если размеры изменились (увеличились) больше чем на 100px
  var pos = str.indexOf(prefix) + prefix.length;
  var pos2 = str.indexOf("/", pos);
  if (pos > 0 && pos2 > 0) {
    var modWH = str.slice(pos, pos2).split("x");
    var width = elem.clientWidth;
    var height = elem.clientHeight;
    if (width > 0 && height > 0) {
      if (modWH[0] > 0 || modWH[1] > 0) {
        if (
          (modWH[0] > 0 && width > modWH[0]) ||
          (modWH[1] > 0 && height > modWH[1])
        ) {
          if (
            (modWH[0] > 0 && width - modWH[0] > 100) ||
            (modWH[1] > 0 && height - modWH[1] > 100)
          ) {
            var newstr =
              str.slice(0, pos) +
              (modWH[0] > 0 ? width : "") +
              "x" +
              (modWH[1] > 0 ? height : "") +
              "" +
              str.substring(pos2);
            if (tagName == "IMG") {
              elem.setAttribute("src", newstr);
            } else {
              elem.style.backgroundImage = "url('" + newstr + "')";
            }
          }
        }
      }
    }
  }
};

/**
 * Определяет поддерживает ли браузер WEBP формат
 * флаг записывается в глобальную переменную
 */
function t_lazyload__detectwebp() {
  var WebP = new Image();
  WebP.onload = WebP.onerror = function () {
    if (WebP.height != 2) {
      //console.log('lazyload: no webp support');
    } else {
      window.lazy_webp = "y";
    }
  };
  WebP.src =
    "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
}

/**
 * Рассчитывает время загрузки изображения и добавляет его в массив `t_loadImgStats`,
 * если изображение загружено с определённых доменов. Для отправки данных используется `navigator.sendBeacon`,
 * если этот метод доступен.
 *
 * @param {HTMLImageElement} img - Элемент изображения, для которого нужно собрать статистику.
 * @param {number} startTime - Время начала загрузки изображения в миллисекундах.
 */
function t_lazyLoad__appendImgStatToArr(img, startTime) {
  if (typeof navigator.sendBeacon === "undefined") return;
  var now = new Date().getTime();
  var imgSrc = img.getAttribute("src");
  if (!imgSrc) return;
  var imgLoadingTime = { time: now - startTime };
  if (imgSrc.indexOf("https://" + t_lazyload__getThumbDomainName()) === 0)
    imgLoadingTime.th = "y";
  if (imgSrc.indexOf("https://static.tildacdn") === 0) imgLoadingTime.st = "y";
  if (imgLoadingTime.th || imgLoadingTime.st)
    window.t_loadImgStats.push(imgLoadingTime);
}

/**
 * Проверяем на доступность домен, загружая однопиксельную картинку
 * Если через 5 секунд загрузка не состоялась - считаем что ресурс не доступен
 * Записываем ошибку во флаг
 * А также убираем статус loading у всех картинок которые сейчас в процессе загрузки
 * Вызываем метод update который запустит их загрузку с нова (учтет флаг доступности и будет грузить с резерва)
 *
 *  @param {string} type - Тип домена для проверки, например, 'static' или 'thumb'.
 */
// eslint-disable-next-line no-unused-vars
function t_lazyload__ping(type) {
  var domain = "https://" + type + ".tildacdn.com";

  // не будем пинговать статик если мы загрузили этот скрипт со статика
  if (type == "static") {
    var cs = document.currentScript;
    if (
      typeof cs === "object" &&
      typeof cs.src === "string" &&
      cs.src.indexOf(domain) === 0
    ) {
      return;
    }
    // проверим, может это экспортированный проект или с .info
    // тогда пинговать не будем
    if (document.head.querySelector('script[src^="' + domain + '"]') === null)
      return;
  }

  var img = new Image();
  img.src = domain + "/pixel.png";
  img.onload = function () {
    window["lazy_ok_" + type] = "y";
  };

  setTimeout(function () {
    if (window["lazy_ok_" + type] !== "y") {
      window["lazy_err_" + type] = "y";
      // eslint-disable-next-line no-console
      console.log(type + " ping error");

      //reload load in progress images
      var els = document.querySelectorAll(".loading");
      Array.prototype.forEach.call(els, function (el) {
        var src = "";
        src = el.lazy_loading_src;
        if (typeof str == "string" && src.indexOf(domain) === 0) {
          el.classList.remove("loading");
          el.wasProcessed = false;
        }
      });
      t_lazyload_update();
    }
  }, 10000);
}

/**
 * @returns {string} Имя домена для миниатюр изображений.
 */
function t_lazyload__getThumbDomainName() {
  return "optim.tildacdn";
}
