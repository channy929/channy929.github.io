(() => {
  const area = document.querySelector(".google-login-area");
  if (!area) return;

  const button = area.querySelector(".google-signin-button");
  const error = area.querySelector(".google-login-error");
  const retry = area.querySelector(".google-login-retry");
  const clientId = area.dataset.googleClientId || "";
  let renderedWidth = 0;
  let loadTimer;

  const showError = (message) => {
    window.clearTimeout(loadTimer);
    const messageElement = error?.querySelector("span");
    if (message && messageElement) messageElement.textContent = message;
    if (error) error.hidden = false;
    if (button) button.hidden = true;
  };

  window.handleGoogleCredential = (response) => {
    const credential = response && typeof response.credential === "string" ? response.credential : "";
    const state = area.dataset.googleState || "";
    if (!credential || !state) {
      showError("Google 로그인 정보를 전달하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    const form = document.createElement("form");
    form.method = "post";
    form.action = "https://nurse-scheduler-322037963398.asia-northeast3.run.app/auth/google";
    form.hidden = true;
    for (const [name, value] of [["credential", credential], ["google_state", state]]) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.append(input);
    }
    document.body.append(form);
    form.submit();
  };

  const renderButton = () => {
    if (!button || !window.google?.accounts?.id) return;
    const availableWidth = Math.floor(button.getBoundingClientRect().width);
    if (!availableWidth) return;
    // Leave a small safety gap for browser sub-pixel rounding around Google's
    // cross-origin iframe. The iframe content itself cannot be resized by CSS.
    const width = Math.max(200, Math.min(316, availableWidth - 4));
    if (renderedWidth === width) return;

    button.hidden = false;
    button.replaceChildren();
    window.google.accounts.id.renderButton(button, {
      type: "standard",
      shape: "rectangular",
      theme: "outline",
      text: "continue_with",
      // medium/small buttons are not replaced by Google's wider personalized
      // account button, so the iframe remains within the measured container.
      size: "medium",
      logo_alignment: "left",
      locale: "ko",
      width,
    });
    renderedWidth = width;
    if (error) error.hidden = true;
  };

  const initializeGoogle = () => {
    window.clearTimeout(loadTimer);
    if (!clientId || !window.google?.accounts?.id) {
      showError("Google 로그인을 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: window.handleGoogleCredential,
      context: "signin",
      ux_mode: "popup",
      auto_select: false,
    });
    renderButton();
  };

  const loadGoogleScript = () => {
    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }
    document.getElementById("google-gsi-client")?.remove();
    if (error) error.hidden = true;
    if (button) {
      button.hidden = false;
      button.innerHTML = '<span class="google-login-loading">Google 로그인을 불러오는 중…</span>';
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client?hl=ko";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => showError("Google 로그인을 불러오지 못했습니다. 브라우저의 콘텐츠 차단 설정을 확인해 주세요.");
    document.head.append(script);
    loadTimer = window.setTimeout(
      () => showError("Google 로그인 응답이 없습니다. 네트워크 또는 콘텐츠 차단 설정을 확인해 주세요."),
      8000,
    );
  };

  retry?.addEventListener("click", loadGoogleScript);
  if ("ResizeObserver" in window) {
    let resizeTimer;
    new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(renderButton, 120);
    }).observe(area);
  } else {
    window.addEventListener("resize", renderButton);
  }

  loadGoogleScript();
})();
