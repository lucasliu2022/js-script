(function () {
  const REPORT_URL = "https://js-script-nine.vercel.app/api/logs";

  function formatError(error) {
    let message = "";
    let stack = "";
    let filename = "";
    let lineno = 0;
    let colno = 0;
    let type = "JavaScriptError";

    if (typeof error === "string") {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      type = error.name || type;
    } else if (error && typeof error === "object") {
      message = error.message || JSON.stringify(error);
      stack = error.stack || "No stack available";
      type = error.name || type;
    }

    if (arguments.length > 1 && typeof arguments[1] === "string") {
      filename = arguments[1];
      lineno = arguments[2];
      colno = arguments[3];

      if (arguments[4] instanceof Error) {
        stack = arguments[4].stack;
        type = arguments[4].name || type;
      }
    }

    const userAgent = navigator.userAgent;
    const deviceInfo = {
      userAgent: userAgent,
      platform: navigator.platform,
    };

    return {
      type: type,
      message: message,
      stack: stack,
      filename: filename,
      lineno: lineno,
      colno: colno,
      url: window.location.href,
      timestamp: Date.now(),
      device: deviceInfo,
    };
  }

  function reportError(errorData) {
    if (!REPORT_URL || REPORT_URL === "YOUR_REPORT_API_ENDPOINT") {
      console.warn("请配置 REPORT_URL，当前未设置上报接口。");
      console.log("待上报错误数据:", errorData);
      return;
    }

    fetch(REPORT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) {
          console.error("错误上报失败:", response.status, response.statusText);
        }
      })
      .catch((err) => {
        console.error("上报请求发送失败:", err);
      });
  }

  window.onerror = function (msg, url, line, col, errorobj) {
    const errorData = formatError(errorobj || msg, url, line, col);
    errorData.source = "window.onerror";
    reportError(errorData);

    return false;
  };

  window.addEventListener("unhandledrejection", function (event) {
    const errorData = formatError(event.reason);
    errorData.source = "unhandledrejection";
    reportError(errorData);

    event.preventDefault();
  });

  console.log("错误上报脚本已初始化。");
})();
