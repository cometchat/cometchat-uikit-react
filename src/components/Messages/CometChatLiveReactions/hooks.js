import React from "react";

const Hooks = (props, setItemsHandler, parentElement, timer, items) => {
  React.useEffect(() => {
    requestAnimation();
    setItemsHandler();
    return () => {
      timer.current = null;
    };
  }, [parentElement]);

  const requestAnimation = () => {
    timer.current = setTimeout(animate, 1000 / 60);
  };

  const animate = () => {
    if (!parentElement) {
      return false;
    }

    const height = parentElement?.offsetHeight;
    const time = +new Date();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const transformString =
        "translate3d(" + item.x(time) + "px, " + item.y + "px, 0px)";
      item.element.style.transform = transformString;
      item.element.style.visibility = "visible";
      if (item.y <= height) {
        item.element.classList.add("fade");
      }
      item.y += item.ySpeed;
    }
    requestAnimation();
  };
};

export { Hooks };
