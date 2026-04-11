import { useState, useRef, useEffect, useCallback } from "react";
import AgoraRTC, { ICameraVideoTrack } from "agora-rtc-sdk-ng";

export const useCamera = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraInfo, setCameraInfo] = useState<{
    deviceId?: string;
    label?: string;
    width?: number;
    height?: number;
  }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const agoraTrackRef = useRef<ICameraVideoTrack | null>(null);

  // Full camera enable function with Agora
  const startCamera = useCallback(async (options?: {
    width?: number;
    height?: number;
    facingMode?: "user" | "environment";
    constraints?: MediaStreamConstraints;
  }) => {
    try {
      console.log("🎥 [CAMERA] Starting Agora camera initialization...");
      setError(null);
      
      // Check if video element is available
      if (!videoRef.current) {
        console.error("❌ [CAMERA] Video element not available - component not mounted yet");
        setError("Camera not ready. Please try again in a moment.");
        return;
      }
      
      // Set default camera options
      const width = options?.width || 1280;
      const height = options?.height || 720;
      const facingMode = options?.facingMode || "user";
      
      console.log(`⚙️ [CAMERA] Agora configuration: ${width}x${height}, facing: ${facingMode}`);
      
      // Stop existing track if running
      if (agoraTrackRef.current) {
        agoraTrackRef.current.close();
        agoraTrackRef.current = null;
      }
      
      console.log("📡 [CAMERA] Requesting Agora camera permission...");
      
      // Initialize Agora camera track
      const cameraTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: {
          width: width,
          height: height,
          frameRate: 30
        },
        facingMode: facingMode
      });
      
      agoraTrackRef.current = cameraTrack;
      
      // Double-check video element is still available
      if (!videoRef.current) {
        throw new Error("Video element became unavailable during initialization");
      }
      
      // Set video element source and play
      console.log("🎬 [CAMERA] Attaching Agora stream to video element...");
      
      const mediaStreamTrack = cameraTrack.getMediaStreamTrack();
      const stream = new MediaStream([mediaStreamTrack]);
      
      // Set up video element
      videoRef.current.srcObject = stream;
      videoRef.current.autoplay = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error("Video element lost during setup"));
          return;
        }
        
        const timeoutId = setTimeout(() => {
          reject(new Error("Video loading timeout - camera may be in use"));
        }, 10000); // 10 second timeout
        
        videoRef.current.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          console.log("📹 [CAMERA] Video metadata loaded");
          resolve(true);
        };
        
        videoRef.current.onerror = (e) => {
          clearTimeout(timeoutId);
          console.error("❌ [CAMERA] Video element error:", e);
          reject(new Error("Video element error - camera may be in use"));
        };
      });
      
      // Start video playback
      try {
        await videoRef.current.play();
        console.log("▶️ [CAMERA] Video playback started successfully");
      } catch (playError) {
        console.warn("⚠️ [CAMERA] Video autoplay failed, attempting manual play:", playError);
        // Try manual play as fallback
        try {
          await videoRef.current.play();
        } catch (manualError) {
          console.error("❌ [CAMERA] Manual play also failed:", manualError);
          throw new Error("Camera is already in use by another application");
        }
      }
      
      // Update camera info
      setCameraInfo({
        label: mediaStreamTrack.label || 'Agora Camera',
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      });
      
      setIsActive(true);
      console.log("✅ [CAMERA] Camera successfully enabled and active via Agora!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
      console.error("❌ [CAMERA] Agora camera initialization failed:", errorMessage);
      setError(`Camera error: ${errorMessage}`);
      
      setIsActive(false);
      setCameraInfo({});
      
      // Cleanup on error
      if (agoraTrackRef.current) {
        agoraTrackRef.current.close();
        agoraTrackRef.current = null;
      }
    }
  }, []);

  // Enhanced stop camera function
  const stopCamera = useCallback(() => {
    console.log("⏹️ [CAMERA] Stopping Agora camera...");
    
    if (agoraTrackRef.current) {
      console.log("🔄 [CAMERA] Stopping Agora track...");
      agoraTrackRef.current.close();
      agoraTrackRef.current = null;
    }
    
    if (videoRef.current) {
      console.log("🎬 [CAMERA] Clearing video element source...");
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    
    setIsActive(false);
    setCameraInfo({});
    setError(null);
    
    console.log("✅ [CAMERA] Camera successfully stopped");
  }, []);

  // Switch camera function (for devices with multiple cameras)
  const switchCamera = useCallback(async () => {
    console.log("🔄 [CAMERA] Switching camera...");
    
    if (!isActive) {
      return;
    }
    
    // Simplistic switch: toggle facingMode between user and environment
    stopCamera();
    await startCamera({ facingMode: "environment" });
  }, [isActive, startCamera, stopCamera]);

  // Get camera capabilities (Agora abstracted)
  const getCameraCapabilities = useCallback(() => {
    if (!agoraTrackRef.current) return null;
    
    const mediaStreamTrack = agoraTrackRef.current.getMediaStreamTrack();
    const capabilities = mediaStreamTrack.getCapabilities?.();
    const settings = mediaStreamTrack.getSettings?.();
    
    return {
      capabilities,
      settings,
      info: cameraInfo
    };
  }, [cameraInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 [CAMERA] Cleaning up on component unmount...");
      if (agoraTrackRef.current) {
        agoraTrackRef.current.close();
        agoraTrackRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return {
    videoRef,
    isActive,
    error,
    cameraInfo,
    startCamera,
    stopCamera,
    switchCamera,
    getCameraCapabilities,
  };
};
