import { useEffect } from "react";

const applyBlackWithMessage = () => {
  document.documentElement.classList.add("screenshot-detected");
  const existing = document.getElementById("refresh-message");
  if (existing) return;
  const messageContainer = document.createElement("div");
  messageContainer.id = "refresh-message";
  messageContainer.style.position = "fixed";
  messageContainer.style.top = "50%";
  messageContainer.style.left = "50%";
  messageContainer.style.transform = "translate(-50%, -50%)";
  messageContainer.style.backgroundColor = "white";
  messageContainer.style.color = "black";
  messageContainer.style.padding = "20px";
  messageContainer.style.borderRadius = "8px";
  messageContainer.style.zIndex = "10000";
  messageContainer.style.textAlign = "center";
  messageContainer.innerHTML = `
    <p>
      This website might have sensitive information. As a security measure, taking screenshots or performing any action above the website screen is not allowed. This is to protect both you and us from potential security threats. Please refresh the page to continue.
    </p>
    <button style="background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 14px 20px; margin: 8px 0; border: none; cursor: pointer; border-radius: 9px; font-family: Inter, system-ui, sans-serif; font-weight: 600; font-size: 0.875rem; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);" onclick="window.location.reload()">Refresh</button>`;
  document.body.appendChild(messageContainer);
};

const usePersistScreenshotBlackout = () => {
  useEffect(() => {
    let isScreenshotDetected = false;

    const handleScreenShotDetection = () => {
      if (!isScreenshotDetected) {
        isScreenshotDetected = true;
        applyBlackWithMessage();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleScreenShotDetection();
      }
    };

    window.addEventListener("blur", handleScreenShotDetection);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleScreenShotDetection);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.documentElement.classList.remove("screenshot-detected");
      const msg = document.getElementById("refresh-message");
      if (msg) msg.remove();
    };
  }, []);
};

export default usePersistScreenshotBlackout;