import * as tf from "@tensorflow/tfjs";
import { Hands } from "@mediapipe/hands";
import { speakText, stopSpeaking } from "@/utils/textToSpeech";

export type Gesture = "hello" | "thanks" | "yes" | "no" | "please" | "sorry" | "unclear" | null;

// Translation mapping for gestures
export const gestureTranslations: Record<Exclude<Gesture, null> | "", { kinyarwanda: string; english: string }> = {
  hello: { kinyarwanda: "Muraho", english: "Hello" },
  thanks: { kinyarwanda: "Murakoze", english: "Thank you" },
  yes: { kinyarwanda: "Yego", english: "Yes" },
  no: { kinyarwanda: "Oya", english: "No" },
  please: { kinyarwanda: "Nyamuneka", english: "Please" },
  sorry: { kinyarwanda: "Mbabarira", english: "Sorry" },
  unclear: { kinyarwanda: "Ongera usubiremo (Icyizere kiri hasi)", english: "Please repeat (Low confidence)" },
  "": { kinyarwanda: "", english: "" },
};

// TensorFlow.js model instance
let gestureModel: tf.GraphModel | null = null;
let isModelLoaded = false;
let isProcessing = false;

// MediaPipe instances
let handsInstance: Hands | null = null;
let isMediaPipeReady = false;

// Speech configuration
let speechEnabled: boolean = true;
let speechLanguage: "kinyarwanda" | "english" = "english";
let lastSpokenGesture: Gesture = null;
let speechDebounceTime: number = 2000; // 2 seconds debounce

// Gesture classes mapping
const gestureClasses = ["hello", "thanks", "yes", "no", "please", "sorry"];

// Initialize MediaPipe Hands
const initializeMediaPipe = () => {
  try {
    console.log("🤚 [MEDIAPIPE] Initializing MediaPipe Hands...");
    
    handsInstance = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
    });

    handsInstance.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    console.log("✅ [MEDIAPIPE] MediaPipe Hands initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ [MEDIAPIPE] Failed to initialize MediaPipe:", error);
    return false;
  }
};

// Speech configuration functions
export const configureSpeech = (options: {
  enabled?: boolean;
  language?: "kinyarwanda" | "english";
  debounceTime?: number;
}) => {
  if (options.enabled !== undefined) {
    speechEnabled = options.enabled;
    console.log(`🔊 [SPEECH] Speech ${options.enabled ? 'enabled' : 'disabled'}`);
  }
  
  if (options.language) {
    speechLanguage = options.language;
    console.log(`🌐 [SPEECH] Speech language set to: ${options.language}`);
  }
  
  if (options.debounceTime !== undefined) {
    speechDebounceTime = options.debounceTime;
    console.log(`⏱️ [SPEECH] Speech debounce time set to: ${options.debounceTime}ms`);
  }
};

// Convert gesture to speech
const speakGesture = (gesture: Gesture, outputLanguage?: "kinyarwanda" | "english") => {
  if (!gesture || !speechEnabled) {
    return;
  }
  
  // Debounce: Don't speak the same gesture repeatedly
  if (lastSpokenGesture === gesture) {
    console.log(`🔇 [SPEECH] Debouncing repeated gesture: ${gesture}`);
    return;
  }
  
  const translation = gestureTranslations[gesture || ""] || { kinyarwanda: "", english: "" };
  const targetLanguage = outputLanguage || speechLanguage;
  const text = targetLanguage === "kinyarwanda" 
    ? translation.kinyarwanda 
    : translation.english;
  
  if (!text) return;

  console.log(`🔊 [SPEECH] Speaking gesture "${gesture}" in ${targetLanguage}: "${text}"`);
  
  try {
    speakText(text, targetLanguage);
    lastSpokenGesture = gesture;
    
    // Reset debounce after timeout
    setTimeout(() => {
      lastSpokenGesture = null;
    }, speechDebounceTime);
    
  } catch (error) {
    console.error("❌ [SPEECH] Failed to speak gesture:", error);
  }
};

// Stop speech
export const stopGestureSpeech = () => {
  console.log("🔇 [SPEECH] Stopping gesture speech");
  stopSpeaking();
  lastSpokenGesture = null;
};

