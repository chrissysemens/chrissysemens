import { useEffect, useState } from "react";

export type TypingLine = {
    text: string;
    score?: number;
};

type TypingLogProps = {
    lines: TypingLine[];
    speed?: number;
    linePause?: number;
    fontSize?: number;
    uppercase?: boolean;
};

const getScoreClass = (score?: number) => {
    if (score === undefined) return "";
    if (score >= 4) return "high";
    if (score >= 2.5) return "mid";
    return "low";
};

export const TypingLog = ({
    lines,
    speed = 35,
    linePause = 1100,
    fontSize = 14,
    uppercase = true,
}: TypingLogProps) => {
    const [displayedLine, setDisplayedLine] = useState("");
    const [lineIndex, setLineIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        setDisplayedLine("");
        setLineIndex(0);
        setCharIndex(0);
    }, [lines]);

    useEffect(() => {
        const currentLine = lines[lineIndex];
        if (!currentLine) return;

        const isLineComplete = charIndex >= currentLine.text.length;

        const timeout = window.setTimeout(
            () => {
                if (isLineComplete) {
                    const nextIndex =
                        lineIndex + 1 < lines.length ? lineIndex + 1 : 0;

                    setDisplayedLine("");
                    setLineIndex(nextIndex);
                    setCharIndex(0);
                    return;
                }

                setDisplayedLine(currentLine.text.slice(0, charIndex + 1));
                setCharIndex((idx) => idx + 1);
            },
            isLineComplete ? linePause : speed
        );

        return () => window.clearTimeout(timeout);
    }, [charIndex, lineIndex, lines, speed, linePause]);

    const currentLine = lines[lineIndex];
    const scoreClass = getScoreClass(currentLine?.score);

    const renderLine = () => {
        if (!currentLine) return null;

        const parts = displayedLine.split(/(\d+\.\d+|\d+)/g);

        return parts.map((part, index) => {
            const isNumber = /^\d+\.\d+$|^\d+$/.test(part);

            if (isNumber && currentLine.score !== undefined) {
                return (
                    <span key={index} style={fontSize ? { fontSize: `${fontSize}px` } : {}} className={`typed-number ${scoreClass}`}>
                        {part}
                    </span>
                );
            }

            return <span key={index}>{uppercase ? part.toUpperCase() : part}</span>;
        });
    };

    return (
        <div className="typing-log">
            <div className="typing-log-line">
                {renderLine()}
                {currentLine && <span className="typing-cursor" />}
            </div>
        </div>
    );
};