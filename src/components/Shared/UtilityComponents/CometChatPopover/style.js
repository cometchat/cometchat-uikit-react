import { deg, positions, tipPositionMapping } from "./constants";

export const toolTipWrapperStyle = (props) => {
  const axis = tipPositionMapping[props.position];
  let x = props?.x ? props.x : "0";
  let y = props?.y ? props.y : "0";
  let width = parseInt(props.style.width);
  let height = parseInt(props.style.height);
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  let percent = 0;
  if (axis === "x") {
    percent = (100 * x) / windowWidth;
  } else {
    percent = (100 * y) / windowHeight;
  }

  let axisPosition = {};
  if (axis === "x") {
    axisPosition = {
      left: `${x - width * (percent / 100)}px`,
    };
  } else {
    axisPosition = {
      top: `${y - height * (percent / 100)}px`,
    };
  }

  let positionStyle = {};
  if (props.position === positions.top) {
    positionStyle = {
      top: `${y - parseInt(height) - 20}px`,
    };
  } else if (props.position === positions.bottom) {
    positionStyle = {
      top: `${y + 20}px`,
    };
  } else if (props.position === positions.left) {
    positionStyle = {
      left: `${x - parseInt(width) - 30}px`,
    };
  } else if (props.position === positions.right) {
    positionStyle = {
      left: `${x + 25}px`,
    };
  }

  let styles = {};

  if (props.x || props.y) {
    styles = {
      boxShadow: props.style.boxShadow,
      borderRadius: props.style.borderRadius,
      zIndex: 4,
      width: `${width}px`,
      height: `${height}px`,
      position: "fixed",
      background: `${
        props.style.background || props.theme?.palette?.getColor("accent900")
      }`,
      ...positionStyle,
      ...axisPosition,
    };
  } else {
    styles = {
      width: props.style.width,
      height: props.style.height,
      border: props.style.border,
      background: props.style.background,
      borderRadius: props.style.borderRadius,
      boxShadow: props.style.boxShadow,
      top: props.style.top,
      left: props.style.left,
      transform: props.style.transform,
      position: props.style.position,
      zIndex: "4",
    };
  }
  return styles;
};

export const toolTipContentStyle = (props) => {
  return {
    zIndex: 10,
    position: "absolute",
    top: 0,
    left: 0,
    width: props.style.width,
    height: props.style.height,
  };
};

export const toolTipStyles = (props) => {
  const axis = tipPositionMapping[props.position];
  let x = props?.x ? props.x : "0";
  let y = props?.y ? props.y : "0";
  let width = parseInt(props.style.width);
  let height = parseInt(props.style.height);
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  let percent = 0;
  if (axis === "x") {
    percent = (100 * x) / windowWidth;
  } else {
    percent = (100 * y) / windowHeight;
  }

  let positionStyle = {};
  if (axis === "x") {
    if (props.position === positions.top) {
      positionStyle = {
        left: `${width * (percent / 100) - 10}px`,
        top: height,
      };
    } else if (props.position === positions.bottom) {
      positionStyle = {
        left: `${width * (percent / 100) - 10}px`,
        top: -10,
      };
    }
  } else {
    if (props.position === positions.left) {
      positionStyle = {
        left: `calc(${width} - 5px)`,
        top: `${height * (percent / 100) - 10}px`,
      };
    } else if (props.position === positions.right) {
      positionStyle = {
        left: -15,
        top: `${height * (percent / 100) - 10}px`,
      };
    }
  }

  return {
    zIndex: 11,
    width: "0",
    height: "0",
    borderLeft: "10px solid transparent",
    borderRight: "10px solid transparent",
    borderBottom: `10px solid ${props.style.background}`,
    position: "relative",
    display: "none",
    ...positionStyle,
    transform: `rotate(${deg[props.position]}deg)`,
  };
};