// Load TensorFlow.js gesture recognition model
export const loadGestureModel = async (modelPath: string = "/model/model.json"): Promise<void> => {
  try {
    console.log("🤖 [GESTURE RECOGNITION] Starting TensorFlow.js model loading...");
    console.log(`📁 [GESTURE RECOGNITION] Model path: ${modelPath}`);
    
    // Initialize MediaPipe
    const mediaPipeSuccess = initializeMediaPipe();
    isMediaPipeReady = mediaPipeSuccess;
    
    // Load TensorFlow.js model
    gestureModel = await tf.loadGraphModel(modelPath);
    isModelLoaded = true;
    
    console.log("✅ [GESTURE RECOGNITION] TensorFlow.js model loaded successfully!");
    console.log("🤚 [MEDIAPIPE] MediaPipe status:", isMediaPipeReady ? "✅ READY" : "⚠️ FAILED");
    console.log("🎯 [GESTURE RECOGNITION] Available gestures:", gestureClasses.join(", "));
    console.log("🔧 [GESTURE RECOGNITION] Feature extraction ready");
    console.log("📊 [GESTURE RECOGNITION] Recognition system initialized");
    
    // Test model prediction structure
    console.log("🧪 [GESTURE RECOGNITION] Testing model structure...");
    const testInput = tf.zeros([1, 224, 224, 3]);
    const testOutput = gestureModel.predict(testInput) as tf.Tensor;
    console.log(`📐 [GESTURE RECOGNITION] Model output shape: [${testOutput.shape.join(', ')}]`);
    testInput.dispose();
    testOutput.dispose();
    
  } catch (error) {
    console.error("❌ [GESTURE RECOGNITION] Failed to load TensorFlow.js model:", error);
    console.log("🔄 [GESTURE RECOGNITION] Falling back to feature-based gesture recognition");
    isModelLoaded = false;
    // Continue with feature-based recognition if model loading fails
  }
};

// Process MediaPipe hand landmarks
const processHandLandmarks = (landmarks: any[]): Gesture => {
  if (!landmarks || landmarks.length === 0) return null;
  
  console.log("🤚 [MEDIAPIPE] Processing hand landmarks...");
  console.log(`📊 [MEDIAPIPE] Detected ${landmarks.length} hand(s) with ${landmarks[0].length} landmarks each`);
  
  // Extract key features from hand landmarks
  const hand = landmarks[0];
  
  // Get key points
  const wrist = hand[0];
  const thumbTip = hand[4];
  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];
  const indexMcp = hand[5];
  const middleMcp = hand[9];
  
  // Calculate distances and angles
  const thumbIndexDist = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) + 
    Math.pow(thumbTip.y - indexTip.y, 2)
  );
  
  const indexMiddleDist = Math.sqrt(
    Math.pow(indexTip.x - middleTip.x, 2) + 
    Math.pow(indexTip.y - middleTip.y, 2)
  );
  
  const handOpenness = (thumbTip.y - wrist.y) / (indexMcp.y - wrist.y);
  const fingerSpread = (pinkyTip.x - indexTip.x) / (middleMcp.x - indexMcp.x);
  
  console.log(`📏 [MEDIAPIPE] Hand features - Openness: ${handOpenness.toFixed(2)}, Spread: ${fingerSpread.toFixed(2)}, Thumb-Index: ${thumbIndexDist.toFixed(2)}`);
  
  // Custom gesture detection function
  const detectGesture = (landmarks: any[]): Gesture => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const wrist = landmarks[0];

    // Example gesture detection logic
    if (thumbTip.y < indexTip.y) {
      return "hello"; // Muraho - thumbs up
    }

    if (thumbTip.y > indexTip.y) {
      return "thanks"; // Murakoze - thumbs down
    }

    if (thumbTip.x < wrist.x - 0.05) {
      return "yes"; // Yego - thumb to the right
    }

    if (thumbTip.x > wrist.x + 0.05) {
      return "no"; // Oya - thumb to the left
    }

    if (indexTip.y < middleTip.y - 0.03) {
      return "please"; // Nyamuneka - index finger down
    }

    if (middleTip.y < wrist.y) {
      return "sorry"; // Mbabarira - middle finger down
    }

    return null; // No clear gesture detected
  };

  // Gesture classification based on landmarks
  if (thumbIndexDist < 0.05 && handOpenness > 0.7 && fingerSpread > 1.2) {
    console.log("👋 [MEDIAPIPE] Open hand detected -> Hello");
    return "hello";
  } else if (handOpenness < 0.3 && fingerSpread < 0.5) {
    console.log("👎 [MEDIAPIPE] Closed hand detected -> No");
    return "no";
  } else if (thumbIndexDist < 0.05 && handOpenness > 0.5 && handOpenness < 0.7) {
    console.log("👍 [MEDIAPIPE] Thumb-index close -> Yes");
    return "yes";
  } else if (handOpenness > 0.6 && fingerSpread < 0.8) {
    console.log("🙏 [MEDIAPIPE] Partial open hand -> Thanks");
    return "thanks";
  } else if (handOpenness > 0.4 && handOpenness < 0.7) {
    console.log("🤲 [MEDIAPIPE] Medium openness -> Please");
    return "please";
  } else if (middleTip.y > wrist.y) {
    console.log("🙏 [MEDIAPIPE] Middle finger down -> Sorry");
    return "sorry";
  }
  
  console.log("🤷 [MEDIAPIPE] No clear gesture from landmarks, returning unclear");
  return "unclear";
};

