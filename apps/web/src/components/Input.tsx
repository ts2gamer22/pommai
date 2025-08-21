import React, { useMemo } from "react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  icon?: string;
  onIconClick?: () => void;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  style?: React.CSSProperties & {
    "--input-custom-bg"?: string;
    "--input-custom-text"?: string;
    "--input-custom-border"?: string;
  };
}

export const Input = ({
  className = "",
  icon,
  onIconClick,
  bg,
  textColor,
  borderColor,
  style,
  ...props
}: InputProps) => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    ...style,
    "--input-custom-bg": bg,
    "--input-custom-text": textColor,
    "--input-custom-border": borderColor,
    borderImageSource: svgString,
  };

  return (
    <div
      className={`pixel-input-container relative mx-1 my-2 ${className}`}
      style={customStyle}
    >
      <input
        className="pixel-input w-full pr-7"
        {...props}
      />
      {icon && (
        <button
          className="pixel-input-icon-button absolute right-0 top-0"
          onClick={onIconClick}
          type="button"
        >
          <img src={icon} alt="Input icon" className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
