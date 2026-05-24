import { FaPlay, FaPause } from "react-icons/fa";

type Props = {
  isPlaying: boolean;
  onToggle: () => void;
  label?: string;
  disabled: boolean;
};

const PlayPauseButton = ({
  isPlaying,
  onToggle,
  disabled,
  label = "Toggle playback",
}: Props) => {
  return (
    <div
      className={`play-pause-button ${disabled ? "is-disabled" : ""}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={isPlaying ? "Pause audio" : "Play audio"}
      title={disabled ? "Loading audio..." : label}
      onClick={disabled ? undefined : onToggle}
      onKeyDown={(event) => {
        if (disabled) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <span className="play-pause-glyph" aria-hidden="true">
        {disabled ? "…" : isPlaying ? <FaPause size={12} color={"white"} /> : <FaPlay size={12} color={'white'} />}
      </span>
    </div>
  );
};

export default PlayPauseButton;