// Enhanced gesture prediction with MediaPipe + TensorFlow.js
export const predictGesture = async (frame: ImageData, videoElement?: HTMLVideoElement): Promise<Gesture> => {
  if (isProcessing) return null;
  
  isProcessing = true;

  try {
    console.log("🔍 [GESTURE RECOGNITION] Processing frame for gesture prediction...");
    console.log(`📏 [GESTURE RECOGNITION] Frame dimensions: ${frame.width}x${frame.height}`);
    
    // Priority 1: MediaPipe Hands (if available and video element provided)
    if (videoElement && handsInstance && isMediaPipeReady) {
      console.log("🤚 [GESTURE RECOGNITION] Using MediaPipe Hands for prediction");
      
      try {
        // Buffer the frame onto a canvas element. MediaPipe frequently throws WebGL errors or aborts
        // when attempting to process raw WebRTC (Agora) video elements natively.
        const mpCanvas = document.createElement("canvas");
        mpCanvas.width = frame.width;
        mpCanvas.height = frame.height;
        const ctxMp = mpCanvas.getContext("2d", { willReadFrequently: true });
        
        if (ctxMp) {
          ctxMp.putImageData(frame, 0, 0);
          await handsInstance.send({ image: mpCanvas });
        } else {
          await handsInstance.send({ image: videoElement });
        }
        
        // MediaPipe results will be handled in the onResults callback
        // For now, return null and let the callback handle the result
        console.log("🤚 [MEDIAPIPE] Frame sent to MediaPipe for processing");
        return null;
        
      } catch (error) {
        console.error("❌ [MEDIAPIPE] Fatal error processing frame. Disabling MediaPipe.", error);
        console.log("🔄 [GESTURE RECOGNITION] Falling back to feature-based tracking");
        
        // Disable MediaPipe to prevent infinite WebAssembly abort crashes and console overloading
        isMediaPipeReady = false;
      }
    }
    
    // Priority 2: TensorFlow.js model (if available)
    if (isModelLoaded && gestureModel) {
      console.log("🧠 [GESTURE RECOGNITION] Using TensorFlow.js model for prediction");
      
      const tensor = tf.browser.fromPixels(frame);
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);
      
      const prediction = gestureModel.predict(batched) as tf.Tensor;
      const predictedClass = tf.argMax(prediction, 1).dataSync()[0];
      const confidence = tf.max(prediction).dataSync()[0];
      
      // Clean up tensors
      tensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      prediction.dispose();
      
      console.log(`🎯 [GESTURE RECOGNITION] Model prediction: ${gestureClasses[predictedClass]} (${(confidence * 100).toFixed(1)}% confidence)`);
      
      if (confidence > 0.6) {
        const gesture = gestureClasses[predictedClass] as Gesture;
        console.log(`✅ [GESTURE RECOGNITION] TensorFlow.js gesture detected: ${gesture}`);
        return gesture;
      } else if (confidence > 0.25) {
        console.log(`⚠️ [GESTURE RECOGNITION] Low confidence (${(confidence * 100).toFixed(1)}%), using unclear`);
        return "unclear";
      } else {
        console.log("⚠️ [GESTURE RECOGNITION] Very low confidence, using feature-based detection");
      }
    }
    
    // Priority 3: Feature-based gesture recognition
    console.log("🔧 [GESTURE RECOGNITION] Using feature-based gesture recognition");
    const features = extractHandFeatures(frame);
    console.log(`📊 [GESTURE RECOGNITION] Extracted ${features.length} features`);
    
    const gesture = classifyGestureFromFeatures(features);
    if (gesture) {
      console.log(`✅ [GESTURE RECOGNITION] Feature-based gesture detected: ${gesture}`);
    } else {
      console.log("❓ [GESTURE RECOGNITION] No clear gesture detected");
    }
    
    return gesture;
  } catch (error) {
    console.error("❌ [GESTURE RECOGNITION] Error during gesture prediction:", error);
    return null;
  } finally {
    isProcessing = false;
  }
};

