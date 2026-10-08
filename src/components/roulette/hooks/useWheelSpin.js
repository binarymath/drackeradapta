import { useState, useEffect } from 'react';
import { gameAudio } from '../../../utils/gameAudio';

export const useWheelSpin = ({
    items = [],
    spinning = false,
    winner = null,
    onSpinComplete,
    audioConfig = {} // { scale, maxTicks, type, baseDelay, delayMultiplier, easingCurve, dur, gainVal }
}) => {
    const [rotation, setRotation] = useState(0);

    // Audio Effect
    useEffect(() => {
        if (spinning) {
            const cancelAudio = gameAudio.playTickSequence(audioConfig);
            return () => cancelAudio();
        }
    }, [spinning]); // we intentionally only depend on spinning to start it once

    // Physical Rotation
    useEffect(() => {
        if (spinning && winner && items.length > 0) {
            const winnerIdx = items.findIndex(i => String(i.id) === String(winner.id));
            if (winnerIdx === -1) {
                const timeout = setTimeout(() => {
                    if (onSpinComplete) onSpinComplete();
                }, 2000);
                return () => clearTimeout(timeout);
            }

            const numItems = items.length;
            const sliceAngle = 360 / numItems;

            const winnerCenterAngle = (winnerIdx * sliceAngle) + (sliceAngle / 2);
            const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.55);

            const extraSpins = 360 * 6; // At least 6 full spins
            const currentRotationMod = rotation % 360;
            const newRotation = rotation + extraSpins + (360 - winnerCenterAngle - currentRotationMod) + randomOffset;

            setRotation(newRotation);

            const timeout = setTimeout(() => {
                if (onSpinComplete) onSpinComplete();
            }, 5000); // 5 seconds is standard for all wheels

            return () => clearTimeout(timeout);
        }
    }, [spinning, winner]);

    return { rotation };
};
