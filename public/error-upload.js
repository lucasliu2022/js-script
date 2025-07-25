(function () {
  const REPORT_URL = "https://js-script-nine.vercel.app/api/logs";

  var reportQueue = [];
  var isReporting = false;
  var BATCH_REPORT_INTERVAL = 5000;
  var MAX_QUEUE_SIZE = 10;

  function formatError(error) {
    var message = "";
    var stack = "";
    var filename = "";
    var lineno = 0;
    var colno = 0;
    var type = "JavaScriptError";

    if (typeof error === "string") {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      type = error.name || type;
    } else if (error && typeof error === "object") {
      message = error.message || String(error);
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

    var userAgent = navigator.userAgent;
    var deviceInfo = {
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
      timestamp: new Date().getTime(),
      device: deviceInfo,
    };
  }

  function sendReportByXHR(errorData, callback) {
    if (!REPORT_URL) {
      console.warn(
        "Please configure REPORT_URL; the reporting interface is currently not set."
      );

      console.log("Error data to be reported:", errorData);
      if (callback) callback(false);
      return;
    }

    var xhr = new (window.XMLHttpRequest || window.ActiveXObject)(
      "Microsoft.XMLHTTP"
    );

    if (!xhr) {
      console.error("XMLHttpRequest is not available");
      if (callback) callback(false);
      return;
    }

    xhr.open("POST", REPORT_URL, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (callback) callback(true);
        } else {
          // Error reporting failed:
          console.error("Error reporting failed:", xhr.status, xhr.statusText);
          if (callback) callback(false);
        }
        isReporting = false;
        processReportQueue();
      }
    };

    xhr.onerror = function () {
      console.error("Report request failed (XHR.onerror):", xhr.statusText);
      if (callback) callback(false);
      isReporting = false;
      processReportQueue();
    };

    try {
      xhr.send(JSON.stringify(errorData));
    } catch (e) {
      console.error("An error occurred while sending the XHR request:", e);
      if (callback) callback(false);
      isReporting = false;
      processReportQueue();
    }
  }

  function processReportQueue() {
    if (reportQueue.length === 0 || isReporting) {
      return;
    }

    isReporting = true;
    var errorsToReport = reportQueue.splice(0, reportQueue.length);

    sendReportByXHR(errorsToReport, function (success) {
      if (!success) {
      }
    });
  }

  setInterval(processReportQueue, BATCH_REPORT_INTERVAL);

  function reportError(errorData) {
    reportQueue.push(errorData);

    if (reportQueue.length >= MAX_QUEUE_SIZE) {
      processReportQueue();
    }
  }

  window.onerror = function (msg, url, line, col, errorobj) {
    var errorData = formatError(errorobj || msg, url, line, col);
    errorData.source = "window.onerror";
    reportError(errorData);

    return false;
  };

  if (typeof window.Promise !== "undefined") {
    window.addEventListener("unhandledrejection", function (event) {
      var reason = event.reason;
      var errorData;

      if (reason instanceof Error) {
        errorData = formatError(reason);
      } else {
        errorData = formatError(String(reason));
      }

      errorData.source = "unhandledrejection";
      reportError(errorData);

      if (event.preventDefault) {
        event.preventDefault();
      }
    });
  } else {
  }

  console.log(
    "Error reporting script initialized (compatible with older versions)."
  );
})();