// Feature extraction for gesture recognition (fallback)
const extractHandFeatures = (frame: ImageData): number[] => {
  const features: number[] = [];
  const width = frame.width;
  const height = frame.height;
  const data = frame.data;
  
  // Simple hand detection based on skin color and motion
  let skinPixels = 0;
  let totalPixels = width * height;
  let brightness = 0;
  let contrast = 0;
  
  // Sample grid points for feature extraction
  const gridSize = 8;
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);
  const gridFeatures: number[] = [];
  
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let cellBrightness = 0;
      let cellContrast = 0;
      let skinPixelsInCell = 0;
      
      for (let y = gy * cellHeight; y < Math.min((gy + 1) * cellHeight, height); y++) {
        for (let x = gx * cellWidth; x < Math.min((gx + 1) * cellWidth, width); x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          brightness += (r + g + b) / 3;
          
          // Simple skin color detection
          if (r > 95 && g > 40 && b > 20 && 
              r > g && r > b && 
              Math.abs(r - g) > 15 && r - b > 15) {
            skinPixels++;
            skinPixelsInCell++;
          }
        }
      }
      
      gridFeatures.push(skinPixelsInCell / (cellWidth * cellHeight));
    }
  }
  
  // Calculate global features
  const skinRatio = skinPixels / totalPixels;
  const avgBrightness = brightness / totalPixels;
  
  // Edge detection for hand shape
  const edges = detectEdges(frame);
  const edgeDensity = edges / totalPixels;
  
  // Motion features (simplified)
  const motionFeatures = calculateMotionFeatures(frame);
  
  // Combine all features
  features.push(...gridFeatures, skinRatio, avgBrightness / 255, edgeDensity, ...motionFeatures);
  
  return features;
};

const detectEdges = (frame: ImageData): number => {
  const data = frame.data;
  const width = frame.width;
  const height = frame.height;
  let edges = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      const leftIdx = (y * width + (x - 1)) * 4;
      const left = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
      
      const topIdx = ((y - 1) * width + x) * 4;
      const top = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
      
      if (Math.abs(center - left) > 30 || Math.abs(center - top) > 30) {
        edges++;
      }
    }
  }
  
  return edges;
};

const calculateMotionFeatures = (frame: ImageData): number[] => {
  // Simplified motion detection based on color variation
  const data = frame.data;
  const width = frame.width;
  const height = frame.height;
  
  let horizontalMotion = 0;
  let verticalMotion = 0;
  let diagonalMotion = 0;
  
  for (let y = 0; y < height - 1; y += 4) {
    for (let x = 0; x < width - 1; x += 4) {
      const idx = (y * width + x) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;
      
      const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const right = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
      const bottom = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
      
      horizontalMotion += Math.abs(current - right);
      verticalMotion += Math.abs(current - bottom);
    }
  }
  
  return [horizontalMotion / (width * height), verticalMotion / (width * height)];
};

