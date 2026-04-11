// Mock sign animation data
// In production, this would contain actual KSL gesture animations

export type SignAnimation = {
  word: string;
  animation: string; // In production, this would be animation data
  duration: number;
};

// Mock translation from text to sign animations
export const translateTextToSign = async (text: string): Promise<SignAnimation[]> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Split text into words and create mock animations
  const words = text.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
  
  return words.map(word => ({
    word,
    animation: `sign-${word}`, // Placeholder for animation identifier
    duration: 1000, // 1 second per sign
  }));
};

// Common KSL signs mapping
export const commonSigns: Record<string, string> = {
  hello: "Muraho",
  thanks: "Murakoze",
  yes: "Yego",
  no: "Oya",
  please: "Nyamuneka",
  sorry: "Mbabarira",
  how: "Ni gute",
  are: "ni",
  you: "wowe",
  good: "meza",
  morning: "mu gitondo",
  afternoon: "ku munsi",
  evening: "nimugoroba",
};

