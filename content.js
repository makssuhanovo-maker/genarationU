(function () {
  const page = document.body.dataset.contentPage;

  if (!page) return;

  const resolvePath = (source, path) => {
    return path.split(".").reduce((value, key) => {
      if (value == null) return undefined;
      return value[key];
    }, source);
  };

  const setLinkValue = (element, type, value) => {
    if (!value) return;

    if (type === "tel") {
      const normalized = value.replace(/[^\d+]/g, "");
      element.setAttribute("href", `tel:${normalized.startsWith("+") ? normalized : `+38${normalized}`}`);
      return;
    }

    if (type === "mailto") {
      element.setAttribute("href", `mailto:${value}`);
    }
  };

  const applyContent = (content) => {
    document.querySelectorAll("[data-content]").forEach((element) => {
      const value = resolvePath(content, element.dataset.content);

      if (value == null) return;

      element.textContent = String(value);
    });

    document.querySelectorAll("[data-content-attr]").forEach((element) => {
      const mappings = element.dataset.contentAttr.split(",");

      mappings.forEach((mapping) => {
        const [attribute, path] = mapping.split(":").map((part) => part.trim());
        const value = resolvePath(content, path);

        if (attribute && value != null) {
          element.setAttribute(attribute, String(value));
        }
      });
    });

    document.querySelectorAll("[data-content-link]").forEach((element) => {
      const value = resolvePath(content, element.dataset.content);

      if (value == null) return;

      setLinkValue(element, element.dataset.contentLink, String(value));
    });
  };

  fetch(`./content/${page}.json`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load content for ${page}`);
      }

      return response.json();
    })
    .then(applyContent)
    .catch((error) => {
      console.error(error);
    });
})();