// Rule-based gesture classification from features
const classifyGestureFromFeatures = (features: number[]): Gesture => {
  const [skinRatio, brightness, edgeDensity, hMotion, vMotion] = features.slice(-5);
  
  console.log(`📈 [GESTURE RECOGNITION] Features - Skin: ${(skinRatio * 100).toFixed(1)}%, Edges: ${(edgeDensity * 100).toFixed(1)}%, H-Motion: ${hMotion.toFixed(3)}, V-Motion: ${vMotion.toFixed(3)}`);
  
  // If there's barely any hand/motion in frame, return null to completely avoid spamming
  if (skinRatio < 0.05) {
     return null;
  }
  
  // Simple rule-based classification
  if (skinRatio > 0.15 && edgeDensity > 0.02 && hMotion < 0.1 && vMotion < 0.1) {
    console.log("👋 [GESTURE RECOGNITION] Rule: Open hand, low motion -> Hello");
    return "hello";
  } else if (skinRatio > 0.12 && edgeDensity > 0.03 && hMotion > 0.15) {
    console.log("🙏 [GESTURE RECOGNITION] Rule: Hand with horizontal motion -> Thanks");
    return "thanks";
  } else if (skinRatio > 0.1 && hMotion < 0.05 && vMotion > 0.2) {
    console.log("👍 [GESTURE RECOGNITION] Rule: Vertical motion -> Yes");
    return "yes";
  } else if (skinRatio > 0.1 && hMotion > 0.2 && vMotion < 0.05) {
    console.log("👎 [GESTURE RECOGNITION] Rule: Horizontal shaking motion -> No");
    return "no";
  } else if (skinRatio > 0.08 && edgeDensity < 0.02 && (hMotion > 0.1 || vMotion > 0.1)) {
    console.log("🤲 [GESTURE RECOGNITION] Rule: Small hand with motion -> Please");
    return "please";
  } else if (skinRatio > 0.12 && edgeDensity < 0.01 && hMotion < 0.05 && vMotion < 0.05) {
    console.log("🙏 [GESTURE RECOGNITION] Rule: Closed hand, no motion -> Sorry");
    return "sorry";
  }
  
  // Only prompt to repeat if there's enough skin and motion to suggest an actual gesture attempt.
  // This prevents the face alone from constantly triggering 'unclear' spam.
  if (skinRatio > 0.08 && (hMotion + vMotion) > 0.1) {
    console.log("🤷 [GESTURE RECOGNITION] Motion detected but no rule matched, returning unclear");
    return "unclear";
  }
  
  return null;
};

// Capture frame from video for processing
export const captureFrame = (videoElement: HTMLVideoElement): ImageData | null => {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    console.warn("⚠️ [GESTURE RECOGNITION] Invalid video element or no video data");
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    console.error("❌ [GESTURE RECOGNITION] Failed to get canvas context");
    return null;
  }

  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  
  console.log(`📸 [GESTURE RECOGNITION] Frame captured: ${canvas.width}x${canvas.height} pixels`);
  return frame;
};

// Process video frames for gesture recognition with MediaPipe
let recognitionInterval: NodeJS.Timeout | null = null;
let currentVideoElement: HTMLVideoElement | null = null;
let currentGestureCallback: ((gesture: Gesture) => void) | null = null;

