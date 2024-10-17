(function () {
  const $showBtn = document.querySelector(
    '[data-elem-id="1729071641047"] .tn-atom'
  );
  const $termsContent = document.querySelector("#rec812607292");

  $termsContent.style.display = "none";
  $showBtn.style.cursor = "pointer";

  $showBtn.addEventListener(
    "click",
    function () {
      $termsContent.style.display = "block";
    },
    false
  );
})();
