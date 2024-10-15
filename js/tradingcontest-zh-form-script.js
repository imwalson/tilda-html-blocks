const countDownMaps = {
  step1_entry: {
    endDate: timeMaps["step1_entry"][1].toDate().getTime(),
    title: "距离比赛开始还剩",
  },
  step1_match: {
    endDate: timeMaps["step1_match"][1].toDate().getTime(),
    title: "距第一赛结束还剩",
  },
  step2_entry: {
    endDate: timeMaps["step2_entry"][1].toDate().getTime(),
    title: "距第二赛开始还剩",
  },
  step2_match: {
    endDate: timeMaps["step2_match"][1].toDate().getTime(),
    title: "距第二赛结束还剩",
  },
  step3_entry: {
    endDate: timeMaps["step3_entry"][1].toDate().getTime(),
    title: "距第三赛开始还剩",
  },
  step3_match: {
    endDate: timeMaps["step3_match"][1].toDate().getTime(),
    title: "距第三赛结束还剩",
  },
};

function formatTime(time) {
  const d = Math.floor(time / (1000 * 60 * 60 * 24));
  const days = d < 10 ? `0${d}` : d;
  const h = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const hours = h < 10 ? `0${h}` : h;
  const m = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
  const minutes = m < 10 ? `0${m}` : m;
  const s = Math.floor((time % (1000 * 60)) / 1000);
  const seconds = s < 10 ? `0${s}` : s;
  return { days, hours, minutes, seconds };
}

document.addEventListener("DOMContentLoaded", () => {
  let timer = null;
  let remainingTime = 0;
  let endDate = 0;
  let title = "";
  let formStatus = {
    visable: true,
    title: "第一赛段报名",
    notice: "",
  };

  const $days = document.querySelector('[data-elem-id="1728884842896"] strong');
  const $hours = document.querySelector(
    '[data-elem-id="1728885018996"] strong'
  );
  const $mins = document.querySelector('[data-elem-id="1728885028471"] strong');
  const $seconds = document.querySelector(
    '[data-elem-id="1728885058279"] strong'
  );
  const $formTitle = document.querySelector('[field="tn_text_1728954378840"]');
  const $formContainer = document.querySelector(
    '[data-elem-id="1728897505950"] .tn-atom__form'
  );
  const $blockTitle = document.querySelector(
    '[data-elem-id="1709103320221"] strong'
  );

  function updateTime() {
    const step = getCurrentStep();
    if (step !== "ended") {
      endDate = countDownMaps?.[step]?.endDate;
      title = countDownMaps?.[step]?.title;
      const nowTime = new Date().getTime();
      const remaining = endDate - nowTime;
      remainingTime = remaining > 0 ? remaining : 0;
    }

    if (step === "step1_entry") {
      formStatus.visable = true;
      formStatus.title = "第一赛段报名";
    } else if (step === "step1_match") {
      formStatus.visable = false;
      formStatus.title = "第一赛段进行中";
      formStatus.notice = "报名暂未开放";
    } else if (step === "step2_entry") {
      formStatus.visable = true;
      formStatus.title = "第二赛段报名";
    } else if (step === "step2_match") {
      formStatus.visable = false;
      formStatus.title = "第二赛段进行中";
      formStatus.notice = "报名暂未开放";
    } else if (step === "step3_entry") {
      formStatus.visable = true;
      formStatus.title = "第三赛段报名";
    } else if (step === "step3_match") {
      formStatus.visable = false;
      formStatus.title = "第三赛段进行中";
      formStatus.notice = "报名暂未开放";
    } else {
      formStatus.visable = false;
      formStatus.title = "活动结束";
      formStatus.notice = "报名暂未开放";
    }

    // update dom
    if ($days) {
      $days.innerText = `${formatTime(remainingTime).days}`;
    }
    if ($hours) {
      $hours.innerText = `${formatTime(remainingTime).hours}`;
    }
    if ($mins) {
      $mins.innerText = `${formatTime(remainingTime).minutes}`;
    }
    if ($seconds) {
      $seconds.innerText = `${formatTime(remainingTime).seconds}`;
    }
    if ($formTitle) {
      $formTitle.innerText = formStatus.title;
    }
    if ($blockTitle) {
      $blockTitle.innerText = title;
    }
    if ($formContainer) {
      if (!formStatus.visable) {
        $formContainer.style.display = "none";
      } else {
        $formContainer.style.display = "block";
      }
    }
  }

  updateTime();
  timer = setInterval(() => {
    updateTime();
  }, 1000);
});