export const initializeVideoRecognition = (
  videoElement: HTMLVideoElement, 
  onGestureDetected: (gesture: Gesture) => void,
  speechOptions?: {
    enabled?: boolean;
    language?: "kinyarwanda" | "english";
    debounceTime?: number;
  }
) => {
  currentVideoElement = videoElement;
  currentGestureCallback = onGestureDetected;
  
  // Configure speech if options provided
  if (speechOptions) {
    configureSpeech(speechOptions);
  }
  
  console.log("🎬 [GESTURE RECOGNITION] Video recognition system initialized");
  console.log(`📹 [GESTURE RECOGNITION] Video element ready: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
  console.log("🔗 [GESTURE RECOGNITION] Gesture callback registered");
  console.log(`🔊 [SPEECH] Speech enabled: ${speechEnabled}, Language: ${speechLanguage}`);
  console.log("🚀 [GESTURE RECOGNITION] System ready for real-time processing");
  
  // Set up MediaPipe results handler if available
  if (handsInstance && isMediaPipeReady) {
    console.log("🤚 [GESTURE RECOGNITION] Setting up MediaPipe results handler...");
    
    handsInstance.onResults(async (results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0 && currentGestureCallback) {
        const landmarks = results.multiHandLandmarks;
        console.log("🤚 [MEDIAPIPE] Hand landmarks detected:", landmarks.length);
        
        // Process landmarks directly
        const gesture = processHandLandmarks(landmarks);
        if (gesture) {
          console.log(`🎉 [GESTURE RECOGNITION] SUCCESS: ${gesture.toUpperCase()} detected via MediaPipe`);
          
          // Trigger UI callback
          currentGestureCallback(gesture);
          
          // Speak the gesture
          speakGesture(gesture, speechLanguage);
          
        } else {
          console.log("🤷 [MEDIAPIPE] No clear gesture detected from existing landmarks, falling back to other methods");
          
          // Fallback to TensorFlow.js or feature-based
          if (currentVideoElement) {
            const frame = captureFrame(currentVideoElement);
            if (frame) {
              const fallbackGesture = await predictGesture(frame);
              if (fallbackGesture) {
                currentGestureCallback(fallbackGesture);
                speakGesture(fallbackGesture, speechLanguage);
              }
            }
          }
        }
      }
    });
  }
};

export const startVideoRecognition = () => {
  if (recognitionInterval) {
    clearInterval(recognitionInterval);
  }

  console.log("▶️ [GESTURE RECOGNITION] Starting enhanced video recognition...");
  console.log(`⏱️ [GESTURE RECOGNITION] Processing interval: 800ms`);
  console.log(`🎯 [GESTURE RECOGNITION] Available gestures: ${gestureClasses.length} types`);
  console.log(`🧠 [GESTURE RECOGNITION] TensorFlow.js model: ${isModelLoaded ? 'LOADED' : 'FALLBACK'}`);
  console.log(`🤚 [GESTURE RECOGNITION] MediaPipe: ${isMediaPipeReady ? 'READY' : 'FALLBACK'}`);
  
  // Start interval-based processing (works with existing camera)
  recognitionInterval = setInterval(async () => {
    if (currentVideoElement && currentGestureCallback) {
      const frame = captureFrame(currentVideoElement);
      if (frame) {
        // Try MediaPipe first (if available), then fallback to other methods
        const gesture = await predictGesture(frame, currentVideoElement);
        if (gesture) {
          console.log(`🎉 [GESTURE RECOGNITION] SUCCESS: ${gesture.toUpperCase()} detected via hybrid processing`);
          
          // Trigger UI callback
          currentGestureCallback(gesture);
          
          // Speak the gesture
          speakGesture(gesture, speechLanguage);
        }
      }
    }
  }, 800); // Process every 800ms for better responsiveness
  
  console.log("✅ [GESTURE RECOGNITION] Hybrid recognition loop started");
  console.log(`🔊 [SPEECH] Automatic speech enabled for gestures`);
};

export const stopVideoRecognition = () => {
  if (recognitionInterval) {
    clearInterval(recognitionInterval);
    recognitionInterval = null;
  }
  
  console.log("⏹️ [GESTURE RECOGNITION] Enhanced video recognition stopped");
  console.log("🔄 [GESTURE RECOGNITION] System reset - ready for next session");
};

// Legacy function for backward compatibility
export const recognizeGesture = async (videoElement?: HTMLVideoElement): Promise<Gesture> => {
  if (!videoElement) {
    console.warn("⚠️ [GESTURE RECOGNITION] No video element provided to legacy function");
    return null;
  }
  
  console.log("🔄 [GESTURE RECOGNITION] Using legacy gesture recognition function");
  const frame = captureFrame(videoElement);
  if (!frame) return null;
  
  return await predictGesture(frame, videoElement);
};

// System health check
export const checkSystemHealth = () => {
  console.log("🏥 [GESTURE RECOGNITION] System Health Check:");
  console.log(`  🤖 TensorFlow.js: ${isModelLoaded ? '✅ ACTIVE' : '⚠️ FALLBACK'}`);
  console.log(`  🤚 MediaPipe: ${isMediaPipeReady ? '✅ ACTIVE' : '⚠️ FALLBACK'}`);
  console.log(`  📹 Video Element: ${currentVideoElement ? '✅ CONNECTED' : '❌ NOT CONNECTED'}`);
  console.log(`  🔄 Recognition Loop: ${recognitionInterval ? '✅ RUNNING' : '⏸️ STOPPED'}`);
  console.log(`  🎯 Callback: ${currentGestureCallback ? '✅ REGISTERED' : '❌ NOT REGISTERED'}`);
  console.log(`  📊 Processing: ${isProcessing ? '⏳ BUSY' : '✅ READY'}`);
  console.log(`  🔊 Speech: ${speechEnabled ? '✅ ENABLED' : '❌ DISABLED'} (${speechLanguage})`);
  console.log(`  🎭 Available Gestures: ${gestureClasses.length}`);
  
  return {
    tensorflowLoaded: isModelLoaded,
    mediaPipeReady: isMediaPipeReady,
    videoConnected: !!currentVideoElement,
    recognitionRunning: !!recognitionInterval,
    callbackRegistered: !!currentGestureCallback,
    isProcessing,
    speechEnabled,
    speechLanguage,
    gestureCount: gestureClasses.length
  };
};
