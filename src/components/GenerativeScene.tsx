import { useEffect, useMemo, useRef, useState } from "react";
import type { PollenData } from "../hooks/usePollenData";
import * as THREE from "three";
import { motion } from "framer-motion";

import "../styles.scss";
import PlayPauseButton from "./PlayPauseButton";
import { TypingLog, type TypingLine } from "./TypingLog";
import pollenAudio from "../assets/pollen.mp3";

type Coordinates = {
    latitude: number;
    longitude: number;
};

type Props = {
    location: Coordinates | null;
    pollen: PollenData;
    onRequestLocation: () => void;
};



const GenerativeScene = ({
    location,
    pollen,
    onRequestLocation,
}: Props) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const animationFrameRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioLoaded, setAudioLoaded] = useState(false);

    useEffect(() => {
        const audio = new Audio(pollenAudio);

        audio.preload = "auto";
        audio.loop = true;

        const handleCanPlayThrough = () => {
            setAudioLoaded(true);
        };

        audio.addEventListener("canplaythrough", handleCanPlayThrough);

        audio.load();

        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.removeEventListener("canplaythrough", handleCanPlayThrough);
            audioRef.current = null;
        };
    }, []);

    const togglePlayback = async () => {
        const audio = audioRef.current;

        if (!audioLoaded || !audio) return;

        if (isAudioPlaying) {
            audio.pause();
            setIsAudioPlaying(false);
        } else {
            try {
                await audio.play();
                setIsAudioPlaying(true);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const [seed] = useState(() =>
        Math.floor(Math.random() * 999999)
    );

    const visitSignature = useMemo(() => {
        const fragments = [
            "lattice",
            "ghost",
            "signal",
            "orbit",
            "field",
            "veil",
            "axis",
            "echo",
        ];

        return `pollen-${fragments[seed % fragments.length]}-${String(
            seed
        ).padStart(6, "0")}`;
    }, [seed]);

    const totalPollenScore = pollen.pollenTypes.reduce(
        (sum, type) => sum + type.value,
        0
    );

    const normalizedDensityScore = pollen.pollenTypes.length
        ? totalPollenScore / pollen.pollenTypes.length
        : 0;

    const typingLines = useMemo(() => {
        if (!location || pollen.pollenTypes.length === 0) {
            return [] as TypingLine[];
        }

        return [
            {
                text: `Longitude: ${location.longitude.toFixed(6)}`,
                score: undefined,
            },
            {
                text: `Latitude: ${location.latitude.toFixed(6)}`,
                score: undefined,
            },
            ...pollen.pollenTypes.flatMap((type) => {
                const lines: TypingLine[] = [
                    {
                        text: `[${type.displayName}] pollen: ${type.value}`,
                        score: type.value,
                    },
                ];
                if (type.advice) {
                    lines.push({
                        text: `${type.advice}`,
                        score: undefined,
                    });
                }
                return lines;
            }),
            {
                text: `Pollen density calculated: ${totalPollenScore}`,
                score: normalizedDensityScore,
            },
        ];
    }, [location, normalizedDensityScore, totalPollenScore, pollen.pollenTypes]);

    useEffect(() => {
        const startAudio = async () => {
            const audio = audioRef.current;

            if (!audio || !audioLoaded) {
                return;
            }

            try {
                await audio.play();
                setIsAudioPlaying(true);
            } catch (err) {
                console.error(err);
            }

            window.removeEventListener(
                "pointerdown",
                startAudio
            );
        };

        window.addEventListener(
            "pointerdown",
            startAudio,
            { once: true }
        );

        return () => {
            window.removeEventListener(
                "pointerdown",
                startAudio
            );
        };
    }, [audioLoaded]);

    useEffect(() => {
        const mount = mountRef.current;

        if (!mount) return;

        const scene = new THREE.Scene();

        scene.fog = new THREE.FogExp2(0x000000, 0.03);

        const camera = new THREE.PerspectiveCamera(
            55,
            mount.clientWidth / mount.clientHeight,
            0.1,
            100
        );

        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });

        renderer.setSize(
            mount.clientWidth,
            mount.clientHeight
        );

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        renderer.setClearColor(0x000000);

        mount.appendChild(renderer.domElement);

        const busyness = pollen.busyness;

        const nodeCount = Math.floor(45 + busyness * 180);
        const particleCount = Math.floor(400 + busyness * 2500);
        const rotationSpeed = 0.02 + busyness * 0.08;
        const maxDistance = 1.8 + busyness * 2.2;
        const lightIntensity = 3 + busyness * 7;

        const installation = new THREE.Group();

        scene.add(installation);

        const ambient = new THREE.AmbientLight(
            0xffffff,
            0.08
        );

        scene.add(ambient);

        const key = new THREE.PointLight(
            0xffffff,
            lightIntensity,
            50
        );

        scene.add(key);

        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 16, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
            })
        );

        scene.add(orb);

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
        });

        const geometry = new THREE.IcosahedronGeometry(
            2 + busyness * 2,
            2
        );

        const meshMaterial =
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                wireframe: true,
                transparent: true,
                opacity: 0.16,
                roughness: 0.2,
                metalness: 0.8,
            });

        const heroMesh = new THREE.Mesh(
            geometry,
            meshMaterial
        );

        installation.add(heroMesh);

        const points: THREE.Vector3[] = [];

        for (let i = 0; i < nodeCount; i++) {
            points.push(
                new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8
                )
            );
        }

        const linePositions: number[] = [];

        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                if (
                    points[i].distanceTo(points[j]) <
                    maxDistance
                ) {
                    linePositions.push(
                        points[i].x,
                        points[i].y,
                        points[i].z,
                        points[j].x,
                        points[j].y,
                        points[j].z
                    );
                }
            }
        }

        const lineGeometry = new THREE.BufferGeometry();

        lineGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
                linePositions,
                3
            )
        );

        const lines = new THREE.LineSegments(
            lineGeometry,
            lineMaterial
        );

        installation.add(lines);

        const particleGeometry =
            new THREE.BufferGeometry();

        const particlePositions = new Float32Array(
            particleCount * 3
        );

        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] =
                (Math.random() - 0.5) * 20;

            particlePositions[i * 3 + 1] =
                (Math.random() - 0.5) * 20;

            particlePositions[i * 3 + 2] =
                (Math.random() - 0.5) * 20;
        }

        particleGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                particlePositions,
                3
            )
        );

        const particles = new THREE.Points(
            particleGeometry,
            new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.015,
                transparent: true,
                opacity: 0.3,
            })
        );

        scene.add(particles);

        let mouseX = 0;
        let mouseY = 0;

        const handlePointerMove = (
            event: PointerEvent
        ) => {
            mouseX =
                (event.clientX / window.innerWidth - 0.5) *
                2;

            mouseY =
                (event.clientY / window.innerHeight - 0.5) *
                2;
        };

        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        const clock = new THREE.Clock();

        const animate = () => {
            const elapsed = clock.getElapsedTime();

            installation.rotation.y =
                elapsed * rotationSpeed +
                mouseX * 0.2;

            installation.rotation.x =
                mouseY * 0.12;

            heroMesh.rotation.x += 0.002;
            heroMesh.rotation.y += 0.003;

            particles.rotation.y =
                elapsed * 0.01;

            key.position.x =
                Math.sin(elapsed * 0.5) * 5;

            key.position.y =
                Math.cos(elapsed * 0.3) * 5;

            key.position.z =
                5 + Math.sin(elapsed * 0.2) * 2;

            orb.position.copy(key.position);

            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);

            animationFrameRef.current =
                requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            camera.aspect =
                mount.clientWidth /
                mount.clientHeight;

            camera.updateProjectionMatrix();

            renderer.setSize(
                mount.clientWidth,
                mount.clientHeight
            );
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            window.removeEventListener(
                "resize",
                handleResize
            );

            window.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            mount.removeChild(renderer.domElement);

            renderer.dispose();
        };
    }, [location, pollen]);

    return (
        <main className="landing-page">
            <div
                ref={mountRef}
                className="scene"
            />

            <div className="vignette" />

            <section className="content-shell">
                <nav className="topbar">
                    <div className="col">
                        <div className="row">
                            <span className="name">Chrissy Semens</span>
                            <span className={'play-pause'}>
                                <PlayPauseButton
                                    isPlaying={isAudioPlaying}
                                    onToggle={togglePlayback}
                                    disabled={!audioLoaded} /></span>
                        </div>
                        <div className="row">
                            <span style={{ fontSize: '0.5rem' }}>
                                {isAudioPlaying ? 
                                <TypingLog 
                                    uppercase={false} 
                                    speed={350} 
                                    fontSize={8} 
                                    lines={[{ text: 'Now playing...' }, { text: "pollen.mp3" }]} /> : null}
                            </span>
                        </div>
                    </div>
                    <span>{visitSignature}</span>
                </nav>

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 1.6,
                    }}
                    className="hero"
                >
                    <p>Code / music / hayfever</p>

                    <h1>
                        Web developer, music hobbyist.
                    </h1>
                    <h3>
                        <a className="github" href="https://github.com/chrissysemens" target="_blank" rel="noopener noreferrer">Github</a>&nbsp; / &nbsp;
                        <a className="linkedin" href="https://www.linkedin.com/in/christophersemens/" target="_blank" rel="noopener noreferrer">Linkedin</a> &nbsp; / &nbsp;
                        <a className="spotify" href="https://open.spotify.com/artist/2mxDo1LJaooXPLZk8th3xB?si=LEnKaEkFQvCxTF09CJMaSQ" target="_blank" rel="noopener noreferrer">Spotify</a> &nbsp; / &nbsp;
                        <a className="soundcloud" href="https://soundcloud.com/chrissysemens" target="_blank" rel="noopener noreferrer">Soundcloud</a>
                    </h3>

                    <div className="location-status">
                        {!location ? (
                            <button
                                className="allow-location"
                                type="button"
                                onClick={onRequestLocation}
                            >
                                Allow location
                            </button>
                        ) : (
                            <TypingLog lines={typingLines} />
                        )}
                    </div>
                </motion.div>

                <footer className="footer">
                    <p>
                        Pollen geometry density changes to
                        live pollen conditions in your current location.
                    </p>
                </footer>
            </section>
        </main>
    );
}

export default GenerativeScene;