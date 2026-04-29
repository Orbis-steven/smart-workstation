import { useEffect, useRef, useState } from 'react';

const DEFAULT_CAMERA_CONSTRAINTS = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 960 },
    aspectRatio: { ideal: 4 / 3 },
  },
  audio: false,
};

function stopMediaStream(stream) {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => track.stop());
}

function mapCameraErrorCode(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'permission_denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'not_found';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'in_use';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'constraint_failed';
    default:
      return 'generic_error';
  }
}

async function requestLocalStream() {
  try {
    return await navigator.mediaDevices.getUserMedia(DEFAULT_CAMERA_CONSTRAINTS);
  } catch (error) {
    if (error?.name === 'OverconstrainedError') {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    throw error;
  }
}

export function useLocalCamera({ enabled = true } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState(enabled ? 'requesting' : 'idle');
  const [errorCode, setErrorCode] = useState('');

  const detachVideoSource = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stopCamera = () => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    detachVideoSource();
  };

  const bindStreamToVideo = async (stream) => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }

    try {
      await videoElement.play();
    } catch {
      // Ignore autoplay errors; the stream remains attached and the browser may start on user interaction.
    }
  };

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      setStatus('idle');
      setErrorCode('');
      return undefined;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      stopCamera();
      setStatus('error');
      setErrorCode('unsupported');
      return undefined;
    }

    let disposed = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setStatus('requesting');
    setErrorCode('');

    requestLocalStream()
      .then(async (stream) => {
        if (disposed || requestId !== requestIdRef.current) {
          stopMediaStream(stream);
          return;
        }

        stopCamera();
        streamRef.current = stream;
        setStatus('ready');
        await bindStreamToVideo(stream);
      })
      .catch((error) => {
        if (disposed || requestId !== requestIdRef.current) {
          return;
        }

        stopCamera();
        setStatus('error');
        setErrorCode(mapCameraErrorCode(error));
      });

    return () => {
      disposed = true;
      stopCamera();
    };
  }, [enabled]);

  useEffect(() => {
    if (status === 'ready' && streamRef.current) {
      bindStreamToVideo(streamRef.current);
    }
  }, [status]);

  return {
    videoRef,
    status,
    errorCode,
  };
}
